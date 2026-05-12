-- 030_unified_merchant_ids.sql

-- 1. Create a global sequence for merchants and spots
CREATE SEQUENCE IF NOT EXISTS public.merchant_id_seq START 1;

-- 2. Add short_id column to merchant_signals and ngetem_spots
ALTER TABLE public.merchant_signals ADD COLUMN IF NOT EXISTS short_id text UNIQUE;
ALTER TABLE public.ngetem_spots ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- 3. Create function for merchant_signals trigger
CREATE OR REPLACE FUNCTION generate_merchant_short_id()
RETURNS trigger AS $$
DECLARE
  year_suffix text;
  type_prefix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  -- 2-digit year (e.g. 26)
  year_suffix := to_char(COALESCE(NEW.created_at, now()), 'YY');

  -- Determine type based on category
  -- 1 = Resto (Makanan, Minuman, Snack)
  -- 2 = Seller (Paket, Toko/Seller, dll)
  IF NEW.category IN ('Makanan', 'Minuman', 'Snack') THEN
    type_prefix := '1';
  ELSE
    type_prefix := '2';
  END IF;

  -- Get next sequence value
  seq_num := nextval('public.merchant_id_seq');
  padded_seq := lpad(seq_num::text, 5, '0');

  -- Assign the formatted ID: YY + TYPE + 5-digit seq
  NEW.short_id := year_suffix || type_prefix || padded_seq;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_merchant_short_id ON public.merchant_signals;
CREATE TRIGGER tr_generate_merchant_short_id
BEFORE INSERT ON public.merchant_signals
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_merchant_short_id();

-- 4. Create function for ngetem_spots trigger
CREATE OR REPLACE FUNCTION generate_spot_short_id()
RETURNS trigger AS $$
DECLARE
  year_suffix text;
  type_prefix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  year_suffix := to_char(COALESCE(NEW.created_at, now()), 'YY');
  type_prefix := '3'; -- 3 = Spot

  seq_num := nextval('public.merchant_id_seq');
  padded_seq := lpad(seq_num::text, 5, '0');

  NEW.short_id := year_suffix || type_prefix || padded_seq;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_spot_short_id ON public.ngetem_spots;
CREATE TRIGGER tr_generate_spot_short_id
BEFORE INSERT ON public.ngetem_spots
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_spot_short_id();

-- 5. Backfill existing records ordered by created_at
DO $$
DECLARE
  m RECORD;
  s RECORD;
  year_suffix text;
  type_prefix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  -- We'll backfill by assigning them a new sequence if they don't have one
  FOR m IN SELECT id, category, created_at FROM public.merchant_signals WHERE short_id IS NULL ORDER BY created_at ASC LOOP
    year_suffix := to_char(m.created_at, 'YY');
    IF m.category IN ('Makanan', 'Minuman', 'Snack') THEN
      type_prefix := '1';
    ELSE
      type_prefix := '2';
    END IF;
    seq_num := nextval('public.merchant_id_seq');
    padded_seq := lpad(seq_num::text, 5, '0');
    UPDATE public.merchant_signals SET short_id = year_suffix || type_prefix || padded_seq WHERE id = m.id;
  END LOOP;

  FOR s IN SELECT id, created_at FROM public.ngetem_spots WHERE short_id IS NULL ORDER BY created_at ASC LOOP
    year_suffix := to_char(s.created_at, 'YY');
    type_prefix := '3';
    seq_num := nextval('public.merchant_id_seq');
    padded_seq := lpad(seq_num::text, 5, '0');
    UPDATE public.ngetem_spots SET short_id = year_suffix || type_prefix || padded_seq WHERE id = s.id;
  END LOOP;
END;
$$;
