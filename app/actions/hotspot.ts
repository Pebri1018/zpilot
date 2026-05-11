"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";

function getServiceClient() {
  const url = getSupabaseUrl()!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Haversine distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;  
  const dLon = (lon2 - lon1) * Math.PI / 180; 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

const PREDEFINED_ZONES = [
  { id: "seturan", name: "Seturan", lat: -7.7661, lng: 110.4079 },
  { id: "babarsari", name: "Babarsari", lat: -7.7770, lng: 110.4140 },
  { id: "gejayan", name: "Gejayan", lat: -7.7665, lng: 110.3955 },
  { id: "jakal", name: "Jakal Bawah", lat: -7.7550, lng: 110.3800 },
  { id: "ugm", name: "UGM Area", lat: -7.7668, lng: 110.3779 },
  { id: "kota", name: "Kota Jogja", lat: -7.7956, lng: 110.3695 }
];

const ZONE_RADIUS_KM = 0.8; // 800m

export type HotspotZone = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  score: number;
  label: "RAMAI" | "MENARIK" | "SEPI" | "PELUANG" | "KOMPETISI";
  antar_drivers: number;
  ngetem_drivers: number;
  merchant_count: number;
};

export async function getHotspots(): Promise<HotspotZone[]> {
  try {
    const supabase = getServiceClient();
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    // 1. Fetch active drivers (last 60 min, not Offline)
    const { data: drivers, error: dErr } = await supabase
      .from("users")
      .select("last_lat, last_lng, status")
      .not("last_lat", "is", null)
      .neq("status", "Offline")
      .gte("last_active", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (dErr) console.error("hotspot drivers error:", dErr.message);

    // 2. Fetch active merchants (no expires_at filter — just check is_active)
    const { data: merchants, error: mErr } = await supabase
      .from("merchant_signals")
      .select("lat, lng")
      .eq("is_active", true)
      .not("lat", "is", null);

    if (mErr) console.error("hotspot merchants error:", mErr.message);

    // 2.5 Fetch manual signals
    const { data: manualSignals, error: msErr } = await supabase
      .from("admin_manual_signals")
      .select("lat, lng, count, type")
      .gt("expires_at", new Date().toISOString());

    if (msErr) console.error("hotspot manual signals error:", msErr.message);

    // 3. Process each zone
    const hotspots: HotspotZone[] = PREDEFINED_ZONES.map(zone => {
      let antarCount = 0;
      let ngetemCount = 0;
      let merchantCount = 0;

      // Count drivers in zone
      drivers?.forEach(d => {
        if (!d.last_lat || !d.last_lng) return;
        const dist = getDistance(zone.lat, zone.lng, d.last_lat, d.last_lng);
        if (dist <= ZONE_RADIUS_KM) {
          if (d.status === "Antar") antarCount++;
          else if (d.status === "Ngetem") ngetemCount++;
        }
      });

      // Count manual signals in zone
      manualSignals?.forEach(ms => {
        if (!ms.lat || !ms.lng) return;
        const dist = getDistance(zone.lat, zone.lng, ms.lat, ms.lng);
        if (dist <= ZONE_RADIUS_KM) {
          if (ms.type === "driver_ngetem") ngetemCount += (ms.count || 1);
        }
      });

      // Count merchants in zone
      merchants?.forEach(m => {
        if (!m.lat || !m.lng) return;
        const dist = getDistance(zone.lat, zone.lng, m.lat, m.lng);
        if (dist <= ZONE_RADIUS_KM) merchantCount++;
      });

      // 4. Calculate Score
      // (antar * 3) + (merchants * 2) - (ngetem * 1.5)
      const score = (antarCount * 3) + (merchantCount * 2) - (ngetemCount * 1.5);
      
      let label: HotspotZone["label"] = "SEPI";
      
      // Opportunity zone: Good merchants, low ngetem
      if (merchantCount >= 2 && ngetemCount <= 1) {
        label = "PELUANG";
      } 
      // Competition zone: Too many ngetem drivers compared to merchants
      else if (ngetemCount >= 4 && ngetemCount > merchantCount * 1.5) {
        label = "KOMPETISI";
      }
      else if (score >= 12) label = "RAMAI";
      else if (score >= 5) label = "MENARIK";

      return {
        ...zone,
        score,
        label,
        antar_drivers: antarCount,
        ngetem_drivers: ngetemCount,
        merchant_count: merchantCount
      };
    });

    // Sort by score descending
    return hotspots.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("getHotspots error:", error);
    return PREDEFINED_ZONES.map(z => ({
      ...z, score: 0, label: "SEPI", antar_drivers: 0, ngetem_drivers: 0, merchant_count: 0
    }));
  }
}
