-- 003_broadcasts.sql
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('spot_ramai', 'hindari_area', 'promo_seller', 'paket_spx', 'cuaca_event')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Disable RLS for MVP (same as users table)
ALTER TABLE public.broadcasts DISABLE ROW LEVEL SECURITY;
