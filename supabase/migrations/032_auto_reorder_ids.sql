-- 032_auto_reorder_ids.sql

-- 1. Function to reorder merchant and spot IDs after deletion
CREATE OR REPLACE FUNCTION public.reorder_merchant_ids_after_delete()
RETURNS trigger AS $$
DECLARE
  deleted_seq_part integer;
  current_val bigint;
  m RECORD;
BEGIN
  -- Extract sequence part (last 5 digits) of the deleted ID
  deleted_seq_part := (right(OLD.short_id, 5))::integer;

  -- We update rows one by one in ASCENDING order of their sequence number
  -- to avoid unique constraint violations (shifting into an empty slot).
  
  -- Re-order merchant_signals
  FOR m IN 
    SELECT id, short_id 
    FROM public.merchant_signals 
    WHERE (right(short_id, 5))::integer > deleted_seq_part
    ORDER BY (right(short_id, 5))::integer ASC
  LOOP
    UPDATE public.merchant_signals
    SET short_id = left(m.short_id, 3) || lpad(((right(m.short_id, 5))::integer - 1)::text, 5, '0')
    WHERE id = m.id;
  END LOOP;

  -- Re-order ngetem_spots
  FOR m IN 
    SELECT id, short_id 
    FROM public.ngetem_spots 
    WHERE (right(short_id, 5))::integer > deleted_seq_part
    ORDER BY (right(short_id, 5))::integer ASC
  LOOP
    UPDATE public.ngetem_spots
    SET short_id = left(m.short_id, 3) || lpad(((right(m.short_id, 5))::integer - 1)::text, 5, '0')
    WHERE id = m.id;
  END LOOP;

  -- Decrement the global sequence
  SELECT last_value INTO current_val FROM public.merchant_id_seq;
  IF current_val > 1 THEN
    PERFORM setval('public.merchant_id_seq', current_val - 1, true);
  ELSE
    PERFORM setval('public.merchant_id_seq', 1, false);
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to reorder user ztips_ids after deletion
CREATE OR REPLACE FUNCTION public.reorder_user_ids_after_delete()
RETURNS trigger AS $$
DECLARE
  deleted_role_prefix text;
  deleted_seq_part integer;
  deleted_abs_seq integer;
  current_val bigint;
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

  -- Re-order users one by one in ASCENDING order of absolute sequence
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

  -- Decrement user sequence
  SELECT last_value INTO current_val FROM public.ztips_id_seq;
  IF current_val > 1 THEN
    PERFORM setval('public.ztips_id_seq', current_val - 1, true);
  ELSE
    PERFORM setval('public.ztips_id_seq', 1, false);
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Create triggers
DROP TRIGGER IF EXISTS tr_reorder_merchants ON public.merchant_signals;
CREATE TRIGGER tr_reorder_merchants
AFTER DELETE ON public.merchant_signals
FOR EACH ROW
EXECUTE FUNCTION reorder_merchant_ids_after_delete();

DROP TRIGGER IF EXISTS tr_reorder_spots ON public.ngetem_spots;
CREATE TRIGGER tr_reorder_spots
AFTER DELETE ON public.ngetem_spots
FOR EACH ROW
EXECUTE FUNCTION reorder_merchant_ids_after_delete();

DROP TRIGGER IF EXISTS tr_reorder_users ON public.users;
CREATE TRIGGER tr_reorder_users
AFTER DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION reorder_user_ids_after_delete();

-- 4. Initial Backfill: Re-sequence everything to remove current gaps
DO $$
DECLARE
  m RECORD;
  u RECORD;
  seq_num bigint;
  year_suffix text;
  type_prefix text;
  role_prefix text;
  padded_seq text;
BEGIN
  -- Clear all IDs first to avoid unique constraint violations during re-assignment
  UPDATE public.merchant_signals SET short_id = NULL;
  UPDATE public.ngetem_spots SET short_id = NULL;
  UPDATE public.users SET ztips_id = NULL;

  -- Reset Merchant Sequence
  ALTER SEQUENCE public.merchant_id_seq RESTART WITH 1;
  
  FOR m IN (
    SELECT 'm' as tbl, id, category, created_at FROM public.merchant_signals
    UNION ALL
    SELECT 's' as tbl, id, 'Spot' as category, created_at FROM public.ngetem_spots
    ORDER BY created_at ASC
  ) LOOP
    year_suffix := to_char(m.created_at, 'YY');
    IF m.tbl = 'm' THEN
      IF m.category IN ('Makanan', 'Minuman', 'Snack') THEN type_prefix := '1'; ELSE type_prefix := '2'; END IF;
      seq_num := nextval('public.merchant_id_seq');
      UPDATE public.merchant_signals SET short_id = year_suffix || type_prefix || lpad(seq_num::text, 5, '0') WHERE id = m.id;
    ELSE
      type_prefix := '3';
      seq_num := nextval('public.merchant_id_seq');
      UPDATE public.ngetem_spots SET short_id = year_suffix || type_prefix || lpad(seq_num::text, 5, '0') WHERE id = m.id;
    END IF;
  END LOOP;

  -- Reset User Sequence
  ALTER SEQUENCE public.ztips_id_seq RESTART WITH 1;
  
  FOR u IN SELECT id, created_at FROM public.users ORDER BY created_at ASC LOOP
    year_suffix := to_char(u.created_at, 'YY');
    seq_num := nextval('public.ztips_id_seq');
    IF seq_num <= 99999 THEN
      role_prefix := '1';
      padded_seq := lpad(seq_num::text, 5, '0');
    ELSE
      role_prefix := '2';
      padded_seq := lpad((seq_num - 99999)::text, 5, '0');
    END IF;
    UPDATE public.users SET ztips_id = role_prefix || year_suffix || padded_seq WHERE id = u.id;
  END LOOP;
END;
$$;
