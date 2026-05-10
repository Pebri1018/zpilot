-- 005_manual_signals.sql
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.manual_density_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lat double precision,
  lng double precision,
  area text NOT NULL,
  driver_count integer NOT NULL,
  radius integer NOT NULL DEFAULT 50,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '20 minutes')
);

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

-- Disable RLS for MVP
ALTER TABLE public.manual_density_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_signals DISABLE ROW LEVEL SECURITY;
