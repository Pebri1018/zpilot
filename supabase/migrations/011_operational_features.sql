-- 011_operational_features.sql

-- 1. Table for User Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    message text NOT NULL,
    status text DEFAULT 'pending', -- pending, reviewed, closed
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Add status & online fields to users table for Radar
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Offline', -- Ngetem, Antar, Offline
ADD COLUMN IF NOT EXISTS last_lat double precision,
ADD COLUMN IF NOT EXISTS last_lng double precision,
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Enable RLS for feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback" 
ON public.feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" 
ON public.feedback FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
