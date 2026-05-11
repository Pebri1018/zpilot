-- 023_fix_radar_rls.sql

-- Enable RLS just to be safe
ALTER TABLE public.merchant_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngetem_spots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow public read for merchants" ON public.merchant_signals;
DROP POLICY IF EXISTS "Allow public read for ngetem spots" ON public.ngetem_spots;

-- Create policies to allow ALL users (public/authenticated) to READ
CREATE POLICY "Allow public read for merchants" 
ON public.merchant_signals FOR SELECT 
USING (true);

CREATE POLICY "Allow public read for ngetem spots" 
ON public.ngetem_spots FOR SELECT 
USING (true);

-- Also ensure admin_manual_signals can be read
ALTER TABLE public.admin_manual_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read for manual signals" ON public.admin_manual_signals;
CREATE POLICY "Allow public read for manual signals" 
ON public.admin_manual_signals FOR SELECT 
USING (true);
