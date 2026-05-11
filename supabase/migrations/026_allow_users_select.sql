-- 026_allow_users_select.sql

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow public read of users" ON public.users;

-- Create policy to allow ANY authenticated user to read all rows in public.users
-- This is necessary for the Radar page to see other drivers' locations.
CREATE POLICY "Allow public read of users" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);
