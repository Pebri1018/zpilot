-- Create the driver_locations table to track live driver positions
create table driver_locations (
  user_id uuid references auth.users(id) primary key,
  latitude numeric not null,
  longitude numeric not null,
  area_name text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table driver_locations enable row level security;

-- Policies for driver_locations
-- 1. Drivers can insert their own location
create policy "Drivers can insert own location"
on driver_locations for insert
with check (auth.uid() = user_id);

-- 2. Drivers can update their own location
create policy "Drivers can update own location"
on driver_locations for update
using (auth.uid() = user_id);

-- 3. Any authenticated user can view all locations (needed for future density calculations)
create policy "Authenticated users can view all locations"
on driver_locations for select
using (auth.role() = 'authenticated');