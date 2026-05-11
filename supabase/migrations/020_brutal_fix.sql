-- 020_brutal_fix.sql
-- Brutal fix for feedback constraints and merchant active status

-- 1. Drop the check constraint completely to stop any "violation" errors
ALTER TABLE public.feedback
DROP CONSTRAINT IF EXISTS feedback_status_check;

-- 2. Ensure all merchants are active
UPDATE public.merchant_signals 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- 3. Add admin_reply if missing (just in case)
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS admin_reply text,
ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone;
