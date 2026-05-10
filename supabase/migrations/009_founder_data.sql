-- 009_founder_data.sql
-- Tabel untuk catatan founder dan spot ngetem

-- Founder notes: catatan cepat temuan lapangan
CREATE TABLE IF NOT EXISTS public.founder_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('spot_bagus', 'jebakan', 'merchant_ramai', 'lainnya')),
  area text,
  lat double precision,
  lng double precision,
  notes text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Ngetem spots: spot mangkal yang sudah terbukti bagus
CREATE TABLE IF NOT EXISTS public.ngetem_spots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  area text NOT NULL,
  lat double precision,
  lng double precision,
  quality text NOT NULL CHECK (quality IN ('Bagus', 'Lumayan', 'Jebakan')),
  best_hours text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Disable RLS for MVP
ALTER TABLE public.founder_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngetem_spots DISABLE ROW LEVEL SECURITY;
