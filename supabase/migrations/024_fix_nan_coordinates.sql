-- 024_fix_nan_coordinates.sql

-- Fix any merchant signals that have NaN coordinates
UPDATE public.merchant_signals
SET lat = NULL, lng = NULL
WHERE lat = 'NaN'::numeric OR lng = 'NaN'::numeric;

-- Also check spots just in case
UPDATE public.ngetem_spots
SET lat = NULL, lng = NULL
WHERE lat = 'NaN'::numeric OR lng = 'NaN'::numeric;
