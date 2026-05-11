-- 017_merchant_address_spot_expiry.sql
-- Fix: Add all missing columns to merchant_signals
-- (Some environments may not have run 010_merchant_persistent.sql)

-- Columns from 010_merchant_persistent (add if missing)
ALTER TABLE public.merchant_signals
  ADD COLUMN IF NOT EXISTS busy_score integer,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_fast boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating double precision,
  ADD COLUMN IF NOT EXISTS reviews integer,
  ADD COLUMN IF NOT EXISTS popularity_score double precision,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by text;

-- Columns from 013_merchant_promo_percent
ALTER TABLE public.merchant_signals
  ADD COLUMN IF NOT EXISTS promo_percent integer DEFAULT 0;

-- New: address column (referenced in upsert but never created before)
ALTER TABLE public.merchant_signals
  ADD COLUMN IF NOT EXISTS address text;

-- Sync pickup_fast from fast_pickup for any rows where it might differ
UPDATE public.merchant_signals SET pickup_fast = fast_pickup WHERE pickup_fast IS NULL AND fast_pickup IS NOT NULL;

-- Set all existing rows as active
UPDATE public.merchant_signals SET is_active = true WHERE is_active IS NULL;

-- Extend expiry on existing rows
UPDATE public.merchant_signals
  SET expires_at = '2099-12-31 23:59:59+00'
  WHERE expires_at IS NOT NULL AND expires_at < now() + interval '1 year';
