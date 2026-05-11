-- 021_admin_manual_signals.sql

CREATE TABLE IF NOT EXISTS public.admin_manual_signals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    type text NOT NULL DEFAULT 'driver_ngetem', -- driver_ngetem or spot
    count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '2 hours')
);

-- Note: No RLS needed for now if we use service role or admin policy, but let's be safe
ALTER TABLE public.admin_manual_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for manual signals" 
ON public.admin_manual_signals FOR SELECT 
USING (true);

CREATE POLICY "Allow admin write manual signals" 
ON public.admin_manual_signals FOR ALL 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Also add free_shipping to merchant_signals
ALTER TABLE public.merchant_signals 
ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false;
