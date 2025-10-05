-- Supabase migration: initialize auth and core tables for Postgres
-- Generated for local development (no ORM)

-- Users
create table if not exists public.users (
  id bigserial primary key,
  email text unique not null,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  role text not null check (role in ('super_admin','org_admin','depot_manager','driver','viewer')) default 'driver',
  is_active boolean default true,
  organization_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz,
  constraint fk_users_org foreign key (organization_id) references public.organizations(id) on delete set null
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_organization on public.users(organization_id);
create index if not exists idx_users_role on public.users(role);

-- Organizations
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

-- Depots
create table if not exists public.depots (
  id bigserial primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  address text,
  city text,
  postal_code text,
  phone text,
  email text,
  manager_id bigint references public.users(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_depots_organization on public.depots(organization_id);
create index if not exists idx_depots_active on public.depots(is_active);

-- Vehicles
create table if not exists public.vehicles (
  id bigserial primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  depot_id bigint references public.depots(id) on delete set null,
  license_plate text not null,
  make text,
  model text,
  year integer,
  vin text,
  initial_odometer integer default 0,
  current_odometer integer default 0,
  fuel_type text check (fuel_type in ('diesel','petrol','electric','hybrid')),
  is_active boolean default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_organization on public.vehicles(organization_id);
create index if not exists idx_vehicles_depot on public.vehicles(depot_id);
create index if not exists idx_vehicles_license on public.vehicles(license_plate);
create index if not exists idx_vehicles_active on public.vehicles(is_active);

-- Vehicle assignments
create table if not exists public.vehicle_assignments (
  id bigserial primary key,
  vehicle_id bigint not null references public.vehicles(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  assigned_date date not null,
  unassigned_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_assignments_vehicle on public.vehicle_assignments(vehicle_id);
create index if not exists idx_assignments_user on public.vehicle_assignments(user_id);
create index if not exists idx_assignments_date on public.vehicle_assignments(assigned_date);

-- Records
create table if not exists public.records (
  id bigserial primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  depot_id bigint references public.depots(id) on delete set null,
  vehicle_id bigint not null references public.vehicles(id) on delete restrict,
  user_id bigint not null references public.users(id) on delete restrict,
  entry_date date not null,
  loaded integer not null default 0,
  collected integer not null default 0,
  cutters integer not null default 0,
  returned integer not null default 0,
  missplaced integer default 0,
  expense numeric default 0,
  expense_no_vat numeric default 0,
  odometer_start integer,
  odometer_end integer,
  image_path text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_records_organization on public.records(organization_id);
create index if not exists idx_records_depot on public.records(depot_id);
create index if not exists idx_records_vehicle on public.records(vehicle_id);
create index if not exists idx_records_user on public.records(user_id);
create index if not exists idx_records_date on public.records(entry_date);

-- Vehicle usage log
create table if not exists public.vehicle_usage_log (
  id bigserial primary key,
  record_id bigint not null references public.records(id) on delete cascade,
  vehicle_id bigint not null references public.vehicles(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  entry_date date not null,
  usage_mode text not null check (usage_mode in ('standard','no_used','other')),
  odometer_start integer,
  odometer_end integer,
  distance_manual integer default 0,
  purpose text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_record on public.vehicle_usage_log(record_id);
create index if not exists idx_usage_vehicle on public.vehicle_usage_log(vehicle_id);
create index if not exists idx_usage_date on public.vehicle_usage_log(entry_date);

-- Clients
create table if not exists public.clients (
  id bigserial primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  vat_number text,
  payment_terms integer default 30,
  pricing_delivery numeric default 4.0,
  pricing_collection numeric default 1.0,
  is_active boolean default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_organization on public.clients(organization_id);
create index if not exists idx_clients_active on public.clients(is_active);

-- Invoices
create table if not exists public.invoices (
  id bigserial primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  client_id bigint not null references public.clients(id) on delete restrict,
  invoice_number text unique not null,
  invoice_date date not null,
  due_date date not null,
  period_start date not null,
  period_end date not null,
  subtotal numeric not null,
  vat_amount numeric not null,
  total_amount numeric not null,
  status text check (status in ('draft','sent','paid','overdue','cancelled')) default 'draft',
  paid_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_organization on public.invoices(organization_id);
create index if not exists idx_invoices_client on public.invoices(client_id);
create index if not exists idx_invoices_number on public.invoices(invoice_number);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_date on public.invoices(invoice_date);

-- Sessions (for authentication)
create table if not exists public.sessions (
  id uuid primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_expires on public.sessions(expires_at);
