"use server";

import { createClient } from "@/lib/supabase/server";

export type RecommendationResult = {
  action: "STAY" | "MOVE" | "OFFLINE" | "BUSY";
  title: string;
  reason: string;
  targetZone?: string;
  color: string;
  badge?: "High" | "Medium" | "Low";
};

export async function getRecommendationV2(
  areaName: string | null,
  status: string,
  idleMinutes: number,
  driverCount: number,
  merchantCount: number
): Promise<RecommendationResult> {
  const hour = new Date().getHours();
  const currentArea = areaName?.toLowerCase() || "";

  // 1. Status Rules
  if (status === "Offline") {
    return {
      action: "OFFLINE",
      title: "Pilot Standby",
      reason: "You're offline. Go online to start scanning hotspot.",
      color: "#9CA3AF", // Gray
      badge: "High"
    };
  }

  if (status === "Antar") {
    return {
      action: "BUSY",
      title: "Delivery in Progress",
      reason: "Complete delivery first. Next hotspot will be suggested after finish.",
      color: "#F59E0B", // Orange
      badge: "High"
    };
  }

  // 2. High Competition Rule
  if (driverCount >= 5) {
    return {
      action: "MOVE",
      title: "High Competition",
      reason: "Competition high. Shift 500m away to avoid crowd.",
      color: "#F59E0B",
      badge: "High"
    };
  }

  // 3. Time-based Rules
  const isLunchPeak = hour >= 11 && hour <= 13;
  const isDinnerPeak = hour >= 17 && hour <= 20;

  if (isLunchPeak) {
    if (!currentArea.includes("kampus") && !currentArea.includes("seturan") && !currentArea.includes("babarsari")) {
      return {
        action: "MOVE",
        title: "Lunch Peak Active",
        reason: "Prioritize food zones like campus area or Seturan.",
        color: "#10B981", // Green
        badge: "Medium"
      };
    }
  }

  // 4. Idle Timer & Density Rules
  const hasMerchants = merchantCount > 0;

  if (idleMinutes < 8 && hasMerchants) {
    return {
      action: "STAY",
      title: "Good Potential",
      reason: "Stay 5 more minutes. Area still has active merchants.",
      color: "#3B82F6", // Blue
      badge: "High"
    };
  }

  if (idleMinutes > 15 && !hasMerchants) {
    return {
      action: "MOVE",
      title: "Dead Zone",
      reason: "No signal here. Move to Seturan / Babarsari or nearby hotspots.",
      color: "#EF4444", // Red
      badge: "High"
    };
  }

  if (idleMinutes > 30) {
    return {
      action: "MOVE",
      title: "Stuck Too Long",
      reason: "You've been waiting too long. Shift area to reset algorithm.",
      color: "#EF4444",
      badge: "Medium"
    };
  }

  // Future Ready / Evening
  if (hour >= 15 && hour < 17) {
    return {
      action: "STAY",
      title: "Evening Prep",
      reason: "Demand may rise soon for dinner. Position yourself near restos.",
      color: "#10B981",
      badge: "Low"
    };
  }

  // Default Fallback
  return {
    action: "STAY",
    title: "Scanning Radar",
    reason: "Monitoring local signals. Stay alert for sudden orders.",
    color: "#10B981",
    badge: "Low"
  };
}

export type ZoneStatsResult = {
  orderan: "Potensi Tinggi" | "Potensi Sedang" | "Data Minim";
  pesaing: "Padat" | "Sedang" | "Longgar";
  driverCount: number;
};

export async function getZoneStats(areaName: string | null): Promise<ZoneStatsResult> {
  const supabase = await createClient();
  const hour = new Date().getHours();
  
  let driverCountInArea = 0;
  let pesaing: "Padat" | "Sedang" | "Longgar" = "Data Minim" as any;
  let orderan: "Potensi Tinggi" | "Potensi Sedang" | "Data Minim" = "Data Minim";

  if (areaName) {
    // 1. Calculate Pesaing
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

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
      const { count } = await supabase
        .from("driver_locations")
        .select("*", { count: 'exact', head: true })
        .eq("area_name", areaName)
        .gte("updated_at", fifteenMinsAgo);
      driverCountInArea = count || 0;
    }

    if (driverCountInArea >= 5) pesaing = "Padat";
    else if (driverCountInArea >= 2) pesaing = "Sedang";
    else pesaing = "Longgar";

    // 2. Calculate Orderan
    const { count: merchantCount } = await supabase
      .from("merchant_signals")
      .select("*", { count: 'exact', head: true })
      .eq("area", areaName)
      .gt("expires_at", now);

    const isPeakHour = (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 20);
    const hasActiveMerchants = (merchantCount || 0) > 0;

    if (hasActiveMerchants && isPeakHour) orderan = "Potensi Tinggi";
    else if (hasActiveMerchants || isPeakHour) orderan = "Potensi Sedang";
    else orderan = "Data Minim";
  } else {
    pesaing = "Longgar";
    orderan = "Data Minim";
  }

  return { orderan, pesaing, driverCount: driverCountInArea };
}
