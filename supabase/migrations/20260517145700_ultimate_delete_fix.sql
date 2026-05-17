-- 1. Ultimate Foreign Key Cascade Fix
DO $$ 
DECLARE
  fk RECORD;
BEGIN
  -- Convert ALL foreign keys referencing auth.users to CASCADE
  FOR fk IN
    SELECT tc.constraint_name, tc.table_name, kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_schema = 'auth' AND ccu.table_name = 'users' AND tc.table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', 'public', fk.table_name, fk.constraint_name);
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 'public', fk.table_name, fk.constraint_name, fk.column_name);
  END LOOP;
  
  -- Convert ALL foreign keys referencing public.users to CASCADE
  FOR fk IN
    SELECT tc.constraint_name, tc.table_name, kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_schema = 'public' AND ccu.table_name = 'users' AND tc.table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', 'public', fk.table_name, fk.constraint_name);
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.users(id) ON DELETE CASCADE', 'public', fk.table_name, fk.constraint_name, fk.column_name);
  END LOOP;
END $$;

-- 2. Bulletproof Trigger Fix using POSIX Regex
CREATE OR REPLACE FUNCTION public.reorder_user_ids_after_delete()
RETURNS trigger AS $$
DECLARE
  deleted_role_prefix text;
  deleted_seq_part integer;
  deleted_abs_seq integer;
  u RECORD;
  new_abs_seq integer;
BEGIN
  -- Strict POSIX regex check: Must be exactly 8 chars, starting with 1 or 2, followed by 7 digits
  IF OLD.ztips_id IS NULL OR OLD.ztips_id !~ '^[12][0-9]{7}$' THEN
    RETURN OLD;
  END IF;

  deleted_role_prefix := left(OLD.ztips_id, 1);
  
  -- Safely cast to integer
  BEGIN
    deleted_seq_part := (right(OLD.ztips_id, 5))::integer;
  EXCEPTION WHEN OTHERS THEN
    RETURN OLD; -- Exit gracefully if somehow it's not a number
  END;
  
  IF deleted_role_prefix = '1' THEN
    deleted_abs_seq := deleted_seq_part;
  ELSE
    deleted_abs_seq := deleted_seq_part + 99999;
  END IF;

  FOR u IN 
    SELECT id, ztips_id,
           (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) as abs_seq
    FROM public.users
    WHERE ztips_id ~ '^[12][0-9]{7}$'
      AND (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) > deleted_abs_seq
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
