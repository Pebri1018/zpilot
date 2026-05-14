-- 032_auto_reorder_ids.sql

-- 1. Function to reorder merchant and spot IDs after deletion
CREATE OR REPLACE FUNCTION public.reorder_merchant_ids_after_delete()
RETURNS trigger AS $$
DECLARE
  deleted_seq_part integer;
  deleted_prefix text;
  current_val bigint;
BEGIN
  -- Extract prefix (YYT) and sequence part (last 5 digits)
  deleted_prefix := left(OLD.short_id, 3);
  deleted_seq_part := (right(OLD.short_id, 5))::integer;

  -- Update all records in merchant_signals with higher sequence numbers
  -- We don't filter by prefix here because the sequence is GLOBAL across all types
  -- But wait, the user's requirement "0002 jadi 0001" implies they care about the numeric sequence.
  -- Since merchant_id_seq is shared, we shift EVERYONE who came after, regardless of type prefix.
  
  -- Update merchant_signals
  UPDATE public.merchant_signals
  SET short_id = left(short_id, 3) || lpad(((right(short_id, 5))::integer - 1)::text, 5, '0')
  WHERE (right(short_id, 5))::integer > deleted_seq_part;

  -- Update ngetem_spots
  UPDATE public.ngetem_spots
  SET short_id = left(short_id, 3) || lpad(((right(short_id, 5))::integer - 1)::text, 5, '0')
  WHERE (right(short_id, 5))::integer > deleted_seq_part;

  -- Decrement the global sequence so next insert is correct
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
  deleted_seq_part integer;
  deleted_role_prefix text;
  deleted_year_suffix text;
  current_val bigint;
  deleted_abs_seq integer;
BEGIN
  -- ztips_id format: RYYSSSSS
  deleted_role_prefix := left(OLD.ztips_id, 1);
  deleted_year_suffix := substr(OLD.ztips_id, 2, 2);
  deleted_seq_part := (right(OLD.ztips_id, 5))::integer;
  
  -- Calculate absolute sequence used in ztips_id_seq
  IF deleted_role_prefix = '1' THEN
    deleted_abs_seq := deleted_seq_part;
  ELSE
    deleted_abs_seq := deleted_seq_part + 99999;
  END IF;

  -- Update all users with higher absolute sequence
  -- We iterate through all users and shift them if their absolute sequence is higher
  UPDATE public.users
  SET ztips_id = (
    CASE 
      WHEN (
        (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) - 1
      ) <= 99999 THEN '1'
      ELSE '2'
    END
  ) || substr(ztips_id, 2, 2) || lpad(
    (
      CASE 
        WHEN (
          (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) - 1
        ) <= 99999 THEN (
          (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) - 1
        )
        ELSE (
          (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) - 1
        ) - 99999
      END
    )::text, 5, '0'
  )
  WHERE (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) > deleted_abs_seq;

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
  -- Reset Merchant Sequence
  ALTER SEQUENCE public.merchant_id_seq RESTART WITH 1;
  
  -- Re-sequence merchants and spots by creation time
  -- We union them to maintain the global sequence order
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
  
  -- Re-sequence users by creation time
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
