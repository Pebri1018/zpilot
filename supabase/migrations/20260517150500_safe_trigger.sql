-- 3. Bulletproof Trigger Fix (Fixing PostgreSQL Planner Reordering Bug)
CREATE OR REPLACE FUNCTION public.reorder_user_ids_after_delete()
RETURNS trigger AS $$
DECLARE
  deleted_role_prefix text;
  deleted_seq_part integer;
  deleted_abs_seq integer;
  u RECORD;
  new_abs_seq integer;
BEGIN
  -- Exit early if the deleted user has no valid new-format ID
  IF OLD.ztips_id IS NULL OR OLD.ztips_id !~ '^[12][0-9]{7}$' THEN
    RETURN OLD;
  END IF;

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
    WHERE 
      -- We MUST use a CASE statement here to force short-circuit evaluation!
      -- Otherwise PostgreSQL query planner might evaluate the integer cast on old 'ZTP-ABC' strings BEFORE checking the regex!
      (CASE 
        WHEN ztips_id ~ '^[12][0-9]{7}$' THEN 
          (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END)
        ELSE NULL 
      END) > deleted_abs_seq
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
