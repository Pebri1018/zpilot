-- Create user_zone_history for Personal Zone Intelligence
CREATE TABLE IF NOT EXISTS public.user_zone_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  signal_type TEXT, -- 'antar', 'stay', 'feedback'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_user_zone_history_user_id ON public.user_zone_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_zone_history_created_at ON public.user_zone_history(created_at);

-- Add comment
COMMENT ON TABLE public.user_zone_history IS 'Stores personal signals from users to build personal hotspot history.';
