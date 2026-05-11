-- 025_update_ztips_id_format.sql

CREATE OR REPLACE FUNCTION generate_ztips_id()
RETURNS trigger AS $$
DECLARE
  role_prefix text;
  year_suffix text;
  seq_num bigint;
  padded_seq text;
BEGIN
  -- 2-digit year (e.g. 26)
  year_suffix := to_char(now(), 'YY');

  -- Get next sequence value
  seq_num := nextval('public.ztips_id_seq');

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

-- Re-update existing users to match the new format
DO $$
DECLARE
  u RECORD;
BEGIN
  -- Reset sequence to 1
  ALTER SEQUENCE public.ztips_id_seq RESTART WITH 1;

  FOR u IN SELECT id, created_at FROM public.users ORDER BY created_at ASC LOOP
    DECLARE
      r_prefix text;
      y_suffix text;
      s_num bigint;
      p_seq text;
    BEGIN
      y_suffix := to_char(u.created_at, 'YY');
      s_num := nextval('public.ztips_id_seq');
      
      IF s_num <= 99999 THEN
        r_prefix := '1';
        p_seq := lpad(s_num::text, 5, '0');
      ELSE
        r_prefix := '2';
        p_seq := lpad((s_num - 99999)::text, 5, '0');
      END IF;
      
      UPDATE public.users SET ztips_id = r_prefix || y_suffix || p_seq WHERE id = u.id;
    END;
  END LOOP;
END;
$$;
