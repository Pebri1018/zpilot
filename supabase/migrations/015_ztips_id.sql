-- 015_ztips_id.sql
-- Add a short, human-readable unique ZTIPS ID to every user

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ztips_id text UNIQUE;

-- Generate ZTIPS IDs for existing users who don't have one yet
-- Format: ZTP-XXXXXX (6 hex chars)
UPDATE public.users
SET ztips_id = 'ZTP-' || upper(substring(gen_random_uuid()::text, 1, 6))
WHERE ztips_id IS NULL;

-- Add NOT NULL constraint + default for new users going forward
-- We use a function so each new row auto-gets one
CREATE OR REPLACE FUNCTION generate_ztips_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ztips_id IS NULL THEN
    NEW.ztips_id := 'ZTP-' || upper(substring(gen_random_uuid()::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ztips_id ON public.users;
CREATE TRIGGER set_ztips_id
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION generate_ztips_id();
