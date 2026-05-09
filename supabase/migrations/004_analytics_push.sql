-- 004_analytics_push.sql
-- Run this in Supabase SQL Editor

-- Table for Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  auth text NOT NULL,
  p256dh text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table for Daily Sessions Analytics
CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  open_count integer DEFAULT 0,
  zone_changes integer DEFAULT 0,
  active_minutes integer DEFAULT 0,
  last_known_area text,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Disable RLS for MVP
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions DISABLE ROW LEVEL SECURITY;

-- RPC for incrementing session metrics atomically
CREATE OR REPLACE FUNCTION public.increment_session_metrics(
  p_user_id uuid,
  p_date date,
  p_open_count integer DEFAULT 0,
  p_zone_changes integer DEFAULT 0,
  p_active_minutes integer DEFAULT 0,
  p_last_known_area text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_sessions (
    user_id, date, open_count, zone_changes, active_minutes, last_known_area
  )
  VALUES (
    p_user_id, p_date, p_open_count, p_zone_changes, p_active_minutes, p_last_known_area
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    open_count = public.daily_sessions.open_count + p_open_count,
    zone_changes = public.daily_sessions.zone_changes + p_zone_changes,
    active_minutes = public.daily_sessions.active_minutes + p_active_minutes,
    last_known_area = COALESCE(p_last_known_area, public.daily_sessions.last_known_area),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
