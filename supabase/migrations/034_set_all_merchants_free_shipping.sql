-- Set all existing merchants to free shipping = true
UPDATE public.merchant_signals 
SET free_shipping = true 
WHERE free_shipping IS FALSE OR free_shipping IS NULL;
