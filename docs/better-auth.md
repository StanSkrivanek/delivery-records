# Better Auth Integration

This document describes the current Better Auth implementation in this app and how to operate it. It’s a Postgres-native auth layer (no ORM) that can run on plain Postgres or Supabase Postgres. It’s integrated into SvelteKit with SSR, HttpOnly cookies, route protection, session sliding TTL, and rate-limited login attempts.

Note: Some snippets are simplified for clarity. They reflect the app’s actual files under src/lib and src/routes.

## Why this Better Auth layer

- Simple, self-hostable, Postgres-backed auth with full control over schema and policies
- Centralized SSR cookie and session handling
- Route protection via SvelteKit hooks
- Works on standard Postgres or Supabase Postgres (benefit from Supabase’s managed infra and RLS)

## Installation

Use pnpm (preferred):

```sh path=null start=null
# Already present in this repo: pg, bcrypt
# If needed, install
pnpm add pg bcrypt
```

## Configuration Overview

Environment variables (server-only secrets NOT committed):

```env path=null start=null
# Database connection for src/lib/db.ts
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:6543/postgres
# Prefer pooled URL when running on Supabase (see connection-pooling.md)

# Cookie settings (these defaults are set in code; override if needed)
SESSION_COOKIE_NAME=session_id
SESSION_COOKIE_SAMESITE=strict
SESSION_COOKIE_SECURE=false
```

## SvelteKit Integration (SSR)

This project wires auth in src/hooks.server.ts using a Postgres-backed Better Auth module at src/lib/auth.ts.

Key behaviors implemented:

- Reads session_id from HttpOnly cookie
- Validates session against public.sessions table and loads the user from public.users
- Sliding sessions: refreshes expiry and cookie on each request
- Defines public routes and redirects others to /auth/login if unauthenticated
- Periodic cleanup of expired sessions

hooks.server.ts (excerpt from this project):

```ts path=/Users/stan/desktop/fleet_delivery_records/src/hooks.server.ts start=1
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';

// Initialize Postgres-backed auth (no ORM)
const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });

// Public routes that don't require authentication
const publicRoutes = ['/', '/health', '/auth/login', '/auth/register'];

const authHandle: Handle = async ({ event, resolve }) => {
	// Get session from cookie
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		const session = await auth.getSession(sessionId);

		if (session) {
			const user = await auth.getUserById(session.user_id);
			if (user && user.is_active) {
				// Sliding session: refresh expiry and last_seen, refresh cookie
				await auth.updateSessionActivity(sessionId);
				event.locals.user = user;
				event.locals.session = { id: sessionId, ...session };
				// refresh cookie TTL
				event.cookies.set('session_id', sessionId, {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 60 * 60 * 24 * 30
				});
			} else {
				// Invalid session, clear cookie
				event.cookies.delete('session_id', { path: '/' });
			}
		} else {
			// Expired session, clear cookie
			event.cookies.delete('session_id', { path: '/' });
		}
	}

	// Check if route requires authentication
	const isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));

	if (!isPublicRoute && !event.locals.user) {
		// Redirect to login if not authenticated
		throw redirect(303, '/auth/login');
	}

	// If logged in and trying to access login page, redirect to home
	if (event.locals.user && event.url.pathname === '/auth/login') {
		throw redirect(303, '/dashboard');
	}

	const response = await resolve(event);
	return response;
};

// Clean expired sessions periodically
const cleanupHandle: Handle = async ({ event, resolve }) => {
	// Run cleanup once every 100 requests (adjust as needed)
	if (Math.random() < 0.01) {
		auth.cleanExpiredSessions().catch(console.error);
	}
	return resolve(event);
};

export const handle = sequence(cleanupHandle, authHandle);
```

Wire it into SvelteKit hooks:

```ts path=null start=null
// src/hooks.server.ts (pseudocode)
import type { Handle } from '@sveltejs/kit';
import { createAuthLocals } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const { supabase, betterAuth } = createAuthLocals(event);
	event.locals.supabase = supabase;
	event.locals.auth = betterAuth;

	// Optionally, enforce auth on certain paths
	if (event.url.pathname.startsWith('/app')) {
		const { data } = await betterAuth.getSession();
		if (!data?.session) {
			return new Response(null, { status: 302, headers: { Location: '/login' } });
		}
	}

	return resolve(event);
};
```

Use in server routes and +page.server.ts:

```ts path=/Users/stan/desktop/fleet_delivery_records/src/routes/auth/login/+page.server.ts start=1
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';
import bcrypt from 'bcrypt';

const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, redirect to home
	if (locals.user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		// Validate inputs
		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required',
				email
			});
		}

		// Throttle: block after 5 failed attempts in the last 15 minutes per email or IP
		const ip = getClientAddress();
		const { rows: attemptRows } = await pgPool.query(
			`select count(*)::int as cnt from public.auth_attempts
		   where (email = $1 or ip = $2)
		     and success = false
		     and attempted_at > now() - interval '15 minutes'`,
			[email, ip]
		);
		if ((attemptRows?.[0]?.cnt ?? 0) >= 5) {
			return fail(429, { error: 'Too many attempts. Try again later.', email });
		}

		// Check if user exists
		const user = await auth.getUserByEmail(email);
		if (!user) {
			await pgPool.query(
				`insert into public.auth_attempts (email, ip, success) values ($1, $2, false)`,
				[email, ip]
			);
			return fail(400, {
				error: 'Invalid email or password',
				email
			});
		}

		// Check if user is active
		if (!user.is_active) {
			return fail(400, {
				error: 'Your account has been deactivated. Please contact your administrator.',
				email
			});
		}

		// Verify password
		const validPassword = await bcrypt.compare(password, user.password_hash!);
		if (!validPassword) {
			await pgPool.query(
				`insert into public.auth_attempts (email, ip, success) values ($1, $2, false)`,
				[email, ip]
			);
			return fail(400, {
				error: 'Invalid email or password',
				email
			});
		}

		// Log successful auth attempt
		await pgPool.query(
			`insert into public.auth_attempts (email, ip, success) values ($1, $2, true)`,
			[email, ip]
		);

		// Create session with context
		const ua = request.headers.get('user-agent') || undefined;
		const { id: sessionId } = await auth.createSession(user.id!, { ip, userAgent: ua });

		// Update last login
		await auth.touchLastLogin(user.id!);

		// Set cookie
		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(303, '/dashboard');
	}
};
```

Access user on the server layout:

```ts path=/Users/stan/desktop/fleet_delivery_records/src/routes/+layout.server.ts start=1
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					id: locals.user.id,
					email: locals.user.email,
					first_name: locals.user.first_name,
					last_name: locals.user.last_name,
					role: locals.user.role,
					organization_id: locals.user.organization_id
				}
			: null
	};
};
```

## Route Protection Patterns

- Server guard in hooks.server.ts (recommended)
- Client-side guard (optional) for improved UX; never rely on it as the only protection
- Use HTTP 302 redirects on unauthenticated access to protected routes

## Passwordless, OAuth, MFA, Passkeys

Better Auth can wrap these Supabase flows:

- Magic link / OTP: `locals.auth.signInWithOtp(email)` and handle verification callback route
- OAuth: `locals.auth.signInWithOAuth({ provider })`; ensure redirect URLs are whitelisted in Supabase
- MFA/Passkeys: configure via Supabase dashboard; expose flows through Better Auth wrapper if needed

## Cookies and Security

- Cookie name: session_id (configurable in hooks via createBetterAuth)
- HttpOnly, SameSite=strict, Secure=true in production
- Sliding TTL: hooks refresh cookie maxAge on each authenticated request

## Database Schema and Policies

Core tables used by this implementation:

```sql path=null start=null
-- Users table
create table if not exists public.users (
  id serial primary key,
  email text unique not null,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  organization_id int,
  role text not null default 'driver',
  is_active boolean not null default true,
  last_login_at timestamptz
);

-- Sessions table
create table if not exists public.sessions (
  id text primary key,
  user_id int not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen timestamptz,
  expires_at timestamptz not null,
  ip text,
  user_agent text
);

-- Login attempts for throttling
create table if not exists public.auth_attempts (
  id bigserial primary key,
  email text,
  ip text,
  success boolean not null,
  attempted_at timestamptz not null default now()
);
create index if not exists auth_attempts_recent_idx
  on public.auth_attempts (attempted_at desc);

-- Password reset tokens (hashed)
create table if not exists public.password_reset_tokens (
  id bigserial primary key,
  user_id int not null references public.users(id) on delete cascade,
  token_hash bytea not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  ip text,
  user_agent text
);
create index if not exists prt_valid_idx
  on public.password_reset_tokens (user_id, expires_at) where used_at is null;
```

If you deploy on Supabase Postgres, you can enable RLS and write policies accordingly (see security-and-policies.md). Example owner-based policy:

```sql path=null start=null
alter table public.sessions enable row level security;
create policy "read own sessions" on public.sessions for select using (
  auth.uid() = user_id
);
```

## Session Management Utilities

Implemented in src/lib/auth.ts:

- createSession(userId, ctx) stores session with expires_at and context (ip, user_agent)
- getSession(sessionId) returns valid session
- updateSessionActivity(sessionId) updates last_seen and extends expires_at (sliding expiration)
- listSessions(userId) returns session list for account management
- revokeSession(userId, sessionId) and revokeAllSessions(userId) to invalidate sessions
- cleanExpiredSessions() removes expired sessions (hooks call it periodically)

## Testing

- Unit test createBetterAuth with a test database (or a transaction wrapper) and stub bcrypt
- Integration test protected routes by simulating cookies in SvelteKit load/actions
- Verify throttling: exceed 5 failed attempts in 15 minutes and expect 429

## Operations and Deployment Notes

- Use the pooled DATABASE_URL in production serverless environments (see connection-pooling.md)
- Tune pg Pool size (src/lib/db.ts) and timeouts for your platform
- Set Secure cookies in production and use SameSite=strict
- Rotate bcrypt cost factor if needed (default 12 here)

## Troubleshooting

- Redirect loop -> ensure `getSession()` resolves before redirecting
- 401 from data APIs -> check cookies, domain, and SameSite settings
- OAuth callback mismatch -> verify dashboard Redirect URLs

## Summary

- Better Auth provides a higher-level, framework-friendly layer on top of Supabase Auth
- Centralizes SSR + cookie handling, reduces duplication, and standardizes route protection
- Works with RLS to protect user data by ensuring requests are authenticated and scoped
