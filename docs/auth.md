# Auth: Features, Flows, and Data Protection

This document covers Supabase Auth capabilities, how we use them, and how they protect user data in this app.

## Key Concepts

- Users: Managed by Supabase (auth.users table)
- Sessions: Access + refresh tokens (JWT) for stateless auth
- Providers: Email/password, Magic Link, OAuth, Phone OTP, Passkeys (WebAuthn)
- MFA: TOTP or WebAuthn as second factor
- RLS: Row-Level Security enforces per-user/tenant access on tables and storage

## Client Initialization

```ts path=null start=null
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

## Sign Up and Sign In

Email/password:

```ts path=null start=null
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
	email: emailInput,
	password: passwordInput
});

const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
	email: emailInput,
	password: passwordInput
});
```

Magic link:

```ts path=null start=null
const { data, error } = await supabase.auth.signInWithOtp({ email });
```

OAuth:

```ts path=null start=null
const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
```

Phone OTP:

```ts path=null start=null
const { data, error } = await supabase.auth.signInWithOtp({ phone: '+15551234567' });
```

Passkeys (WebAuthn) and MFA: Configure in the Supabase dashboard; client flows are supported via supabase-js methods.

## Session Management

- On the client, supabase-js persists the session by default.
- On the server (SSR/APIs), initialize a server client and handle cookies securely.

Example (Node/Express-like pseudocode):

```ts path=null start=null
import { createClient } from '@supabase/supabase-js';

export function createServerSupabase(req, res) {
	return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
		auth: {
			persistSession: false,
			detectSessionInUrl: false,
			flowType: 'pkce'
		},
		cookies: {
			get(name) {
				return req.cookies[name];
			},
			set(name, value, options) {
				res.cookie(name, value, options);
			},
			remove(name, options) {
				res.clearCookie(name, options);
			}
		}
	});
}
```

Sign out:

```ts path=null start=null
await supabase.auth.signOut();
```

Refresh tokens are rotated by supabase-js; server routes must pass through cookies or Authorization headers securely.

## Protecting Data with RLS

- RLS is enabled per table; policies reference `auth.uid()` and JWT claims.
- Users can only access rows they own (or as defined by tenant membership).

Example: Profiles table (1:1 with users)

```sql path=null start=null
alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using ( auth.uid() = id );

create policy "Users can update own profile" on public.profiles
  for update using ( auth.uid() = id );

create policy "Create profile on signup" on public.profiles
  for insert with check ( auth.uid() = id );
```

Example: Deliveries table (owned by user)

```sql path=null start=null
alter table public.deliveries enable row level security;

create policy "read own deliveries" on public.deliveries
  for select using ( auth.uid() = user_id );

create policy "insert own deliveries" on public.deliveries
  for insert with check ( auth.uid() = user_id );

create policy "update own deliveries" on public.deliveries
  for update using ( auth.uid() = user_id );
```

## Storage Security

- Mirror table access with storage policies. Use signed URLs for temporary access.

```sql path=null start=null
-- Example storage policy for bucket 'proofs'
create policy "read own proofs" on storage.objects
  for select using (
    bucket_id = 'proofs' and owner = auth.uid()
  );

create policy "write own proofs" on storage.objects
  for insert with check (
    bucket_id = 'proofs' and owner = auth.uid()
  );
```

## Admin Operations and Service Role

- Use the service role key only on the server (never in the browser/mobile app).
- With service role, RLS can be bypassed: ensure you add explicit checks in server code.

Example server-only usage:

```ts path=null start=null
const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data, error } = await admin.auth.admin.listUsers();
```

## Auditability and Logs

- Supabase dashboard shows Auth logs, API requests, and database logs.
- Consider writing application events to a dedicated audit table with RLS-aware read access.

## Rate Limiting and Abuse Protection

- Supabase applies sane defaults; implement additional limits in API routes or Edge Functions if exposing high-risk endpoints.

## Password Reset and Email Change

- Use built-in email flows; ensure redirect URLs are whitelisted in the dashboard.

```ts path=null start=null
await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback` });
```

## Multi-Tenancy (Optional)

- Add an `org_id` column to tables and include it in JWT via custom claims or lookup. RLS policies should check org membership.

## Summary of How Auth Protects Data

- JWT-based identity ensures every request is authenticated
- RLS enforces per-row access rules using `auth.uid()` and claims
- Storage policies mirror access control for files
- Service role restricted to server-only contexts
- MFA and passkeys reduce account takeover risk
