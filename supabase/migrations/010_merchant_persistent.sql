-- 010_merchant_persistent.sql
-- Migrate merchant_signals to a persistent, operational table
-- Merchants added by admin should NOT expire — they are permanent records.

-- Step 1: Add new operational fields
ALTER TABLE public.merchant_signals
  ADD COLUMN IF NOT EXISTS busy_score integer CHECK (busy_score >= 1 AND busy_score <= 5),
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_fast boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by text;

-- Step 2: Populate busy_score from busy_level for existing rows
UPDATE public.merchant_signals
SET busy_score = CASE busy_level
  WHEN 'Low'    THEN 2
  WHEN 'Medium' THEN 3
  WHEN 'High'   THEN 5
  ELSE 3
END
WHERE busy_score IS NULL;

-- Step 3: Populate pickup_fast from fast_pickup if exists
UPDATE public.merchant_signals SET pickup_fast = fast_pickup WHERE pickup_fast IS NULL;

-- Step 4: Set all existing records as active
UPDATE public.merchant_signals SET is_active = true WHERE is_active IS NULL;

-- Step 5: Make existing records "never expire" by setting expires_at far in the future
-- (Keeps backward compatibility without breaking the schema)
UPDATE public.merchant_signals
SET expires_at = '2099-12-31 23:59:59+00'
WHERE expires_at IS NOT NULL AND expires_at < now() + interval '1 year';
