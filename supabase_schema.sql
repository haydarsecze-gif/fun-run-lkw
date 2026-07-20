-- ==========================================
-- Limkokwing Fun Run Database Setup Script
-- ==========================================

-- 1. Clean up existing objects
drop view if exists public_registrations;
drop function if exists get_all_registrations;
drop table if exists registrations;

-- 2. Create the main registrations table
create table registrations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null,
  full_name text not null,
  bib_name text not null,
  phone_number text not null,
  gender text not null check (gender in ('Male', 'Female')),
  class_name text not null,
  compete text not null check (compete in ('Yes', 'No')),
  t_shirt_size text not null check (t_shirt_size in ('S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL')),
  bib_number text not null check (bib_number ~ '^\d{4}$')
);

-- 3. Add unique constraints to block duplicate entries
alter table registrations add constraint unique_bib_number unique (bib_number);
alter table registrations add constraint unique_phone_number unique (phone_number);

-- 4. Enable Row Level Security (RLS)
alter table registrations enable row level security;

-- 5. Define insertion policy (allow anyone to register/insert)
create policy "Allow public registrations" on registrations
for insert with check (true);

-- 6. Create a secure view for the public listing.
-- This view ONLY exposes full_name, bib_name, bib_number, compete and created_at to protect user privacy.
create or replace view public_registrations as
select 
  id, 
  created_at, 
  full_name, 
  bib_name, 
  bib_number,
  compete
from registrations;

-- 7. Grant select permissions on the view to public anonymous and authenticated roles
grant select on public_registrations to anon, authenticated;

-- 8. Create a password-secured function to fetch all registration data (private columns included).
create or replace function get_all_registrations(admin_password text)
returns table (
  id uuid,
  created_at timestamp with time zone,
  full_name text,
  bib_name text,
  phone_number text,
  gender text,
  class_name text,
  compete text,
  t_shirt_size text,
  bib_number text
) 
language plpgsql
security definer
as $$
begin
  -- Validate the admin password.
  if admin_password <> 'admin123' then
    raise exception 'Unauthorized Access: Invalid Password';
  end if;

  return query
  select 
    r.id,
    r.created_at,
    r.full_name,
    r.bib_name,
    r.phone_number,
    r.gender,
    r.class_name,
    r.compete,
    r.t_shirt_size,
    r.bib_number
  from registrations r
  order by r.created_at desc;
end;
$$;

-- 9. Create a password-secured function to delete a registration
create or replace function delete_registration_admin(
  admin_password text,
  target_id uuid
)
returns boolean
language plpgsql
security definer
as $$
begin
  if admin_password <> 'admin123' then
    raise exception 'Unauthorized Access: Invalid Password';
  end if;

  delete from registrations where id = target_id;
  return true;
end;
$$;

-- 10. Create a password-secured function to update a registration
create or replace function update_registration_admin(
  admin_password text,
  target_id uuid,
  new_full_name text,
  new_bib_name text,
  new_phone_number text,
  new_gender text,
  new_class_name text,
  new_compete text,
  new_t_shirt_size text,
  new_bib_number text
)
returns boolean
language plpgsql
security definer
as $$
begin
  if admin_password <> 'admin123' then
    raise exception 'Unauthorized Access: Invalid Password';
  end if;

  update registrations
  set 
    full_name = new_full_name,
    bib_name = new_bib_name,
    phone_number = new_phone_number,
    gender = new_gender,
    class_name = new_class_name,
    compete = new_compete,
    t_shirt_size = new_t_shirt_size,
    bib_number = new_bib_number
  where id = target_id;

  return true;
end;
$$;

-- Grant select and insert permissions on table to anon and authenticated roles
grant select, insert on registrations to anon, authenticated;

-- Grant execute permissions on the functions
grant execute on function get_all_registrations(text) to anon, authenticated;
grant execute on function delete_registration_admin(text, uuid) to anon, authenticated;
grant execute on function update_registration_admin(text, uuid, text, text, text, text, text, text, text, text) to anon, authenticated;

-- ==========================================================================
-- 11. Global App Configuration Table & Functions
-- ==========================================================================
create table if not exists config (
  key text primary key,
  value jsonb not null
);

-- Disable Row Level Security on config table so public can read the status
alter table config disable row level security;

-- Seed initial registration status
insert into config (key, value)
values ('registration_status', '{"open": true}'::jsonb)
on conflict (key) do nothing;

-- Grant read permission to client-side roles
grant select on config to anon, authenticated;

-- Create secure RPC function to toggle registration status
create or replace function set_registration_status(
  admin_password text,
  is_open boolean
)
returns boolean
language plpgsql
security definer
as $$
begin
  if admin_password <> 'admin123' then
    raise exception 'Unauthorized Access: Invalid Password';
  end if;

  insert into config (key, value)
  values ('registration_status', jsonb_build_object('open', is_open))
  on conflict (key) do update
  set value = jsonb_build_object('open', is_open);

  return true;
end;
$$;

grant execute on function set_registration_status(text, boolean) to anon, authenticated;
