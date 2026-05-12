"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { useLocation } from "@/hooks/useLocation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { getHotspots, type HotspotZone } from "@/app/actions/hotspot";

const RadarMap = dynamic(() => import("@/components/RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#f0f0f0] animate-pulse rounded-[1.25rem] flex items-center justify-center">
      <span className="text-neutral-500 text-[0.8rem] font-bold uppercase tracking-widest">Scanning...</span>
    </div>
  ),
});

export type RadarMarker = {
  id: string;
  lat: number;
  lng: number;
  type: "driver_ngetem" | "driver_antar" | "merchant_sepi" | "merchant_bergerak" | "merchant_mulaipanas" | "merchant_ramai" | "merchant_sangatsibuk" | "spot";
  label: string;
  live_status?: string;
  antar_nearby?: number;
  ngetem_nearby?: number;
  promo_active?: boolean;
  quality?: string;
  best_hours?: string;
  notes?: string;
};

function RadarContent() {
  const { lang, t } = useLanguage();
  const { latitude, longitude, areaName, loading, error } = useLocation();
  const searchParams = useSearchParams();
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  
  const mapLat = urlLat ? Number(urlLat) : latitude;
  const mapLng = urlLng ? Number(urlLng) : longitude;

  const [markers, setMarkers] = useState<RadarMarker[]>([]);
  const [hotspots, setHotspots] = useState<HotspotZone[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [driverCount, setDriverCount] = useState(0);

  // Idle Timer State
  const [showMoveSuggest, setShowMoveSuggest] = useState(false);
  const lastMovedRef = useRef<number>(0);
  const lastLatRef = useRef<number | null>(null);
  const lastLngRef = useRef<number | null>(null);

  // Haversine distance in km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
  };

  const fetchData = async () => {
    setFetching(true);
    try {
      const supabase = createClient();
      const now = new Date();
      const activeLimit = new Date(now.getTime() - 60 * 60000).toISOString(); // 60 min window

        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;

        // 1. Fetch active (non-Offline) drivers from users table
        const { data: drivers, error: dErr } = await supabase
          .from("users")
          .select("id, last_lat, last_lng, status, nama")
          .not("last_lat", "is", null);

        if (dErr) {
          console.error("RADAR DEBUG: Supabase error fetching driver_locations:", dErr);
          setFetchError("Gagal memuat data driver.");
        } else {
          console.log("RADAR DEBUG: Fetched drivers count:", drivers?.length || 0);
        }

        // 2. Fetch Active Merchants
        let merchantsData: any[] = [];
        const { data: merchants, error: mErr } = await supabase
          .from("merchant_signals")
          .select("*")
          .eq("is_active", true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .not("lat", "is", null);

        if (mErr) {
          console.error("RADAR DEBUG: Supabase error fetching merchant_signals:", mErr);
          setFetchError("Gagal memuat data merchant.");
        } else {
          merchantsData = merchants || [];
          console.log("RADAR DEBUG: Fetched merchants count:", merchantsData.length);
        }

        // 3. Fetch Hangout Spots
        const { data: spots, error: sErr } = await supabase
          .from("ngetem_spots")
          .select("*")
          .not("lat", "is", null);

        if (sErr) {
          console.error("RADAR DEBUG: Supabase error fetching ngetem_spots:", sErr);
          setFetchError("Gagal memuat data spot mangkal.");
        } else {
          console.log("RADAR DEBUG: Fetched spots count:", spots?.length || 0);
        }

        // 4. Fetch Admin Manual Signals
        let manualSignals: any[] = [];
        const { data: mSigs, error: manualErr } = await supabase
          .from("admin_manual_signals")
          .select("*")
          .gt("expires_at", new Date().toISOString());
        
        if (manualErr) {
          console.error("RADAR DEBUG: Supabase error fetching admin_manual_signals:", manualErr);
        } else {
          manualSignals = mSigs || [];
          console.log("RADAR DEBUG: Fetched manual signals count:", manualSignals.length);
        }

        const newMarkers: RadarMarker[] = [];

        drivers?.forEach(d => {
          if (d.status === "Offline") return;
          if (currentUserId && d.id === currentUserId) return; // Skip current user so it doesn't overlap with selfIcon
          newMarkers.push({
            id: d.id,
            lat: d.last_lat,
            lng: d.last_lng,
            type: d.status === "Ngetem" ? "driver_ngetem" : "driver_antar",
            label: d.nama || "Driver"
          });
        });

        merchantsData.forEach(m => {
          if (m.lat && m.lng) {
            // --- OPEN/CLOSED FILTER ---
            if (!m.is_open_24h && m.open_time && m.close_time) {
              const nowHHMM = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });
              // Handle overnight: e.g. open 22:00, close 04:00
              const isOvernight = m.open_time > m.close_time;
              const isOpen = isOvernight
                ? (nowHHMM >= m.open_time || nowHHMM < m.close_time)
                : (nowHHMM >= m.open_time && nowHHMM < m.close_time);
              if (!isOpen) return; // Skip closed merchants
            }

            let type: RadarMarker["type"] = "merchant_sepi";
            
            // Calculate live score locally
            let antar_15m = 0;
            let ngetem_15m = 0;
            drivers?.forEach(d => {
              if (!d.last_lat || !d.last_lng) return;
              const dist = getDistance(m.lat, m.lng, d.last_lat, d.last_lng);
              if (dist <= 0.12) {
                if (d.status === "Antar") antar_15m++;
                if (d.status === "Ngetem") ngetem_15m++;
              }
            });

            // Re-calculate basic score
            const isPeak = new Date().getHours() >= 11 && new Date().getHours() <= 13 || new Date().getHours() >= 17 && new Date().getHours() <= 19;
            const score = 
              (antar_15m * 5) + 
              (ngetem_15m * 2) + 
              (m.promo_active ? 15 : 0) + 
              (m.fast_pickup ? 10 : 0) + 
              (isPeak ? 10 : 0) +
              ((m.manual_admin_boost_until && m.manual_admin_boost_until > new Date().toISOString()) ? 20 : 0);

            let statusStr = "Sepi";
            if (score >= 90) { type = "merchant_sangatsibuk"; statusStr = "Sangat Sibuk"; }
            else if (score >= 66) { type = "merchant_ramai"; statusStr = "Ramai"; }
            else if (score >= 41) { type = "merchant_mulaipanas"; statusStr = "Sedang"; }
            else if (score >= 20) { type = "merchant_bergerak"; statusStr = "Normal"; }
            
            const flashTag = m.is_flash_sale ? " ⚡" : "";
            newMarkers.push({
              id: m.id,
              lat: m.lat,
              lng: m.lng,
              type,
              label: m.name + flashTag,
              live_status: statusStr,
              antar_nearby: antar_15m,
              ngetem_nearby: ngetem_15m,
              promo_active: m.promo_active
            });
          }
        });

        spots?.forEach(s => {
          if (s.lat && s.lng) {
            newMarkers.push({
              id: s.id,
              lat: s.lat,
              lng: s.lng,
              type: "spot",
              label: s.name,
              quality: s.quality,
              best_hours: s.best_hours,
              notes: s.notes
            });
          }
        });

        // Add manual signals (can be multiple per coordinate based on count)
        manualSignals.forEach((ms, idx) => {
          if (!ms.lat || !ms.lng) return;
          const total = ms.count || 1;
          for (let i = 0; i < total; i++) {
            // slight random offset if multiple
            const offsetLat = i === 0 ? 0 : (Math.random() - 0.5) * 0.0005;
            const offsetLng = i === 0 ? 0 : (Math.random() - 0.5) * 0.0005;
            newMarkers.push({
              id: `manual_${ms.id}_${i}`,
              lat: ms.lat + offsetLat,
              lng: ms.lng + offsetLng,
              type: ms.type === "driver_ngetem" ? "driver_ngetem" : "spot",
              label: ms.type === "driver_ngetem" ? "Driver (Sistem)" : "Spot (Sistem)"
            });
          }
        });

        const hotspotData = await getHotspots();
        const driverMarkers = newMarkers.filter(m => m.type.startsWith("driver_"));
        setDriverCount(driverMarkers.length);
        setMarkers(newMarkers);
        setHotspots(hotspotData);
        console.log("RADAR DEBUG: Final markers", { 
          total: newMarkers.length,
          drivers: drivers?.length || 0,
          merchants: merchantsData.length,
          spots: spots?.length || 0
        });
      } catch (err) {
        console.error("RADAR DEBUG: Critical Fetch error", err);
        setFetchError("Koneksi gagal atau terjadi kesalahan server.");
      } finally {
        setFetching(false);
      }
  };

  // Idle Tracker
  useEffect(() => {
    if (!latitude || !longitude) return;
    
    if (lastLatRef.current && lastLngRef.current) {
      const dist = getDistance(latitude, longitude, lastLatRef.current, lastLngRef.current);
      if (dist > 0.05) { // 50 meters
        lastMovedRef.current = Date.now();
        setShowMoveSuggest(false);
      }
    } else {
      lastMovedRef.current = Date.now();
    }
    
    lastLatRef.current = latitude;
    lastLngRef.current = longitude;
  }, [latitude, longitude]);

  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (!lastMovedRef.current) return;
      const idleMinutes = (Date.now() - lastMovedRef.current) / 60000;
      if (idleMinutes >= 15 && !showMoveSuggest) {
        setShowMoveSuggest(true);
      }
    }, 60000); // Check every minute
    return () => clearInterval(checkIdle);
  }, [showMoveSuggest]);

  // Adaptive Polling
  useEffect(() => {
    fetchData();
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;
    
    const scheduleNextFetch = () => {
      if (isCancelled) return;
      const interval = document.visibilityState === 'visible' ? 10000 : 30000;
      timeoutId = setTimeout(() => {
        if (!isCancelled) fetchData().finally(scheduleNextFetch);
      }, interval);
    };
    
    scheduleNextFetch();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timeoutId);
        fetchData().finally(scheduleNextFetch);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const bestHotspot = hotspots.length > 0 ? hotspots[0] : null;
  const ZONE_COLOR: Record<string, string> = { PELUANG: "#059669", MENARIK: "#EA580C", RAMAI: "#DC2626", KOMPETISI: "#BE123C", SEPI: "#9CA3AF" };
  const bestColor = bestHotspot ? ZONE_COLOR[bestHotspot.label] || "#6B7280" : "#6B7280";

  return (
    <div className="relative w-full bg-neutral-950" style={{ height: "100dvh" }}>

      {/* MAP — takes full screen */}
      <div className="absolute inset-0">
        <RadarMap latitude={mapLat} longitude={mapLng} markers={markers} hotspots={hotspots} />
      </div>

      {/* TOP LEFT — Zone pill */}
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-3 z-[500] pointer-events-none">
        <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl px-3 py-2 shadow-xl border border-white/10">
          <p className="text-[0.55rem] font-black uppercase tracking-widest text-white/40">Zona</p>
          <p className="text-[0.85rem] font-black text-white leading-none">{areaName || "—"}</p>
        </div>
      </div>

      {/* TOP RIGHT — Driver count + refresh */}
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-3 z-[500]">
        <button
          onClick={fetchData}
          disabled={fetching}
          className="bg-neutral-950/80 backdrop-blur-md rounded-2xl px-3 py-2 shadow-xl border border-white/10 flex flex-col items-center active:scale-95 transition-all"
        >
          <div className="flex items-center gap-1.5">
            {fetching
              ? <svg className="w-3.5 h-3.5 text-white/40 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              : <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            }
            <span className="text-[1rem] font-black text-white">{driverCount}</span>
          </div>
          <span className="text-[0.52rem] font-black uppercase tracking-widest text-white/40">Driver</span>
        </button>
      </div>

      {/* ERROR / IDLE BANNER */}
      {(fetchError || showMoveSuggest) && (
        <div className="absolute top-[calc(max(1rem,env(safe-area-inset-top))+4rem)] left-3 right-3 z-[500] space-y-2">
          {fetchError && (
            <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center gap-2 shadow-xl">
              <span className="text-[0.75rem] font-bold">{fetchError}</span>
            </div>
          )}
          {showMoveSuggest && (
            <div className="bg-indigo-600/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
              <svg className="w-5 h-5 animate-bounce shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <div className="flex-1">
                <p className="text-[0.78rem] font-black">Idle 15 menit — Pindah Spot!</p>
                <p className="text-[0.68rem] text-white/70">Cari zona hijau terdekat di peta.</p>
              </div>
              <button onClick={() => setShowMoveSuggest(false)} className="shrink-0 text-white/50 p-1">✕</button>
            </div>
          )}
        </div>
      )}

      {/* COMPACT LEGEND — floating left */}
      <div className="absolute bottom-[calc(14rem+env(safe-area-inset-bottom))] left-3 z-[500] pointer-events-none">
        <div className="bg-neutral-950/75 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-white/10 space-y-1.5">
          {[
            { color: "#000", border: "border-2 border-white", label: "Kamu" },
            { color: "#4F46E5", label: "Ngetem" },
            { color: "#EC4899", label: "Antar" },
            { color: "#991B1B", label: "Sangat Sibuk" },
            { color: "#EF4444", label: "Ramai" },
            { color: "#F97316", label: "Sedang" },
            { color: "#3B82F6", label: "Normal" },
            { color: "#8B5CF6", label: "Spot" },
          ].map(({ color, border, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${border || ""}`} style={{ backgroundColor: color }} />
              <span className="text-[0.62rem] font-bold text-white/80 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM PANEL — best zone + navigation */}
      <div className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-[500]">
        <div className="bg-neutral-950/85 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[0.55rem] font-black uppercase tracking-widest text-white/40">Zona Terbaik Sekarang</p>
              <p className="text-[1.05rem] font-black text-white leading-tight">{bestHotspot?.name || "Memindai..."}</p>
              {bestHotspot && (
                <p className="text-[0.7rem] font-bold mt-0.5" style={{ color: bestColor }}>
                  {bestHotspot.label} · {bestHotspot.merchant_count} resto · {bestHotspot.ngetem_drivers} ngetem
                </p>
              )}
            </div>
            {bestHotspot && (
              <span className="text-[0.65rem] font-black uppercase px-3 py-1.5 rounded-xl" style={{ backgroundColor: bestColor + "33", color: bestColor }}>
                {bestHotspot.label}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {bestHotspot && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${bestHotspot.lat},${bestHotspot.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white text-neutral-900 text-[0.8rem] font-black py-2.5 rounded-2xl text-center active:scale-95 transition-all"
              >
                Navigasi
              </a>
            )}
            <button
              onClick={fetchData}
              disabled={fetching}
              className="flex-1 bg-white/15 text-white text-[0.8rem] font-black py-2.5 rounded-2xl text-center active:scale-95 transition-all border border-white/10"
            >
              {fetching ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <DriverBottomNav />
    </div>
  );
}

export default function RadarPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] w-full bg-[#f0f0f0] flex items-center justify-center">Loading Radar...</div>}>
      <RadarContent />
    </Suspense>
  );
}
