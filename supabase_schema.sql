-- ==========================================
-- Limkokwing Fun Run Database Setup Script
-- ==========================================

-- 1. Clean up existing objects if reinstalling
drop view if exists public_registrations;
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
-- Ensure no two people use the same BIB number
alter table registrations add constraint unique_bib_number unique (bib_number);

-- Ensure no two people register with the same phone number
alter table registrations add constraint unique_phone_number unique (phone_number);

-- 4. Enable Row Level Security (RLS)
alter table registrations enable row level security;

-- 5. Define insertion policy (allow anyone to register/insert)
create policy "Allow public registrations" on registrations
for insert with check (true);

-- 6. Create a secure view for the public listing.
-- This view excludes 'phone_number' to protect user privacy while exposing all details needed for search and verify.
create or replace view public_registrations as
select 
  id, 
  created_at, 
  full_name, 
  bib_name, 
  bib_number, 
  class_name, 
  gender, 
  compete, 
  t_shirt_size
from registrations;

-- 7. Grant select permissions on the view to public anonymous and authenticated roles
grant select on public_registrations to anon, authenticated;
