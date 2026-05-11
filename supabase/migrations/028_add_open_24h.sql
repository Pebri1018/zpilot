-- 028_add_open_24h.sql
ALTER TABLE public.merchant_signals
ADD COLUMN IF NOT EXISTS is_open_24h boolean DEFAULT false;
