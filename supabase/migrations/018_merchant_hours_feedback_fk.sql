-- 018_merchant_hours_feedback_fk.sql

-- 1. Add open/close hours to merchant_signals
ALTER TABLE public.merchant_signals
  ADD COLUMN IF NOT EXISTS open_time text,   -- e.g. "08:00"
  ADD COLUMN IF NOT EXISTS close_time text;  -- e.g. "22:00"

-- 2. Fix feedback FK so PostgREST can auto-join with public.users
-- First drop the auth.users FK, then re-add pointing to public.users
ALTER TABLE public.feedback
  DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
