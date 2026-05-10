-- 016_driver_location_rls.sql
-- Allow authenticated drivers to read each other's basic location data for Radar
-- Without this, Supabase RLS blocks cross-user reads on the users table

-- Allow any authenticated user to read other drivers' basic radar fields
-- (only non-sensitive fields will be queried in the app code)
CREATE POLICY "drivers_read_location_for_radar"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive own-only policy if it conflicts
DROP POLICY IF EXISTS "users_select_own" ON public.users;

-- Re-create the select policy to allow all authenticated reads
-- The write policies (insert/update) remain strict (own-only)
