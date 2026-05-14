-- 033_add_merchant_import_fields.sql
ALTER TABLE public.merchant_signals 
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
