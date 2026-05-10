"use server";

import { createClient } from "@/lib/supabase/server";

export type RecommendationResult = {
  action: "STAY" | "MOVE";
  title: string;
  reason: string;
  targetZone?: string;
  color: string;
};

export async function getRecommendationV2(areaName: string | null): Promise<RecommendationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const hour = new Date().getHours();
  const currentArea = areaName?.toLowerCase() || "";

  let driverCountInArea = 0;
  let activeMinutes = 0;

  if (user) {
    // 1. Check Driver Density in the same area
    if (areaName) {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      // Check for manual overrides first (Founder Intelligence)
      const { data: manualReport } = await supabase
        .from("manual_density_reports")
        .select("driver_count")
        .eq("area", areaName)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (manualReport) {
        driverCountInArea = manualReport.driver_count;
      } else {
        // Fallback to passive crowdsourced data
        const { count } = await supabase
          .from("driver_locations")
          .select("*", { count: 'exact', head: true })
          .eq("area_name", areaName)
          .gte("updated_at", fifteenMinsAgo);
        
        driverCountInArea = count || 0;
      }
    }

    // 2. Check recent movement (active minutes today)
    const today = new Date().toISOString().split("T")[0];
    const { data: session } = await supabase
      .from("daily_sessions")
      .select("active_minutes")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();
      
    activeMinutes = session?.active_minutes || 0;
  }

  // --- LOGIC ENGINE V2 ---

  // High density + Non-peak hour -> Move
  if (driverCountInArea >= 5 && !(hour >= 11 && hour <= 13) && !(hour >= 17 && hour <= 20)) {
    return {
      action: "MOVE",
      title: "Pesaing Padat",
      reason: `Ada ${driverCountInArea} driver di area ini, padahal jam santai. Geser ke area lain untuk hindari rebutan.`,
      color: "#EF4444" // Red
    };
  }

  // High active minutes -> Take a break
  if (activeMinutes > 180 && driverCountInArea < 3) {
    return {
      action: "STAY",
      title: "Waktunya Rehat?",
      reason: `Kamu sudah aktif ${Math.round(activeMinutes / 60)} jam lebih. Area ini cukup sepi, bisa istirahat sambil nunggu.`,
      color: "#3B82F6" // Blue
    };
  }

  // 11:00 - 13:00 (Lunch time)
  if (hour >= 11 && hour <= 13) {
    if (currentArea.includes("kampus") || currentArea.includes("ugm") || currentArea.includes("uny") || currentArea.includes("upn") || currentArea.includes("seturan")) {
      return {
        action: "STAY",
        title: "Tetap di Sini",
        reason: "Waktu makan siang, orderan area kampus dan kos biasanya tinggi.",
        color: "#10B981" // Green
      };
    } else {
      return {
        action: "MOVE",
        title: "Geser ke Kampus",
        reason: "Jam makan siang. Area kampus/kos lebih potensial dari kantoran.",
        color: "#F59E0B" // Orange
      };
    }
  }

  // 14:00 - 16:00 (Afternoon slump)
  if (hour >= 14 && hour <= 16) {
    return {
      action: "MOVE",
      title: "Cari Snack Sore",
      reason: "Jam nanggung. Cari spot jajanan/minuman kekinian seperti Mixue atau Gacoan.",
      color: "#F59E0B"
    };
  }

  // 17:00 - 20:00 (Dinner time)
  if (hour >= 17 && hour <= 20) {
    if (driverCountInArea < 4) {
      return {
        action: "STAY",
        title: "Spot Bagus",
        reason: "Waktu makan malam dan pesaing sedikit di sini. Standby!",
        color: "#10B981"
      };
    }
  }

  // Default Fallback
  return {
    action: "STAY",
    title: "Tetap Standby",
    reason: "Menunggu pola orderan terbaru di area ini...",
    color: "#10B981"
  };
}
