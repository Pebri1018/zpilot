-- 1. Fix user creation trigger to be gapless (no more sequences)
CREATE OR REPLACE FUNCTION generate_ztips_id()
RETURNS trigger AS $$
DECLARE
  role_prefix text;
  year_suffix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  -- If somehow an ID is already provided, respect it
  IF NEW.ztips_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 2-digit year (e.g. 26)
  year_suffix := to_char(now(), 'YY');

  -- Gapless generation: Get the current maximum sequential number from the table
  SELECT COALESCE(MAX(
    (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer 
          ELSE (right(ztips_id, 5))::integer + 99999 END)
  ), 0) + 1 INTO seq_num
  FROM public.users
  WHERE ztips_id ~ '^[12][0-9]{7}$';

  -- Format prefix and padded sequence to maintain 8 digits
  -- Format: [1/2] + [YY] + [5 digit seq]
  IF seq_num <= 99999 THEN
    role_prefix := '1';
    padded_seq := lpad(seq_num::text, 5, '0');
  ELSE
    role_prefix := '2';
    padded_seq := lpad((seq_num - 99999)::text, 5, '0');
  END IF;

  -- Assign the formatted ID
  NEW.ztips_id := role_prefix || year_suffix || padded_seq;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Clean up current gaps so everyone is perfectly sequential right now
DO $$
DECLARE
  u RECORD;
  new_seq integer := 1;
BEGIN
  -- Temporarily disable user triggers so we don't accidentally fire reorder on delete
  ALTER TABLE public.users DISABLE TRIGGER USER;

  FOR u IN 
    SELECT id, ztips_id,
           (CASE WHEN left(ztips_id, 1) = '1' THEN (right(ztips_id, 5))::integer ELSE (right(ztips_id, 5))::integer + 99999 END) as abs_seq
    FROM public.users
    WHERE ztips_id ~ '^[12][0-9]{7}$'
    ORDER BY abs_seq ASC
  LOOP
    UPDATE public.users
    SET ztips_id = (CASE WHEN new_seq <= 99999 THEN '1' ELSE '2' END) || 
                   substr(u.ztips_id, 2, 2) || 
                   lpad((CASE WHEN new_seq <= 99999 THEN new_seq ELSE new_seq - 99999 END)::text, 5, '0')
    WHERE id = u.id;
    new_seq := new_seq + 1;
  END LOOP;

  -- Re-enable triggers
  ALTER TABLE public.users ENABLE TRIGGER USER;
END $$;
