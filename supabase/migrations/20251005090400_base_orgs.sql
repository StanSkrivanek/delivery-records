-- Base migration to ensure organizations exists before other FKs
create table if not exists public.organizations (
  id bigserial primary key,
  name text not null,
  legal_name text,
  vat_number text,
  tax_id text,
  phone text,
  email text,
  address text,
  city text,
  postal_code text,
  country text default 'Ireland',
  logo_url text,
  is_active boolean default true,
  settings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organizations_active on public.organizations(is_active);
