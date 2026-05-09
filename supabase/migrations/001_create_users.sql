-- ZTIPS Pilot: driver profile + onboarding flag (linked to auth.users)
-- Run in Supabase SQL Editor or via supabase db push

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  city text not null,
  platform text not null default 'ShopeeFood',
  driver_id text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_onboarding_idx on public.users (onboarding_completed);

alter table public.users enable row level security;

create policy "users_select_own"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

create policy "users_insert_own"
on public.users
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "users_update_own"
on public.users
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
