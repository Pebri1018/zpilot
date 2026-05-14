-- Add special_hours column to merchant_signals
ALTER TABLE public.merchant_signals 
ADD COLUMN IF NOT EXISTS special_hours JSONB DEFAULT '{}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.merchant_signals.special_hours IS 'Stores day-specific opening hours, e.g., {"Senin": {"open": "08:00", "close": "20:00"}}';
