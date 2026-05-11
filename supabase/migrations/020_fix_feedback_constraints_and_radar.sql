-- 020_fix_feedback_constraints_and_radar.sql

-- 1. Fix feedback status constraint
-- Drop the existing constraint (common name is feedback_status_check)
-- If it has a different name, we might need to find it, but this is the standard one.
ALTER TABLE public.feedback
DROP CONSTRAINT IF EXISTS feedback_status_check;

-- Re-add with new allowed values: pending, replied, closed, reviewed
ALTER TABLE public.feedback
ADD CONSTRAINT feedback_status_check 
CHECK (status IN ('pending', 'replied', 'closed', 'reviewed'));

-- 2. Ensure all existing merchants are active if column exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_signals' AND column_name='is_active') THEN
        UPDATE public.merchant_signals SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;
