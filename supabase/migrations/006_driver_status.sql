-- 006_driver_status.sql
-- Add status column to driver_locations

ALTER TABLE public.driver_locations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Cari Spot';
