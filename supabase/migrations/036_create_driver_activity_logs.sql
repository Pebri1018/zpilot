-- Create driver_activity_logs table
CREATE TABLE IF NOT EXISTS public.driver_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    first_area TEXT,
    last_area TEXT,
    total_online_minutes INTEGER DEFAULT 0,
    total_idle_minutes INTEGER DEFAULT 0,
    movement_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_logs_user_id ON public.driver_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_logs_started_at ON public.driver_activity_logs(started_at);

-- Set up RLS
ALTER TABLE public.driver_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
    ON public.driver_activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
    ON public.driver_activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
    ON public.driver_activity_logs FOR UPDATE
    USING (auth.uid() = user_id);
