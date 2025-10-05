# Supabase Overview and Architecture

This document explains how we use Supabase in this app and how it fits into the overall architecture.

## What is Supabase?

Supabase is a hosted backend built on Postgres providing:

- Database (managed Postgres)
- APIs (auto-generated via PostgREST)
- Authentication (users, sessions, OAuth, OTP, passkeys, MFA)
- Storage (S3-compatible object storage with policies)
- Realtime (Postgres replication-based)
- Edge Functions (serverless functions close to users)

We primarily interact using:

- supabase-js (client and server-side usage)
- Row-Level Security (RLS) to protect data
- Optional direct Postgres connections (for migrations, scripts, or heavy jobs)

## High-Level Architecture

- Client apps use supabase-js with the anonymous public key to call PostgREST and Auth endpoints.
- Server code (if present) uses a service role key (never exposed to the client) for privileged operations like background jobs.
- RLS policies on tables enforce per-user and per-tenant access.
- Storage buckets use policies mirroring table access rules.
- Optional direct database access can use connection pooling for scalability and reliability.

## Environments and Keys

Environment variables (never commit secrets):

- SUPABASE_URL: Base URL of the Supabase project
- SUPABASE_ANON_KEY: Public anonymous key for browser/mobile clients
- SUPABASE_SERVICE_ROLE_KEY: Server-only key for privileged operations

Example server-side initialization:

```ts path=null start=null
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false }
});
```

Example client-side initialization:

```ts path=null start=null
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

## Recommended Table Pattern

- public.users is managed by Supabase Auth (auth.users)
- Create an app-specific profile table (e.g., public.profiles) with a 1:1 relationship to auth.users.id
- Reference the auth.uid() in RLS policies for per-user access

Example schema snippet:

```sql path=null start=null
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
```

## Working with Realtime

Subscribe to changes where needed:

```ts path=null start=null
const channel = supabase
	.channel('public:deliveries')
	.on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, (payload) => {
		console.log('Change received!', payload);
	})
	.subscribe();
```

## Storage Overview

- Use buckets with policy rules restricting who can read/write.
- Prefer signed URLs for temporary access.

Generate signed URL:

```ts path=null start=null
const { data, error } = await supabase.storage
	.from('proofs')
	.createSignedUrl('delivery-123/photo.jpg', 60);
```

## Edge Functions (Optional)

- Use for server-side logic that must run close to users.
- Do not include service role keys in client code; read them at runtime via environment variables.

## Monitoring and Logs

- Use Supabase dashboard logs for API, auth, and function logs.
- Consider adding application-level tracing if you run server code.
