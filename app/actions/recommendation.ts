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
  hotspots: HotspotZone[] = [],
  latitude?: number | null,
  longitude?: number | null
): Promise<RecommendationResult> {
  const jakartaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const hour = jakartaTime.getHours();
  const currentArea = areaName?.toLowerCase() || "";
  const isID = lang === "ID";

  const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

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
  
  const nearestHs = hotspots.length > 0 && latitude && longitude
    ? hotspots.map(h => ({ ...h, dist: getDist(latitude, longitude, h.lat, h.lng) }))
              .sort((a, b) => a.dist - b.dist)[0]
    : null;

  // 2. Proximity-based logic (CRITICAL UPGRADE)
  if (nearestHs && nearestHs.dist <= 0.5) {
     // User is inside a zone (500m radius)
     let microArea = isID ? "titik lain di sekitarmu" : "other spots nearby";
     const name = nearestHs.name.toLowerCase();
     if (name.includes("seturan")) {
        microArea = "Plaza Ambarukmo side atau Babarsari Timur";
     } else if (name.includes("babarsari")) {
        microArea = "Ringroad Utara side atau Seturan Selatan";
     } else if (name.includes("gejayan")) {
        microArea = "Jalan Colombo atau area Condongcatur";
     }

     return {
       action: "STAY",
       title: isID ? "Zona Bagus" : "Good Zone",
       reason: isID 
         ? `Anda sudah di ${nearestHs.name}. Pantau 10-15 menit atau geser ke area mikro sekitar seperti ${microArea}.`
         : `You're in ${nearestHs.name}. Monitor for 10-15 mins or shift to micro areas like ${microArea}.`,
       color: "#2d5af1",
       badge: "High"
     };
  }

  // Suggest move to nearest best hotspot if far (> 1km)
  if (nearestHs && nearestHs.dist > 1.0 && nearestHs.score >= 35) {
    return {
      action: "MOVE",
      title: isID ? "Hotspot Terdekat" : "Nearest Hotspot",
      reason: isID
        ? `${nearestHs.name} adalah hotspot terdekat (${nearestHs.dist.toFixed(1)} km) yang potensial. Bergerak ke sana.`
        : `${nearestHs.name} is the nearest potential hotspot (${nearestHs.dist.toFixed(1)} km). Move there.`,
      targetZone: nearestHs.name,
      color: "#3B82F6",
      badge: "Medium"
    };
  }

  // 3. Too Long Idle (Ngetem >= 15 mins)
  if (idleMinutes >= 15) {
    const target = (nearestHs && nearestHs.dist > 0.5) ? nearestHs.name : (topHotspot?.name || "area lain");
    return {
      action: "MOVE",
      title: isID ? "Pindah Sekarang" : "Move Now",
      reason: isID ? `Sudah 15 menit tanpa pergerakan. Coba pindah ke ${target} untuk segarkan sinyal.` : `Idle for 15 mins. Try moving to ${target} to refresh signals.`,
      targetZone: target,
      color: "#EF4444",
      badge: "High"
    };
  }

  // 4. High Competition (Driver >= 5)
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

  // 5. Time-context awareness
  const isLunchPeak = hour >= 11 && hour <= 13;
  const isDinnerPeak = hour >= 17 && hour <= 19;
  const isPeak = isLunchPeak || isDinnerPeak;

  // 6. Current zone intelligence (Labels)
  if (currentHotspot) {
    const target = (topHotspot && topHotspot.id !== currentHotspot.id) ? topHotspot.name : (secondHotspot?.name || "area lain");
    
    if (currentHotspot.label === "PELUANG EMAS") {
      return {
        action: "STAY",
        title: isID ? "Peluang Emas!" : "Golden Opportunity!",
        reason: isID
          ? `${currentHotspot.name} sangat potensial. ${currentHotspot.reason}.`
          : `${currentHotspot.name} is highly potential. ${currentHotspot.reason}.`,
        color: "#2d5af1",
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

  // 7. Fallback if not in a hotspot but there is a top hotspot
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

  // Default Fallback
  return {
    action: "STAY",
    title: isID ? "ZPilot AI Siaga" : "ZPilot AI Standby",
    reason: isID ? "Memantau pergerakan pasar. Tetap waspada di titik strategis." : "Monitoring market. Stay alert in strategic spots.",
    color: "#2d5af1",
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
  const jakartaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const hour = jakartaTime.getHours();
  
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
