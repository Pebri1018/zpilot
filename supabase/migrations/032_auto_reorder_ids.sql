-- 032_auto_reorder_ids.sql

-- 1. Update the generation functions to be group-specific (no more skipping between types)
CREATE OR REPLACE FUNCTION generate_merchant_short_id()
RETURNS trigger AS $$
DECLARE
  year_suffix text;
  type_prefix text;
  next_seq integer;
BEGIN
  year_suffix := to_char(COALESCE(NEW.created_at, now()), 'YY');
  IF NEW.category IN ('Makanan', 'Minuman', 'Snack') THEN type_prefix := '1'; ELSE type_prefix := '2'; END IF;

  -- Get the next number for this specific year + type
  SELECT COALESCE(MAX((right(short_id, 5))::integer), 0) + 1 INTO next_seq
  FROM public.merchant_signals
  WHERE left(short_id, 3) = (year_suffix || type_prefix);

  NEW.short_id := year_suffix || type_prefix || lpad(next_seq::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_spot_short_id()
RETURNS trigger AS $$
DECLARE
  year_suffix text;
  type_prefix text;
  next_seq integer;
BEGIN
  year_suffix := to_char(COALESCE(NEW.created_at, now()), 'YY');
  type_prefix := '3';

  SELECT COALESCE(MAX((right(short_id, 5))::integer), 0) + 1 INTO next_seq
  FROM public.ngetem_spots
  WHERE left(short_id, 3) = (year_suffix || type_prefix);

  NEW.short_id := year_suffix || type_prefix || lpad(next_seq::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to reorder merchant and spot IDs after deletion (within their own group)
CREATE OR REPLACE FUNCTION public.reorder_merchant_ids_after_delete()
RETURNS trigger AS $$
DECLARE
  deleted_seq_part integer;
  deleted_prefix text;
  m RECORD;
BEGIN
  deleted_prefix := left(OLD.short_id, 3);
  deleted_seq_part := (right(OLD.short_id, 5))::integer;

  -- ONLY update records with the SAME PREFIX (Year + Type)
  IF OLD.short_id LIKE '__1%' OR OLD.short_id LIKE '__2%' THEN
    FOR m IN 
      SELECT id, short_id 
      FROM public.merchant_signals 
      WHERE left(short_id, 3) = deleted_prefix AND (right(short_id, 5))::integer > deleted_seq_part
      ORDER BY (right(short_id, 5))::integer ASC
    LOOP
      UPDATE public.merchant_signals
      SET short_id = deleted_prefix || lpad(((right(m.short_id, 5))::integer - 1)::text, 5, '0')
      WHERE id = m.id;
    END LOOP;
  ELSIF OLD.short_id LIKE '__3%' THEN
    FOR m IN 
      SELECT id, short_id 
      FROM public.ngetem_spots 
      WHERE left(short_id, 3) = deleted_prefix AND (right(short_id, 5))::integer > deleted_seq_part
      ORDER BY (right(short_id, 5))::integer ASC
    LOOP
      UPDATE public.ngetem_spots
      SET short_id = deleted_prefix || lpad(((right(m.short_id, 5))::integer - 1)::text, 5, '0')
      WHERE id = m.id;
    END LOOP;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to reorder user ztips_ids after deletion
CREATE OR REPLACE FUNCTION public.reorder_user_ids_after_delete()
RETURNS trigger AS $$
DECLARE
  deleted_role_prefix text;
  deleted_seq_part integer;
  deleted_abs_seq integer;
  u RECORD;
  new_abs_seq integer;
BEGIN
  deleted_role_prefix := left(OLD.ztips_id, 1);
  deleted_seq_part := (right(OLD.ztips_id, 5))::integer;
  
  IF deleted_role_prefix = '1' THEN
    deleted_abs_seq := deleted_seq_part;
  ELSE
    deleted_abs_seq := deleted_seq_part + 99999;
  END IF;

  FOR u IN 
    SELECT id, ztips_id,
           (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) as abs_seq
    FROM public.users
    WHERE (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) > deleted_abs_seq
    ORDER BY abs_seq ASC
  LOOP
    new_abs_seq := u.abs_seq - 1;
    UPDATE public.users
    SET ztips_id = (CASE WHEN new_abs_seq <= 99999 THEN '1' ELSE '2' END) || 
                   substr(u.ztips_id, 2, 2) || 
                   lpad((CASE WHEN new_abs_seq <= 99999 THEN new_abs_seq ELSE new_abs_seq - 99999 END)::text, 5, '0')
    WHERE id = u.id;
  END LOOP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers
DROP TRIGGER IF EXISTS tr_reorder_merchants ON public.merchant_signals;
CREATE TRIGGER tr_reorder_merchants AFTER DELETE ON public.merchant_signals FOR EACH ROW EXECUTE FUNCTION reorder_merchant_ids_after_delete();

DROP TRIGGER IF EXISTS tr_reorder_spots ON public.ngetem_spots;
CREATE TRIGGER tr_reorder_spots AFTER DELETE ON public.ngetem_spots FOR EACH ROW EXECUTE FUNCTION reorder_merchant_ids_after_delete();

DROP TRIGGER IF EXISTS tr_reorder_users ON public.users;
CREATE TRIGGER tr_reorder_users AFTER DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION reorder_user_ids_after_delete();

-- 5. Backfill: Re-sequence per group
DO $$
DECLARE
  m RECORD;
  u RECORD;
  year_suffix text;
  type_prefix text;
  role_prefix text;
  group_prefix text;
  seq_num integer;
BEGIN
  -- Clear
  UPDATE public.merchant_signals SET short_id = NULL;
  UPDATE public.ngetem_spots SET short_id = NULL;
  UPDATE public.users SET ztips_id = NULL;

  -- Re-sequence Merchant Signals by type group
  FOR group_prefix IN SELECT DISTINCT to_char(created_at, 'YY') || (CASE WHEN category IN ('Makanan', 'Minuman', 'Snack') THEN '1' ELSE '2' END) FROM public.merchant_signals LOOP
    seq_num := 1;
    FOR m IN SELECT id FROM public.merchant_signals WHERE (to_char(created_at, 'YY') || (CASE WHEN category IN ('Makanan', 'Minuman', 'Snack') THEN '1' ELSE '2' END)) = group_prefix ORDER BY created_at ASC LOOP
      UPDATE public.merchant_signals SET short_id = group_prefix || lpad(seq_num::text, 5, '0') WHERE id = m.id;
      seq_num := seq_num + 1;
    END LOOP;
  END LOOP;

  -- Re-sequence Spots
  FOR group_prefix IN SELECT DISTINCT to_char(created_at, 'YY') || '3' FROM public.ngetem_spots LOOP
    seq_num := 1;
    FOR m IN SELECT id FROM public.ngetem_spots WHERE (to_char(created_at, 'YY') || '3') = group_prefix ORDER BY created_at ASC LOOP
      UPDATE public.ngetem_spots SET short_id = group_prefix || lpad(seq_num::text, 5, '0') WHERE id = m.id;
      seq_num := seq_num + 1;
    END LOOP;
  END LOOP;

  -- Re-sequence Users
  seq_num := 1;
  FOR u IN SELECT id, created_at FROM public.users ORDER BY created_at ASC LOOP
    year_suffix := to_char(u.created_at, 'YY');
    IF seq_num <= 99999 THEN
      UPDATE public.users SET ztips_id = '1' || year_suffix || lpad(seq_num::text, 5, '0') WHERE id = u.id;
    ELSE
      UPDATE public.users SET ztips_id = '2' || year_suffix || lpad((seq_num - 99999)::text, 5, '0') WHERE id = u.id;
    END IF;
    seq_num := seq_num + 1;
  END LOOP;
END;
$$;
