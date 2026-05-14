"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLocation } from "@/hooks/useLocation";
import { getRecommendationV2, getZoneStats, type RecommendationResult, type ZoneStatsResult } from "@/app/actions/recommendation";
import { getActiveMerchants, type MerchantSignal } from "@/app/admin/actions/signals";
import { getHotspots, type HotspotZone } from "@/app/actions/hotspot";
import { DriverStatusSelector } from "./DriverStatusSelector";
import { NgetemTimer } from "./NgetemTimer";
import { useLanguage } from "@/context/LanguageContext";

const MERCHANT_CACHE_KEY = "ztips_merchants_cache";
const MERCHANT_CACHE_TTL = 30 * 60 * 1000;

function loadCachedMerchants(): MerchantSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MERCHANT_CACHE_KEY);
    if (!raw) return [];
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > MERCHANT_CACHE_TTL) return [];
    return data;
  } catch { return []; }
}

function saveMerchantsCache(data: MerchantSignal[]) {
  try {
    localStorage.setItem(MERCHANT_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function getActionColors(action: string, color: string) {
  if (action === "MOVE") return { bg: "bg-red-600", text: "text-white", border: "border-red-500", pill: "bg-red-700", accent: "#DC2626" };
  if (action === "OFFLINE") return { bg: "bg-neutral-700", text: "text-white", border: "border-neutral-600", pill: "bg-neutral-800", accent: "#374151" };
  if (action === "BUSY") return { bg: "bg-amber-500", text: "text-white", border: "border-amber-400", pill: "bg-amber-600", accent: "#D97706" };
  // STAY — use soft blue
  return { bg: "bg-[#2d5af1]", text: "text-white", border: "border-blue-400/30", pill: "bg-black/20", accent: "#2d5af1" };
}

// Keep cache state outside component to survive remounts
let globalLastAnalysisTs = 0;
let globalLastArea: string | null = null;
let globalLastStatus = "";
let globalRecommendation: RecommendationResult | null = null;
let globalZoneStats: ZoneStatsResult | null = null;
let globalTopZones: HotspotZone[] | null = null;
let globalNearestHotspot: (HotspotZone & { dist: number }) | null = null;

export function LiveDashboard() {
  const { lang, t } = useLanguage();
  const { status, areaName, loading, error, timestamp, refreshLocation, latitude, longitude } = useLocation();
  const [time, setTime] = useState(new Date());
  const [ngetemStartTime, setNgetemStartTime] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult>(globalRecommendation || {
    action: "STAY" as const,
    title: "Standby",
    reason: "Memuat data...",
    color: "#2563EB"
  });
  const [merchants, setMerchants] = useState<MerchantSignal[]>([]);
  const [nearestHotspot, setNearestHotspot] = useState<(HotspotZone & { dist: number }) | null>(globalNearestHotspot);
  const [topZones, setTopZones] = useState<HotspotZone[]>(globalTopZones || []);
  const [zoneStats, setZoneStats] = useState<ZoneStatsResult>(globalZoneStats || {
    orderan: "Data Minim",
    pesaing: "Longgar" as any,
    driverCount: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Load merchant cache on mount
  useEffect(() => {
    const cached = loadCachedMerchants();
    if (cached.length > 0) setMerchants(cached);
  }, []);

  useEffect(() => {
    if (status === "Ngetem") {
      if (!ngetemStartTime) setNgetemStartTime(Date.now());
    } else {
      setNgetemStartTime(null);
    }
  }, [status]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const areaChanged = globalLastArea !== areaName;
    const statusChanged = globalLastStatus !== status;
    const stale = now - globalLastAnalysisTs > 5 * 60 * 1000;
    
    if (!force && !areaChanged && !statusChanged && !stale) return;
    
    globalLastArea = areaName;
    globalLastStatus = status;
    globalLastAnalysisTs = now;

    setIsRefreshing(true);
    try {
      const idleMinutes = status === "Ngetem" && ngetemStartTime ? Math.floor((now - ngetemStartTime) / 60000) : 0;
      const [merchantsResult, statsResult, hotspotResult] = await Promise.all([
        getActiveMerchants(areaName),
        getZoneStats(areaName, latitude, longitude),
        getHotspots()
      ]);

      const recResult = await getRecommendationV2(
        areaName, status, idleMinutes,
        statsResult.driverCount, merchantsResult.length,
        lang, hotspotResult
      );

      const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      const finalMerchants = merchantsResult.filter(m => {
        if (!latitude || !longitude) return true;
        if (m.lat == null || m.lng == null) return true;
        return getDist(latitude, longitude, m.lat, m.lng) <= 5;
      }).sort((a, b) => (b.live_score || 0) - (a.live_score || 0));

      setMerchants(finalMerchants);
      saveMerchantsCache(finalMerchants);

      setZoneStats(statsResult);
      setRecommendation(recResult);
      setTopZones(hotspotResult.slice(0, 3));

      globalRecommendation = recResult;
      globalZoneStats = statsResult;
      globalTopZones = hotspotResult.slice(0, 3);

      if (hotspotResult.length > 0 && latitude && longitude) {
        let closest = hotspotResult[0], minDist = getDist(latitude, longitude, closest.lat, closest.lng);
        for (let i = 1; i < hotspotResult.length; i++) {
          const d = getDist(latitude, longitude, hotspotResult[i].lat, hotspotResult[i].lng);
          if (d < minDist) { minDist = d; closest = hotspotResult[i]; }
        }
        setNearestHotspot({ ...closest, dist: minDist });
        globalNearestHotspot = { ...closest, dist: minDist };
      }
    } catch (e) {
      console.error("Dashboard fetch failed", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [areaName, status, lang, latitude, longitude, ngetemStartTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Real-time merchant listener
  useEffect(() => {
    const supabase = (require("@/lib/supabase/client")).createClient();
    const channel = supabase.channel("merchant-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "merchant_signals" }, async () => {
        const merchantsResult = await getActiveMerchants(areaName);
        setMerchants(merchantsResult);
        saveMerchantsCache(merchantsResult);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [areaName]);

  const formattedTime = time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  const idleMinutes = ngetemStartTime ? Math.floor((Date.now() - ngetemStartTime) / 60000) : 0;
  const actionColors = getActionColors(recommendation.action, recommendation.color);
  const isIdle = idleMinutes >= 15 && status === "Ngetem";

  const zoneLabel: Record<string, { label: string; color: string; bg: string }> = {
    "PELUANG EMAS":    { label: "Peluang Emas", color: "text-emerald-700", bg: "bg-emerald-100" },
    "BAGUS SEKARANG":  { label: "Bagus",         color: "text-emerald-600", bg: "bg-emerald-50"  },
    "NORMAL":          { label: "Normal",        color: "text-blue-600",    bg: "bg-blue-50"     },
    "KOMPETITIF":      { label: "Kompetitif",    color: "text-orange-700",  bg: "bg-orange-100"  },
    "HINDARI SEMENTARA": { label: "Hindari",       color: "text-neutral-500", bg: "bg-neutral-100" },
    "JEBAKAN KERUMUNAN": { label: "Jebakan",       color: "text-red-700",     bg: "bg-red-100"     },
  };

  return (
    <div className="flex flex-col gap-4">

      {/* TOP BAR: LOCATION & TIME */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Lokasi Driver</p>
          <div className="flex items-start gap-2">
            <span className="inline-block w-2 h-2 bg-[#2d5af1] rounded-full animate-pulse mt-1.5 shrink-0" />
            <p className="text-[1.15rem] font-black text-neutral-900 dark:text-white leading-tight">
              {areaName || (loading ? "Mencari lokasi..." : "—")}
            </p>
          </div>
        </div>
        <div className="pl-4 text-right shrink-0">
          <p className="text-[0.6rem] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Pukul</p>
          <p className="text-[1rem] font-black text-neutral-700 dark:text-neutral-300">{formattedTime}</p>
        </div>
      </div>

      {/* STATUS SELECTOR: OWN ROW */}
      <div className="-mt-1">
        <DriverStatusSelector />
      </div>

      {/* IDLE ALERT */}
      {isIdle && (
        <div className="bg-red-600 rounded-2xl px-4 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div>
            <p className="text-[0.7rem] font-black text-red-200 uppercase tracking-widest">⏱ IDLE {idleMinutes} MENIT</p>
            <p className="text-[1rem] font-black text-white">Pindah Spot Sekarang!</p>
          </div>
          <Link href="/radar" className="bg-white text-red-600 text-[0.75rem] font-black px-3 py-2 rounded-xl active:scale-95 transition-all shrink-0">
            Buka Radar
          </Link>
        </div>
      )}

      {/* HERO ACTION CARD */}
      <div className={`${actionColors.bg} rounded-3xl p-5 shadow-lg`}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/60">
            {recommendation.action === "MOVE" ? "⚡ GERAK SEKARANG" : recommendation.action === "OFFLINE" ? "😴 OFFLINE" : recommendation.action === "BUSY" ? "🚀 SEDANG ANTAR" : "✅ REKOMENDASI"}
          </p>
          <div className="flex items-center gap-1.5">
            {recommendation.badge && (
              <span className={`text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-lg ${recommendation.badge === "High" ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
                {recommendation.badge}
              </span>
            )}
            <button 
              onClick={() => fetchData(true)} 
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all ${isRefreshing ? "animate-spin opacity-50" : "active:scale-90"}`}
              aria-label="Refresh Data"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>
        <p className="text-[1.6rem] font-black text-white leading-tight tracking-tight">{recommendation.title}</p>
        {nearestHotspot && recommendation.action !== "OFFLINE" && (
          <p className="text-[0.9rem] font-bold text-white/80 mt-1">{nearestHotspot.name} • {nearestHotspot.dist.toFixed(1)} km</p>
        )}
        <p className="text-[0.82rem] font-medium text-white/70 mt-2 leading-snug">{recommendation.reason}</p>

        {recommendation.action !== "OFFLINE" && (
          <div className="flex gap-2 mt-4">
            {nearestHotspot && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${nearestHotspot.lat},${nearestHotspot.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white text-neutral-900 text-[0.8rem] font-black py-3 rounded-2xl text-center active:scale-95 transition-all shadow"
              >
                Mulai Navigasi
              </a>
            )}
            <Link href="/radar" className="flex-1 bg-white/20 text-white text-[0.8rem] font-black py-3 rounded-2xl text-center active:scale-95 transition-all">
              Buka Radar
            </Link>
          </div>
        )}
      </div>

      {/* STATS PILLS */}
      <div className="flex gap-2 pb-1">
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 shadow-sm border border-neutral-100 dark:border-white/10 flex flex-col items-center min-w-[80px]">
          <p className="text-[0.6rem] font-bold uppercase text-neutral-400 tracking-wide">Order</p>
          <p className={`text-[0.85rem] font-black leading-tight ${zoneStats.orderan.includes("Tinggi") ? "text-blue-600 dark:text-blue-400" : "text-neutral-700 dark:text-neutral-300"}`}>{zoneStats.orderan.replace("Potensi ", "")}</p>
        </div>
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 shadow-sm border border-neutral-100 dark:border-white/10 flex flex-col items-center min-w-[80px]">
          <p className="text-[0.6rem] font-bold uppercase text-neutral-400 tracking-wide">Saingan</p>
          <p className={`text-[0.85rem] font-black leading-tight ${zoneStats.pesaing === "Padat" ? "text-red-600 dark:text-red-400" : "text-neutral-700 dark:text-neutral-300"}`}>{zoneStats.pesaing}</p>
        </div>
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 shadow-sm border border-neutral-100 dark:border-white/10 flex flex-col items-center min-w-[80px]">
          <p className="text-[0.6rem] font-bold uppercase text-neutral-400 tracking-wide">Driver</p>
          <p className="text-[0.85rem] font-black leading-tight text-neutral-700 dark:text-neutral-300">{zoneStats.driverCount}</p>
        </div>
      </div>

      {/* NGETEM TIMER COMPONENT */}
      <NgetemTimer />

      {/* TOP ZONES */}
      {topZones.length > 0 && (
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Zona Efisien Sekarang</p>
          <div className="flex flex-col gap-1.5">
            {topZones.map((z, i) => {
              const zl = zoneLabel[z.label] || { label: z.label, color: "text-neutral-600", bg: "bg-neutral-100" };
              return (
                <div key={z.id} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3 border border-neutral-100 dark:border-white/10 shadow-sm flex items-center justify-between active:scale-[0.99] transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[0.7rem] font-black flex items-center justify-center shrink-0">{i+1}</span>
                    <div>
                      <p className="text-[0.9rem] font-black text-neutral-900 dark:text-neutral-100 leading-none">{z.name}</p>
                      <p className="text-[0.68rem] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">{z.antar_drivers} antar · {z.ngetem_drivers} ngetem · {z.merchant_count} resto</p>
                    </div>
                  </div>
                  <span className={`text-[0.62rem] font-black uppercase px-2 py-1 rounded-lg ${zl.bg} ${zl.color}`}>{zl.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE MERCHANTS */}
      {merchants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-neutral-400">Resto Aktif</p>
            <Link href="/radar" className="text-[0.7rem] font-bold text-blue-600">Lihat Peta →</Link>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
            {merchants.slice(0, 8).map(m => (
              <Link href={`/radar?lat=${m.lat}&lng=${m.lng}`} key={m.id} className="shrink-0 w-[140px] bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 rounded-[1.2rem] p-3.5 border border-neutral-200/60 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] relative overflow-hidden active:scale-95 transition-transform cursor-pointer">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                <div>
                  <p className="text-[0.85rem] font-black text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug tracking-tight relative z-10">{m.name}</p>
                  <p className="text-[0.65rem] font-bold text-neutral-500 mt-1 line-clamp-1">{m.area}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 relative z-10">
                  {m.is_flash_sale && <span className="text-[0.6rem] font-black bg-rose-500 text-white px-2 py-0.5 rounded-md shadow-sm">⚡ FLASH</span>}
                  {m.promo_active && <span className="text-[0.6rem] font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md">PROMO</span>}
                  <span className={`text-[0.6rem] font-black px-2 py-0.5 rounded-md ${m.live_score && m.live_score >= 66 ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : m.live_score && m.live_score >= 41 ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                    {m.live_score && m.live_score >= 90 ? "Sangat Sibuk" : m.live_score && m.live_score >= 66 ? "Ramai" : m.live_score && m.live_score >= 41 ? "Sedang" : "Normal"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
