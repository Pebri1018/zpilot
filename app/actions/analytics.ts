"use server";

import { createClient } from "@/lib/supabase/server";

export async function recordSessionOpen() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  
  await supabase.rpc("increment_session_metrics", {
    p_user_id: user.id,
    p_date: today,
    p_open_count: 1,
  });
}

export async function recordZoneChange(newArea: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  
  await supabase.rpc("increment_session_metrics", {
    p_user_id: user.id,
    p_date: today,
    p_zone_changes: 1,
    p_last_known_area: newArea,
  });
}

export async function recordActiveMinute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  
  await supabase.rpc("increment_session_metrics", {
    p_user_id: user.id,
    p_date: today,
    p_active_minutes: 1,
  });
}
