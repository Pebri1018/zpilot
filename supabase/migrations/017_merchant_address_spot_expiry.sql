-- 017_merchant_address_spot_expiry.sql
-- Fix: Add missing columns to merchant_signals

-- Add address column (was referenced in upsert but never created)
ALTER TABLE public.merchant_signals
  ADD COLUMN IF NOT EXISTS address text;

-- Ensure promo_percent exists (added in 013 but confirming here)
ALTER TABLE public.merchant_signals
  ADD COLUMN IF NOT EXISTS promo_percent integer DEFAULT 0;

-- Sync pickup_fast from fast_pickup for any rows where it might differ
UPDATE public.merchant_signals SET pickup_fast = fast_pickup WHERE pickup_fast IS NULL;
