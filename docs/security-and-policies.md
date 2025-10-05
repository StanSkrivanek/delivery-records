# Security and Row-Level Security (RLS) Policies

This document focuses on how we protect user data at the database and API layers.

## Principles
- Least privilege by default
- RLS enabled on all application tables
- Service role key never exposed to untrusted environments
- All file access via Storage policies or signed URLs

## Enabling RLS
```sql path=null start=null
alter table public.profiles enable row level security;
alter table public.deliveries enable row level security;
-- Repeat for all app tables
```

## Common Policy Patterns
1) Owner-based access:
```sql path=null start=null
create policy "read own" on public.t
  for select using ( auth.uid() = t.owner_id );

create policy "write own" on public.t
  for insert with check ( auth.uid() = t.owner_id );

create policy "update own" on public.t
  for update using ( auth.uid() = t.owner_id );
```

2) Organization membership:
```sql path=null start=null
create or replace function is_org_member(org uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.org_members m
    where m.org_id = org and m.user_id = auth.uid()
  );
$$;

create policy "org read" on public.t
  for select using ( is_org_member(t.org_id) );
```

3) Read public metadata, restrict writes:
```sql path=null start=null
create policy "public read" on public.public_metadata for select using ( true );
create policy "admins write" on public.public_metadata for all using ( auth.role() = 'service_role' );
```

## Storage Policies
```sql path=null start=null
create policy "proofs read own" on storage.objects
  for select using (
    bucket_id = 'proofs' and owner = auth.uid()
  );

create policy "proofs write own" on storage.objects
  for insert with check (
    bucket_id = 'proofs' and owner = auth.uid()
  );
```

## Handling the Service Role Key
- Only load `SUPABASE_SERVICE_ROLE_KEY` in server runtimes (Edge Functions, serverless functions, backend services)
- Never ship it to the client
- Even with the service role, implement explicit authorization checks in server code

## Secrets Management
- Use environment variables or your platform’s secret manager
- Never log secrets
- Do not echo secrets in terminal output

## Auditing
- Create an audit table and write key events (login, critical updates)
- Use RLS to restrict who can read audit data

```sql path=null start=null
create table if not exists public.audit_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor uuid references auth.users(id),
  event text not null,
  meta jsonb
);

alter table public.audit_events enable row level security;
create policy "read own audit" on public.audit_events for select using ( auth.uid() = actor );
```

## Testing Policies
- Use the Supabase SQL editor to `set request.jwt.claim` during tests
- Write integration tests that exercise RLS via supabase-js

## Incident Response
- Rotate keys (anon and service role) if exposure is suspected
- Revoke sessions for affected users
- Review logs for anomalous access
