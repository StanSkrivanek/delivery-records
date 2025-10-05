-- Enhance sessions with ip, user_agent, last_seen
alter table public.sessions
  add column if not exists ip text,
  add column if not exists user_agent text,
  add column if not exists last_seen timestamptz default now();

create index if not exists idx_sessions_user_last_seen on public.sessions (user_id, last_seen desc);
