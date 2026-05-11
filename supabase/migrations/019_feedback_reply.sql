-- 019_feedback_reply.sql
-- Add admin reply column to feedback table

ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS admin_reply text,
ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone;

-- Update status options to include 'replied' if needed, though 'reviewed' or 'closed' might suffice.
-- The user asked for "pending ke selesaikan atau ke reply", so let's use 'pending', 'replied', 'closed'.
-- We can also just use text status.

COMMENT ON COLUMN public.feedback.status IS 'pending, replied, closed';
