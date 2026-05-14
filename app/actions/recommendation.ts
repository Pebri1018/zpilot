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
  // 5. Current zone intelligence
  if (currentHotspot) {
    const target = (topHotspot && topHotspot.id !== currentHotspot.id) ? topHotspot.name : (secondHotspot?.name || "area lain");
    
    if (currentHotspot.label === "PELUANG EMAS") {
      return {
        action: "STAY",
        title: isID ? "Peluang Emas!" : "Golden Opportunity!",
        reason: isID
          ? `${currentHotspot.name} sangat potensial. ${currentHotspot.reason}.`
          : `${currentHotspot.name} is highly potential. ${currentHotspot.reason}.`,
        color: "#2563EB",
        badge: "High"
      };
    }
    if (currentHotspot.label === "JEBAKAN KERUMUNAN") {
      return {
        action: "MOVE",
        title: isID ? "Jebakan Kerumunan" : "Crowd Trap",
        reason: isID
          ? `${currentHotspot.name} penuh ngetem, hindari kerumunan. Geser ke ${target}.`
          : `${currentHotspot.name} is full of idling drivers. Move to ${target}.`,
        targetZone: target,
        color: "#EF4444",
        badge: "High"
      };
    }
    if (currentHotspot.label === "BAGUS SEKARANG") {
      return {
        action: "STAY",
        title: isID ? "Bagus Sekarang" : "Good Now",
        reason: isID
          ? `${currentHotspot.name} aktif. ${currentHotspot.reason}.`
          : `${currentHotspot.name} is active. ${currentHotspot.reason}.`,
        color: "#1D4ED8",
        badge: "High"
      };
    }
    if (currentHotspot.label === "KOMPETITIF") {
      return {
        action: "MOVE",
        title: isID ? "Pesaing Padat" : "High Competition",
        reason: isID
          ? `${currentHotspot.name} ramai driver, peluang turun. Geser ${target}.`
          : `${currentHotspot.name} is crowded with drivers. Shift to ${target}.`,
        targetZone: target,
        color: "#F59E0B",
        badge: "Medium"
      };
    }
    if (currentHotspot.label === "HINDARI SEMENTARA") {
      return {
        action: "MOVE",
        title: isID ? "Hindari Sementara" : "Avoid For Now",
        reason: isID
          ? `${currentHotspot.name} kurang potensial saat ini. Coba geser ke ${target}.`
          : `${currentHotspot.name} is less potential now. Try moving to ${target}.`,
        targetZone: target,
        color: "#9CA3AF",
        badge: "Low"
      };
    }
  }

  // 6. Fallback if not in a hotspot but there is a top hotspot
  if (topHotspot && topHotspot.score >= 40) {
    return {
      action: "MOVE",
      title: isID ? "Zona Rekomendasi" : "Recommended Zone",
      reason: isID
        ? `${topHotspot.name} sedang bagus (${topHotspot.label}). Bergerak sekarang.`
        : `${topHotspot.name} is looking good (${topHotspot.label}). Move now.`,
      targetZone: topHotspot.name,
      color: "#3B82F6",
      badge: "Medium"
    };
  }

  // 7. Data Confidence Low (Fallback Mode)
  if (hotspots.length === 0 || (topHotspot && topHotspot.score < 20)) {
    return {
      action: "STAY",
      title: isID ? "Data Komunitas Minim" : "Low Community Data",
      reason: isID 
        ? "Data komunitas masih minim di sini. Coba geser ke kluster jalan utama, jelajahi 15-20 menit, atau cari kecamatan terdekat yang lebih aktif." 
        : "Community data still low here. Try main road clusters, explore for 15-20 mins, or look for nearby districts with stronger activity.",
      color: "#9CA3AF",
      badge: "Low"
    };
  }

  // Default
  return {
    action: "STAY",
    title: isID ? "ZPilot AI Siaga" : "ZPilot AI Standby",
    reason: isID ? "Memantau pergerakan pasar. Tetap waspada." : "Monitoring market. Stay alert.",
    color: "#2563EB",
    badge: "Low"
  };
}

export type ZoneStatsResult = {
  orderan: "Potensi Tinggi" | "Potensi Sedang" | "Data Minim";
  pesaing: "Padat" | "Sedang" | "Longgar";
  driverCount: number;
};

export async function getZoneStats(areaName: string | null, lat?: number | null, lng?: number | null): Promise<ZoneStatsResult> {
  const supabase = await createClient();
  const hour = new Date().getHours();
  
  let driverCountInArea = 0;
  let pesaing: "Padat" | "Sedang" | "Longgar" = "Data Minim" as any;
  let orderan: "Potensi Tinggi" | "Potensi Sedang" | "Data Minim" = "Data Minim";

  const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

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

    // Include admin manual signals within 5km
    if (lat && lng) {
      const { data: adminSignals } = await supabase
        .from("admin_manual_signals")
        .select("*")
        .gt("expires_at", now);

      if (adminSignals) {
        const signalsInArea = adminSignals.filter(s => {
          return getDist(lat, lng, s.lat, s.lng) <= 5;
        });
        const totalManualDrivers = signalsInArea.reduce((acc, s) => acc + s.count, 0);
        driverCountInArea += totalManualDrivers;
      }
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
