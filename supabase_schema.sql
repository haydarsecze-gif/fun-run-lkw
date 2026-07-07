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

-- 8. Create a secure function to fetch all registration data with an admin password.
-- This keeps all sensitive fields (like phone numbers, class, shirt size) private from standard users.
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
  -- Default admin password is 'admin123' - you can modify this to anything you'd like
  if admin_password = 'admin123' then
    return query select 
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
  else
    raise exception 'Invalid admin password';
  end if;
end;
$$;

-- Grant execute permissions on the function to public anonymous and authenticated roles
grant execute on function get_all_registrations(text) to anon, authenticated;
