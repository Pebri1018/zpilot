-- 012_refinement_updates.sql

-- 1. Broadcast refinement
ALTER TABLE public.broadcasts 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing broadcasts to expire in 10 mins if not set
UPDATE public.broadcasts SET expires_at = created_at + interval '10 minutes' WHERE expires_at IS NULL;

-- 2. User Moderation
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false;

-- 3. Feedback table status (re-confirming)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status') THEN
        -- Using text instead of enum for simplicity in logic
        NULL;
    END IF;
END $$;
