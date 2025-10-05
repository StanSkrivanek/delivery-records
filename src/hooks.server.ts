import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';

// Initialize Postgres-backed auth (no ORM)
const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });

// Public routes that don't require authentication
// Use exact matches for root-like paths and prefix matches for sections
const publicExact = ['/', '/health'];
const publicPrefixes = ['/auth/', '/blog', '/contact'];

// Optional soft deadline for auth lookups on public routes to avoid slow first paint
const PUBLIC_AUTH_DEADLINE_MS = Number(process.env.PUBLIC_AUTH_DEADLINE_MS ?? '150');

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<{ ok: true; value: T } | { ok: false; reason: 'timeout' }>{
	return await Promise.race([
		p.then((value) => ({ ok: true as const, value })),
		new Promise<{ ok: false; reason: 'timeout' }>((resolve) =>
			setTimeout(() => resolve({ ok: false, reason: 'timeout' }), ms)
		)
	]);
}

const authHandle: Handle = async ({ event, resolve }) => {
	// Public route fast-path: if no session cookie and public, skip any DB work
	const pathname = event.url.pathname;
	const isPublicRoute =
		publicExact.includes(pathname) || publicPrefixes.some((p) => pathname.startsWith(p));
	const sessionId = event.cookies.get('session_id');
	if (isPublicRoute && !sessionId) {
		return resolve(event);
	}

	// Lightweight perf timings for auth pipeline (dev only)
	let tSession = 0;
	let tUser = 0;
	let tUpdate = 0;

	// If we have a session cookie, try to validate it
	if (sessionId) {
		try {
			const t0 = Date.now();
			let session: any = null;
			if (isPublicRoute && PUBLIC_AUTH_DEADLINE_MS > 0) {
				const res = await withTimeout(auth.getSession(sessionId), PUBLIC_AUTH_DEADLINE_MS);
				if (res.ok) session = res.value;
				else {
					// Timed out on public route: skip auth and render public quickly
					if (process.env.NODE_ENV !== 'production') {
						console.warn(`[perf-auth-timeout] getSession deadline ${PUBLIC_AUTH_DEADLINE_MS}ms on ${event.url.pathname}`);
					}
				}
			} else {
				session = await auth.getSession(sessionId);
			}
			tSession = Date.now() - t0;
			if (session) {
				const t1 = Date.now();
				let user: any = null;
				if (isPublicRoute && PUBLIC_AUTH_DEADLINE_MS > 0) {
					const res2 = await withTimeout(auth.getUserById(session.user_id), PUBLIC_AUTH_DEADLINE_MS);
					if (res2.ok) user = res2.value;
					else {
						if (process.env.NODE_ENV !== 'production') {
							console.warn(`[perf-auth-timeout] getUserById deadline ${PUBLIC_AUTH_DEADLINE_MS}ms on ${event.url.pathname}`);
						}
					}
				} else {
					user = await auth.getUserById(session.user_id);
				}
				tUser = Date.now() - t1;
				if (user && user.is_active) {
					// Attach user/session to locals for downstream loads/layouts
					event.locals.user = user;
					event.locals.session = { id: sessionId, ...session };

					// For public routes, avoid DB writes to reduce latency.
					// Only refresh activity and cookie TTL on non-public requests.
					if (!isPublicRoute) {
						const t2 = Date.now();
						// Sliding session: refresh expiry and last_seen, refresh cookie
						await auth.updateSessionActivity(sessionId);
						tUpdate = Date.now() - t2;
						event.cookies.set('session_id', sessionId, {
							path: '/',
							httpOnly: true,
							sameSite: 'strict',
							secure: process.env.NODE_ENV === 'production',
							maxAge: 60 * 60 * 24 * 30
						});
					}
				} else {
					// Invalid session, clear cookie
					event.cookies.delete('session_id', { path: '/' });
				}
			} else {
				// Expired session, clear cookie
				event.cookies.delete('session_id', { path: '/' });
			}

			// Dev-only: log when any auth step is slow
			if (
				process.env.NODE_ENV !== 'production' &&
				(Math.max(tSession, tUser, tUpdate) > 100 || (tSession + tUser + tUpdate) > 200)
			) {
				console.log(
					`[perf-auth] ${event.request.method} ${pathname} public=${isPublicRoute} ` +
					`t_session=${tSession}ms t_user=${tUser}ms t_update=${tUpdate}ms`
				);
			}
		} catch {
			// Fail open for public routes if DB hiccups
			if (isPublicRoute) {
				return resolve(event);
			}
			// Otherwise, treat as unauthenticated
			event.cookies.delete('session_id', { path: '/' });
		}
	}

	// Auth gate
	if (!isPublicRoute && !event.locals.user) {
		throw redirect(303, '/auth/login');
	}

	// Redirect logged-in users away from login page
	if (event.locals.user && event.url.pathname === '/auth/login') {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};

// Clean expired sessions periodically
const cleanupHandle: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	const dt = Date.now() - start;
	// Dev-only perf log for slow requests (>200ms)
	if (process.env.NODE_ENV !== 'production' && dt > 200) {
		console.log(`[perf] ${event.request.method} ${event.url.pathname} ${dt}ms`);
	}
	// Do cleanup in the background so it never blocks
	if (Math.random() < 0.01) {
		setTimeout(() => {
			auth.cleanExpiredSessions().catch(console.error);
		}, 0);
	}
	return response;
};

export const handle = sequence(cleanupHandle, authHandle);
