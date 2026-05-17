-- Fix Foreign Key Constraints to Cascade Delete
-- Drop existing constraints
ALTER TABLE public.driver_locations DROP CONSTRAINT IF EXISTS driver_locations_user_id_fkey;
ALTER TABLE public.recommendation_feedback DROP CONSTRAINT IF EXISTS recommendation_feedback_user_id_fkey;

-- Add them back with ON DELETE CASCADE
ALTER TABLE public.driver_locations 
  ADD CONSTRAINT driver_locations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.recommendation_feedback 
  ADD CONSTRAINT recommendation_feedback_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
