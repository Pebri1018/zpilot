"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitRecommendationFeedback(
  title: string,
  zone: string,
  result: "dapat_order" | "biasa" | "gagal",
  idleMinutes: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("recommendation_feedback").insert({
    user_id: user.id,
    recommendation_title: title,
    zone_name: zone,
    result,
    idle_minutes_saved: result === "dapat_order" ? idleMinutes : 0
  });

  if (error) {
    console.error("Failed to submit feedback", error);
    return { error: error.message };
  }

  return { success: true };
}

export type DailyPerformance = {
  correct: number;
  failed: number;
  avgWaitSaved: number;
};

export async function getDailyPerformance(): Promise<DailyPerformance> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { correct: 0, failed: 0, avgWaitSaved: 0 };

  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("recommendation_feedback")
    .select("result, idle_minutes_saved")
    .eq("user_id", user.id)
    .gte("created_at", today);

  if (!data) return { correct: 0, failed: 0, avgWaitSaved: 0 };

  let correct = 0;
  let failed = 0;
  let totalSaved = 0;

  data.forEach(d => {
    if (d.result === "dapat_order") {
      correct++;
      totalSaved += d.idle_minutes_saved || 0;
    } else if (d.result === "gagal") {
      failed++;
    }
  });

  const avgWaitSaved = correct > 0 ? Math.round(totalSaved / correct) : 0;
  
  return { correct, failed, avgWaitSaved };
}
