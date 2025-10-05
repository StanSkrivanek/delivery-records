-- Add auth_attempts table for login throttling
create table if not exists public.auth_attempts (
  id bigserial primary key,
  email text,
  ip text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_auth_attempts_email_time on public.auth_attempts (email, attempted_at);
create index if not exists idx_auth_attempts_ip_time on public.auth_attempts (ip, attempted_at);
