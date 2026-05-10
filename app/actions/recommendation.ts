"use server";

import { createClient } from "@/lib/supabase/server";
import type { HotspotZone } from "./hotspot";

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
  merchantCount: number,
  lang: string = "ID",
  hotspots: HotspotZone[] = []
): Promise<RecommendationResult> {
  const hour = new Date().getHours();
  const currentArea = areaName?.toLowerCase() || "";
  const isID = lang === "ID";

  // 1. Status Rules
  if (status === "Offline") {
    return {
      action: "OFFLINE",
      title: isID ? "Pilot Siaga" : "Pilot Standby",
      reason: isID ? "Kamu sedang offline. Aktifkan status untuk mulai memindai hotspot." : "You're offline. Go online to start scanning hotspot.",
      color: "#9CA3AF",
      badge: "High"
    };
  }

  if (status === "Antar") {
    return {
      action: "BUSY",
      title: isID ? "Sedang Mengantar" : "Delivery in Progress",
      reason: isID ? "Selesaikan pengantaran dulu. Hotspot berikutnya akan disarankan setelah selesai." : "Complete delivery first. Next hotspot will be suggested after finish.",
      color: "#F59E0B",
      badge: "High"
    };
  }

  const topHotspot = hotspots.length > 0 ? hotspots[0] : null;
  const secondHotspot = hotspots.length > 1 ? hotspots[1] : null;
  const currentHotspot = hotspots.find(h => currentArea.includes(h.name.toLowerCase()));

  // 2. Too Long Idle (Ngetem >= 15 mins)
  if (idleMinutes >= 15) {
    const target = topHotspot?.name || "area lain";
    return {
      action: "MOVE",
      title: isID ? "Pindah Sekarang" : "Move Now",
      reason: isID ? `Kamu ngetem ${idleMinutes} menit. Geser ke ${target} sekarang.` : `Idle for ${idleMinutes} mins. Move to ${target}.`,
      targetZone: target,
      color: "#EF4444",
      badge: "High"
    };
  }

  // 3. High Competition (Driver >= 5)
  if (driverCount >= 5) {
    const target = (currentHotspot && topHotspot && currentHotspot.id === topHotspot.id && secondHotspot)
      ? secondHotspot.name
      : (topHotspot?.name || "area lain");
    return {
      action: "MOVE",
      title: isID ? "Pesaing Padat" : "Crowded Zone",
      reason: isID ? `Area ini padat pesaing. Geser ke ${target}.` : `Too many drivers here. Shift to ${target}.`,
      targetZone: target,
      color: "#F59E0B",
      badge: "High"
    };
  }

  // 4. Peak Hours
  const isLunchPeak = hour >= 11 && hour <= 13;
  if (isLunchPeak) {
    if (currentArea.includes("kampus") || currentArea.includes("seturan") || currentArea.includes("babarsari")) {
      return {
        action: "STAY",
        title: isID ? "Lunch Peak" : "Lunch Peak",
        reason: isID ? "Tahan di sini. Prioritaskan merchant food zone." : "Stay here. Prioritize food merchants.",
        color: "#10B981",
        badge: "Medium"
      };
    } else {
      const target = hotspots.find(h => h.name.includes("Seturan") || h.name.includes("Babarsari") || h.name.includes("UGM"))?.name || "Seturan";
      return {
        action: "MOVE",
        title: isID ? "Lunch Peak Mulai" : "Lunch Peak Started",
        reason: isID ? `Jam makan siang. Geser ke ${target}.` : `Lunch time. Move to ${target}.`,
        targetZone: target,
        color: "#F59E0B",
        badge: "Medium"
      };
    }
  }

  // 5. If current zone is Menarik/Ramai
  if (currentHotspot && (currentHotspot.label === "RAMAI" || currentHotspot.label === "MENARIK")) {
    return {
      action: "STAY",
      title: isID ? "Zona Bagus" : "Good Zone",
      reason: isID ? `Sinyal ${currentHotspot.label.toLowerCase()}. Tahan posisi.` : `Zone is ${currentHotspot.label}. Hold position.`,
      color: "#3B82F6",
      badge: "High"
    };
  }

  // Default
  return {
    action: "STAY",
    title: isID ? "Standby" : "Standby",
    reason: isID ? "Memantau pergerakan pasar. Tetap waspada." : "Monitoring market. Stay alert.",
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
