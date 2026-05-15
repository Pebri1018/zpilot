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
  label: "PELUANG EMAS" | "BAGUS SEKARANG" | "NORMAL" | "KOMPETITIF" | "HINDARI SEMENTARA" | "JEBAKAN KERUMUNAN";
  antar_drivers: number;
  ngetem_drivers: number;
  merchant_count: number;
  reason?: string;
};

export async function getHotspots(): Promise<HotspotZone[]> {
  try {
    const supabase = getServiceClient();
    const now = new Date().toISOString();
    
    // 1. Fetch active drivers (last 60 min, not Offline)
    const { data: drivers, error: dErr } = await supabase
      .from("users")
      .select("last_lat, last_lng, status")
      .not("last_lat", "is", null)
      .neq("status", "Offline")
      .gte("last_active", new Date(Date.now() - 20 * 60 * 1000).toISOString());

    if (dErr) console.error("hotspot drivers error:", dErr.message);

    // 2. Fetch active merchants
    const { data: merchants, error: mErr } = await supabase
      .from("merchant_signals")
      .select("lat, lng")
      .eq("is_active", true)
      .not("lat", "is", null);

    if (mErr) console.error("hotspot merchants error:", mErr.message);

    // 3. Fetch manual signals
    const { data: manualSignals, error: msErr } = await supabase
      .from("admin_manual_signals")
      .select("lat, lng, count, type")
      .gt("expires_at", now);

    if (msErr) console.error("hotspot manual signals error:", msErr.message);

    const jakartaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const hour = jakartaTime.getHours();
    const day = jakartaTime.getDay();

    // 4. Group other merchants by area (Dynamic Zones)
    const areaMap: Record<string, { lat: number, lng: number, count: number }> = {};
    merchants?.forEach(m => {
      if (!m.lat || !m.lng || !m.area) return;
      // Skip if it's already near a predefined zone
      const isPredefined = PREDEFINED_ZONES.some(z => getDistance(z.lat, z.lng, m.lat, m.lng) < 1.0);
      if (isPredefined) return;

      if (!areaMap[m.area]) areaMap[m.area] = { lat: 0, lng: 0, count: 0 };
      areaMap[m.area].lat += m.lat;
      areaMap[m.area].lng += m.lng;
      areaMap[m.area].count++;
    });

    const dynamicZones = Object.entries(areaMap)
      .filter(([_, data]) => data.count >= 2) // At least 2 merchants
      .map(([name, data]) => ({
        id: `dynamic-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name: name,
        lat: data.lat / data.count,
        lng: data.lng / data.count
      }));

    const ALL_ZONES = [...PREDEFINED_ZONES, ...dynamicZones];

    // 5. Process each zone
    const hotspots: HotspotZone[] = ALL_ZONES.map(zone => {
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

      // Count merchants in zone
      merchants?.forEach(m => {
        if (!m.lat || !m.lng) return;
        const dist = getDistance(zone.lat, zone.lng, m.lat, m.lng);
        if (dist <= ZONE_RADIUS_KM) merchantCount++;
      });

      // Time Bonus System
      let timeBonus = 0;
      if (hour >= 6 && hour < 9) timeBonus = 3;
      else if (hour >= 11 && hour < 14) timeBonus = 5;
      else if (hour >= 17 && hour < 21) timeBonus = 5;
      else if (hour >= 22 || hour < 1) timeBonus = 4;

      // Area Behavior Rules
      let areaBonus = 0;
      let reason = "Permintaan normal";
      
      const zid = zone.id;
      if (zid === "seturan") {
        if (hour >= 6 && hour < 10) {
          reason = "Sarapan kos & mahasiswa mulai aktif";
          areaBonus = 3;
        } else if ((hour >= 11 && hour < 14) || (hour >= 17 && hour < 21) || (hour >= 22 || hour < 1)) {
          areaBonus = 5;
          reason = "Banyak kos, kuat di jam makan & malam";
        } else { reason = "Persaingan tinggi, pantau terus"; }
      } else if (zid === "babarsari") {
        if (hour >= 6 && hour < 10) { reason = "Kuat di sarapan & kopi pagi"; areaBonus = 2; }
        else { areaBonus = 3; reason = "Permintaan stabil, zona aman"; }
      } else if (zid === "gejayan") {
        if ((hour >= 11 && hour < 14) || (hour >= 17 && hour < 21)) {
          areaBonus = 4;
          reason = "Pergerakan cepat di jam makan";
        }
      } else if (zid.startsWith("dynamic-")) {
        reason = `Potensi di ${zone.name} (Lokal)`;
        areaBonus = 2;
      }

      const score = (antarCount * 7) + (merchantCount * 3) + (timeBonus * 4) - (ngetemCount * 4) + areaBonus;
      
      let label: HotspotZone["label"] = "NORMAL";
      if (ngetemCount >= 5 && antarCount <= 1) {
        label = "JEBAKAN KERUMUNAN";
        reason = "Penuh ngetem, hindari kerumunan";
      } else if (score >= 75) label = "PELUANG EMAS";
      else if (score >= 55) label = "BAGUS SEKARANG";
      else if (score >= 35) label = "NORMAL";
      else if (score >= 15) label = "KOMPETITIF";
      else label = "HINDARI SEMENTARA";

      return {
        ...zone,
        score,
        label,
        antar_drivers: antarCount,
        ngetem_drivers: ngetemCount,
        merchant_count: merchantCount,
        reason
      };
    });

    // Sort by score descending
    return hotspots.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("getHotspots error:", error);
    return PREDEFINED_ZONES.map(z => ({
      ...z, score: 0, label: "HINDARI SEMENTARA", antar_drivers: 0, ngetem_drivers: 0, merchant_count: 0, reason: "Data error"
    }));
  }
}
