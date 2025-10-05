-- Seed default organization and admin user for local development
-- WARNING: Do not use these credentials in production.

-- Insert organization
insert into public.organizations (name, legal_name, country, is_active)
values ('Default Organization', 'Default Organization Ltd.', 'Ireland', true)
returning id;

-- Use the last inserted organization id
-- In Supabase seed, we can safely grab it using a CTE
with org as (
  insert into public.organizations (name, legal_name, country, is_active)
  values ('Seed Org', 'Seed Org Ltd.', 'Ireland', true)
  returning id
)
insert into public.users (email, password_hash, first_name, last_name, role, organization_id, is_active)
select 'admin@example.com',
       '$2b$10$86Wn8ywAqLgR9dB1Wfg4Y.B2FY6n/8YK/uss3fdl4pnMUxJ0jUJ0a',
       'Super',
       'Admin',
       'super_admin',
       org.id,
       true
from org
on conflict (email) do nothing;
