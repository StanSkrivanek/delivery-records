-- Password reset and email verification tokens (hash-only)
create table if not exists public.password_reset_tokens (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  token_hash bytea not null unique, -- sha256(raw token)
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  ip inet,
  user_agent text
);

create index if not exists idx_prt_user on public.password_reset_tokens (user_id);
create index if not exists idx_prt_expires_at on public.password_reset_tokens (expires_at);

create table if not exists public.email_verification_tokens (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  token_hash bytea not null unique, -- sha256(raw token)
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  ip inet,
  user_agent text
);

create index if not exists idx_evt_user on public.email_verification_tokens (user_id);
create index if not exists idx_evt_expires_at on public.email_verification_tokens (expires_at);
