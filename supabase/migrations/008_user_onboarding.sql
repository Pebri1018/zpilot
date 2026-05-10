-- 008_user_onboarding.sql
-- Add onboarding fields to users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS kota text,
ADD COLUMN IF NOT EXISTS driver_id text,
ADD COLUMN IF NOT EXISTS platform text;
