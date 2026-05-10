-- 014_ai_feedback.sql

create table if not exists recommendation_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  recommendation_title text,
  zone_name text,
  result text check (result in ('dapat_order', 'biasa', 'gagal')),
  idle_minutes_saved integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table recommendation_feedback enable row level security;

create policy "Users can insert own feedback"
on recommendation_feedback for insert
with check (auth.uid() = user_id);

create policy "Users can view own feedback"
on recommendation_feedback for select
using (auth.uid() = user_id);
