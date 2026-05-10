-- 007_merchant_advanced.sql
-- Add advanced fields to merchant_signals and create unique constraint

-- Make sure the table exists (in case 005 was skipped)
CREATE TABLE IF NOT EXISTS public.merchant_signals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text,
  busy_level text NOT NULL CHECK (busy_level IN ('Low', 'Medium', 'High')),
  promo_active boolean DEFAULT false,
  fast_pickup boolean DEFAULT false,
  area text NOT NULL,
  lat double precision,
  lng double precision,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '60 minutes')
);

-- Before adding the unique constraint, delete duplicate merchants in the same area.
-- We keep the most recent one.
DELETE FROM public.merchant_signals
WHERE id NOT IN (
    SELECT DISTINCT ON (name, area) id
    FROM public.merchant_signals
    ORDER BY name, area, created_at DESC
);

ALTER TABLE public.merchant_signals
ADD COLUMN IF NOT EXISTS rating numeric(2,1),
ADD COLUMN IF NOT EXISTS reviews integer,
ADD COLUMN IF NOT EXISTS eta_minutes integer,
ADD COLUMN IF NOT EXISTS distance_km numeric(4,1),
ADD COLUMN IF NOT EXISTS discount_text text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add unique constraint for name and area combination
ALTER TABLE public.merchant_signals
ADD CONSTRAINT uq_merchant_name_area UNIQUE (name, area);
