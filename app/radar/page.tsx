"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
  type: "driver_ngetem" | "driver_antar" | "merchant_high" | "merchant_med" | "merchant_low" | "spot";
  label: string;
};

export default function RadarPage() {
  const { lang, t } = useLanguage();
  const { latitude, longitude, areaName, loading, error } = useLocation();
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
              const nowHHMM = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
              // Handle overnight: e.g. open 22:00, close 04:00
              const isOvernight = m.open_time > m.close_time;
              const isOpen = isOvernight
                ? (nowHHMM >= m.open_time || nowHHMM < m.close_time)
                : (nowHHMM >= m.open_time && nowHHMM < m.close_time);
              if (!isOpen) return; // Skip closed merchants
            }

            let type: RadarMarker["type"] = "merchant_low";
            if (m.busy_score >= 5) type = "merchant_high";
            else if (m.busy_score >= 3) type = "merchant_med";
            
            const flashTag = m.is_flash_sale ? " ⚡" : "";
            newMarkers.push({
              id: m.id,
              lat: m.lat,
              lng: m.lng,
              type,
              label: m.name + flashTag
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
              label: s.name
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

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] text-neutral-900 antialiased">
      <div className="relative z-10 p-5 h-full flex flex-col pointer-events-none">
          {/* HEADER */}
          <div className="flex justify-between items-start pointer-events-auto">
            <div className="bg-[#f7f7f8]/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-sm border border-neutral-200">
              <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                Radar Intel
              </h1>
              <p className="text-[0.7rem] font-bold text-neutral-500 uppercase tracking-wider">{areaName || "Area Tidak Diketahui"}</p>
            </div>
            
            <button 
              onClick={fetchData}
              disabled={fetching}
              className="bg-[#f7f7f8]/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-sm border border-neutral-200 flex flex-col items-end active:scale-95 transition-all disabled:opacity-80"
            >
              <div className="flex items-center gap-1.5">
                {fetching && <svg className="w-3.5 h-3.5 text-neutral-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                <span className="text-[1.1rem] font-black">{driverCount}</span>
              </div>
              <span className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-widest">Driver</span>
            </button>
          </div>

          {/* ERROR BANNER */}
          {fetchError && (
            <div className="mt-4 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-lg border border-red-400 pointer-events-auto animate-in fade-in slide-in-from-top-2">
              <p className="text-[0.8rem] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Radar data failed to load
              </p>
              <p className="text-[0.85rem] font-medium leading-tight">{fetchError}</p>
            </div>
          )}

          {/* MOVE SUGGESTION BANNER (AI DECISION) */}
          {showMoveSuggest && (
            <div className="mt-4 bg-[#4F46E5]/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-lg border border-indigo-400 pointer-events-auto animate-in fade-in slide-in-from-top-2 flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-xl shrink-0">
                <svg className="w-5 h-5 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-[0.8rem] font-black uppercase tracking-wider mb-0.5">Saran Pindah Lokasi</p>
                <p className="text-[0.8rem] font-medium leading-snug opacity-90">Kamu sudah diam lebih dari 15 menit. Coba cari Zona Peluang hijau terdekat.</p>
              </div>
              <button onClick={() => setShowMoveSuggest(false)} className="shrink-0 text-white/50 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
      </div>

      <div className="relative flex-[2] mx-4 mb-2 overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white min-h-[60vh]">
        <RadarMap latitude={latitude} longitude={longitude} markers={markers} hotspots={hotspots} />
      </div>

      {/* Legend — below map, horizontal scroll */}
      <div className="mx-4 mb-6 bg-white rounded-2xl border border-neutral-100 shadow-sm px-4 py-3">
        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-neutral-400 mb-2">{t("legend")}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2 pb-2 border-b border-neutral-100">
          <LegendItem color="bg-black" label={lang === "ID" ? "Kamu" : "You"} />
          <LegendItem color="bg-indigo-600" label={lang === "ID" ? "Driver Ngetem" : "Driver Ngetem"} />
          <LegendItem color="bg-pink-500" label={lang === "ID" ? "Driver Antar" : "Driver Antar"} />
          <LegendItem color="bg-purple-500" label={lang === "ID" ? "Spot Mangkal" : "Spot"} />
          <LegendItem color="bg-red-500" label={lang === "ID" ? "Resto Ramai" : "Busy"} />
          <LegendItem color="bg-orange-400" label={lang === "ID" ? "Resto Sedang" : "Med"} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <LegendItem color="bg-red-500/30 border border-red-400" label="Hotspot Ramai" />
          <LegendItem color="bg-orange-500/30 border border-orange-400" label="Hotspot Menarik" />
          <LegendItem color="bg-neutral-500/20 border border-neutral-300" label="Hotspot Sepi" />
        </div>
      </div>

      <div className="pb-[calc(5rem+env(safe-area-inset-bottom))]" />
      <DriverBottomNav />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[0.72rem] font-semibold text-neutral-700 whitespace-nowrap">{label}</span>
    </div>
  );
}
