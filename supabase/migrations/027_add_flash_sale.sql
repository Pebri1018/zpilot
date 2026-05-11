-- 027_add_flash_sale.sql

ALTER TABLE public.merchant_signals
ADD COLUMN IF NOT EXISTS is_flash_sale boolean DEFAULT false;

-- Update busy_score to be 5 if flash sale is active, but we can do that dynamically or just by updating.
-- For now just the column.
