-- 031_merchant_closed_days_and_sequences.sql

-- 1. Add closed_days column
ALTER TABLE public.merchant_signals ADD COLUMN IF NOT EXISTS closed_days text;

-- 2. Create individual sequences
CREATE SEQUENCE IF NOT EXISTS public.resto_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.seller_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.spot_id_seq START 1;

-- 3. Replace merchant_signals trigger
CREATE OR REPLACE FUNCTION generate_merchant_short_id()
RETURNS trigger AS $$
DECLARE
  year_suffix text;
  type_prefix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  year_suffix := to_char(COALESCE(NEW.created_at, now()), 'YY');

  IF NEW.category IN ('Makanan', 'Minuman', 'Snack') THEN
    type_prefix := '1';
    seq_num := nextval('public.resto_id_seq');
  ELSE
    type_prefix := '2';
    seq_num := nextval('public.seller_id_seq');
  END IF;

  padded_seq := lpad(seq_num::text, 5, '0');
  NEW.short_id := year_suffix || type_prefix || padded_seq;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Replace ngetem_spots trigger
CREATE OR REPLACE FUNCTION generate_spot_short_id()
RETURNS trigger AS $$
DECLARE
  year_suffix text;
  type_prefix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  year_suffix := to_char(COALESCE(NEW.created_at, now()), 'YY');
  type_prefix := '3';
  seq_num := nextval('public.spot_id_seq');
  padded_seq := lpad(seq_num::text, 5, '0');
  NEW.short_id := year_suffix || type_prefix || padded_seq;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Backfill existing records to fix the sequences
DO $$
DECLARE
  m RECORD;
  s RECORD;
  year_suffix text;
  type_prefix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  -- Reset sequences just in case
  ALTER SEQUENCE public.resto_id_seq RESTART WITH 1;
  ALTER SEQUENCE public.seller_id_seq RESTART WITH 1;
  ALTER SEQUENCE public.spot_id_seq RESTART WITH 1;

  FOR m IN SELECT id, category, created_at FROM public.merchant_signals ORDER BY created_at ASC LOOP
    year_suffix := to_char(m.created_at, 'YY');
    IF m.category IN ('Makanan', 'Minuman', 'Snack') THEN
      type_prefix := '1';
      seq_num := nextval('public.resto_id_seq');
    ELSE
      type_prefix := '2';
      seq_num := nextval('public.seller_id_seq');
    END IF;
    padded_seq := lpad(seq_num::text, 5, '0');
    UPDATE public.merchant_signals SET short_id = year_suffix || type_prefix || padded_seq WHERE id = m.id;
  END LOOP;

  FOR s IN SELECT id, created_at FROM public.ngetem_spots ORDER BY created_at ASC LOOP
    year_suffix := to_char(s.created_at, 'YY');
    type_prefix := '3';
    seq_num := nextval('public.spot_id_seq');
    padded_seq := lpad(seq_num::text, 5, '0');
    UPDATE public.ngetem_spots SET short_id = year_suffix || type_prefix || padded_seq WHERE id = s.id;
  END LOOP;
END;
$$;
