-- Add promo_percent column to merchant_signals
ALTER TABLE public.merchant_signals
ADD COLUMN IF NOT EXISTS promo_percent integer DEFAULT 0;
