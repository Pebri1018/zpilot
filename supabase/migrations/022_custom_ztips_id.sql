-- 022_custom_ztips_id.sql

-- 1. Create a sequence for the user ID (starting at 1)
CREATE SEQUENCE IF NOT EXISTS public.ztips_id_seq START 1;

-- 2. Create the new function that formats the ID
CREATE OR REPLACE FUNCTION generate_ztips_id()
RETURNS trigger AS $$
DECLARE
  role_prefix text;
  year_suffix text;
  seq_val text;
BEGIN
  -- 1 for admin, 2 for driver/user
  IF NEW.role = 'admin' THEN
    role_prefix := '1';
  ELSE
    role_prefix := '2';
  END IF;

  -- 2-digit year (e.g. 26)
  year_suffix := to_char(now(), 'YY');

  -- Get next sequence value
  seq_val := nextval('public.ztips_id_seq')::text;

  -- Assign the formatted ID
  NEW.ztips_id := role_prefix || year_suffix || seq_val;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update existing users to match the new format
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id, role, created_at FROM public.users ORDER BY created_at ASC LOOP
    DECLARE
      r_prefix text;
      y_suffix text;
      s_val text;
    BEGIN
      IF u.role = 'admin' THEN
        r_prefix := '1';
      ELSE
        r_prefix := '2';
      END IF;
      
      y_suffix := to_char(u.created_at, 'YY');
      s_val := nextval('public.ztips_id_seq')::text;
      
      UPDATE public.users SET ztips_id = r_prefix || y_suffix || s_val WHERE id = u.id;
    END;
  END LOOP;
END;
$$;
