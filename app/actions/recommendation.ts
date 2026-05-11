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
  const jakartaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const hour = jakartaTime.getHours();
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

  // 4. Time-context awareness (informational, not forced move)
  const isLunchPeak = hour >= 11 && hour <= 13;
  const isDinnerPeak = hour >= 17 && hour <= 19;
  const isNight = hour >= 20 && hour <= 23;
  const isLatNight = hour >= 0 && hour <= 4;
  const isPeak = isLunchPeak || isDinnerPeak;

  // 5. Current zone intelligence
  if (currentHotspot) {
    if (currentHotspot.label === "PELUANG") {
      return {
        action: "STAY",
        title: isID ? "Zona Peluang!" : "Opportunity Zone!",
        reason: isID
          ? `Zona ini punya banyak merchant tapi driver masih sedikit. ${isPeak ? "Jam sibuk sekarang — stay dulu!" : "Hold posisi."}`
          : `High merchant signal, low drivers. ${isPeak ? "Peak hours — stay here!" : "Hold position."}`,
        color: "#10B981",
        badge: "High"
      };
    }
    if (currentHotspot.label === "RAMAI" || currentHotspot.label === "MENARIK") {
      return {
        action: "STAY",
        title: isID ? "Zona Bagus" : "Good Zone",
        reason: isID
          ? `Sinyal ${currentHotspot.label.toLowerCase()} di sini. Tetap stand by.`
          : `Zone is ${currentHotspot.label}. Hold position.`,
        color: "#3B82F6",
        badge: "High"
      };
    }
    if (currentHotspot.label === "KOMPETISI") {
      const target = (topHotspot && topHotspot.id !== currentHotspot.id) ? topHotspot.name : secondHotspot?.name || "area lain";
      return {
        action: "MOVE",
        title: isID ? "Zona Terlalu Padat" : "Overcrowded Zone",
        reason: isID
          ? `Terlalu banyak driver di sini. Coba geser ke ${target}.`
          : `Too many drivers. Shift to ${target}.`,
        targetZone: target,
        color: "#EF4444",
        badge: "High"
      };
    }
  }

  // 6. General peak hour suggestion with real data
  if (isPeak && merchantCount > 0 && topHotspot) {
    return {
      action: "STAY",
      title: isID ? (isLunchPeak ? "Jam Makan Siang" : "Jam Makan Malam") : (isLunchPeak ? "Lunch Rush" : "Dinner Rush"),
      reason: isID
        ? `${isLunchPeak ? "11–13" : "17–19"} adalah jam sibuk. Ada ${merchantCount} merchant aktif. ${topHotspot.name} sedang panas.`
        : `${isLunchPeak ? "11–13" : "17–19"} is peak. ${merchantCount} active merchants. ${topHotspot.name} is hot.`,
      color: "#10B981",
      badge: "Medium"
    };
  }

  if (isNight) {
    return {
      action: "STAY",
      title: isID ? "Malam Aktif" : "Active Night",
      reason: isID
        ? "Waktu rawan orderan malam (martabak/nasi goreng). Area kos-kosan sangat direkomendasikan."
        : "Night cravings time. Dorm areas are highly recommended.",
      color: "#6366F1",
      badge: "Low"
    };
  }

  if (isLatNight) {
    return {
      action: "STAY",
      title: isID ? "Dini Hari" : "Late Night",
      reason: isID
        ? "Volume orderan biasanya turun dini hari. Fokus ke area kos-kosan atau 24 jam."
        : "Order volume tends to drop at night. Focus on dorm areas or 24h spots.",
      color: "#6366F1",
      badge: "Low"
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
