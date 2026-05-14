"use server";

import { createClient } from "@/lib/supabase/server";

export type PersonalHotspot = {
  area: string;
  count: number;
  lat: number;
  lng: number;
};

export async function saveUserSignal(type: string, lat: number, lng: number, area: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase
    .from("user_zone_history")
    .insert({
      user_id: user.id,
      signal_type: type,
      lat,
      lng,
      area
    });

  return { success: !error, error };
}

export async function getPersonalHotspots(): Promise<PersonalHotspot[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get most frequent areas from history in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("user_zone_history")
    .select("area, lat, lng")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo);

  if (error || !data) return [];

  // Group by area and take averages of lat/lng
  const clusters: Record<string, { count: number, lats: number[], lngs: number[] }> = {};
  data.forEach(row => {
    if (!row.area) return;
    if (!clusters[row.area]) {
      clusters[row.area] = { count: 0, lats: [], lngs: [] };
    }
    clusters[row.area].count++;
    clusters[row.area].lats.push(row.lat);
    clusters[row.area].lngs.push(row.lng);
  });

  return Object.entries(clusters)
    .map(([area, stats]) => ({
      area,
      count: stats.count,
      lat: stats.lats.reduce((a, b) => a + b, 0) / stats.lats.length,
      lng: stats.lngs.reduce((a, b) => a + b, 0) / stats.lngs.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}
