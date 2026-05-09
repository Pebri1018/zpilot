-- ZTIPS Pilot: users table setup for Onboarding
-- Run this in your Supabase SQL Editor

-- Note: If the table already exists with old columns (like nickname, city), 
-- you may want to drop it first. Uncomment the line below to reset the table:
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Create table `users` with required columns
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  kota text not null,
  platform text not null default 'ShopeeFood',
  driver_id text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.users enable row level security;

-- Drop existing policies if any to avoid conflicts when recreating
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;

-- 3. Create INSERT policy so authenticated users can insert their own row
create policy "users_insert_own"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

-- 4. Create SELECT and UPDATE policy for own row
create policy "users_select_own"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "users_update_own"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
