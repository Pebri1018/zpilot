"use client";

import { useState, useEffect, useRef } from "react";
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
  // STAY — use green
  return { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-500", pill: "bg-emerald-700", accent: "#059669" };
}

export function LiveDashboard() {
  const { lang, t } = useLanguage();
  const { status, areaName, loading, error, timestamp, refreshLocation, latitude, longitude } = useLocation();
  const [time, setTime] = useState(new Date());
  const [ngetemStartTime, setNgetemStartTime] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult>({
    action: "STAY" as const,
    title: "Standby",
    reason: "Memuat data...",
    color: "#10B981"
  });
  const [merchants, setMerchants] = useState<MerchantSignal[]>([]);
  const [nearestHotspot, setNearestHotspot] = useState<(HotspotZone & { dist: number }) | null>(null);
  const [topZones, setTopZones] = useState<HotspotZone[]>([]);
  const [zoneStats, setZoneStats] = useState<ZoneStatsResult>({
    orderan: "Data Minim",
    pesaing: "Longgar" as any,
    driverCount: 0
  });

  const lastAnalysisRef = useRef<{ area: string|null; status: string; ts: number }>({ area: null, status: "", ts: 0 });

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

  useEffect(() => {
    async function fetchData() {
      const now = Date.now();
      const last = lastAnalysisRef.current;
      const areaChanged = last.area !== areaName;
      const statusChanged = last.status !== status;
      const stale = now - last.ts > 5 * 60 * 1000;
      if (!areaChanged && !statusChanged && !stale) return;
      lastAnalysisRef.current = { area: areaName, status, ts: now };

      try {
        const idleMinutes = status === "Ngetem" && ngetemStartTime ? Math.floor((now - ngetemStartTime) / 60000) : 0;
        const [merchantsResult, statsResult, hotspotResult] = await Promise.all([
          getActiveMerchants(areaName),
          getZoneStats(areaName),
          getHotspots()
        ]);

        const recResult = await getRecommendationV2(
          areaName, status, idleMinutes,
          statsResult.driverCount, merchantsResult.length,
          lang, hotspotResult
        );

        setMerchants(prev => {
          const prevIds = new Set(prev.map((m: MerchantSignal) => m.id));
          const freshOnly = merchantsResult.filter((m: MerchantSignal) => !prevIds.has(m.id));
          const merged = [...freshOnly, ...merchantsResult.filter((m: MerchantSignal) => prevIds.has(m.id))];
          saveMerchantsCache(merged);
          return merged;
        });
        setZoneStats(statsResult);
        setRecommendation(recResult);
        setTopZones(hotspotResult.slice(0, 3));

        if (hotspotResult.length > 0 && latitude && longitude) {
          const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          };
          let closest = hotspotResult[0], minDist = getDist(latitude, longitude, closest.lat, closest.lng);
          for (let i = 1; i < hotspotResult.length; i++) {
            const d = getDist(latitude, longitude, hotspotResult[i].lat, hotspotResult[i].lng);
            if (d < minDist) { minDist = d; closest = hotspotResult[i]; }
          }
          setNearestHotspot({ ...closest, dist: minDist });
        }
      } catch (e) {
        console.error("Dashboard fetch failed", e);
      }
    }
    fetchData();
  }, [areaName, status, lang]);

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
    "PELUANG":    { label: "Peluang", color: "text-emerald-700", bg: "bg-emerald-100" },
    "MENARIK":    { label: "Menarik", color: "text-orange-700",  bg: "bg-orange-100"  },
    "RAMAI":      { label: "Padat",   color: "text-red-700",     bg: "bg-red-100"     },
    "KOMPETISI":  { label: "Hindari", color: "text-rose-800",    bg: "bg-rose-100"    },
    "SEPI":       { label: "Sepi",    color: "text-neutral-500", bg: "bg-neutral-100" },
  };

  return (
    <div className="flex flex-col gap-4">

      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.72rem] font-black text-neutral-400 uppercase tracking-widest">{formattedTime}</p>
          <p className="text-[1rem] font-black text-neutral-900 dark:text-neutral-100 leading-tight mt-0.5 line-clamp-1 max-w-[200px]">
            {areaName || (loading ? "Mencari lokasi..." : "—")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DriverStatusSelector />
        </div>
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
          {recommendation.badge && (
            <span className={`text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-lg ${recommendation.badge === "High" ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
              {recommendation.badge}
            </span>
          )}
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
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="shrink-0 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 shadow-sm border border-neutral-100 dark:border-white/10 flex flex-col items-center min-w-[80px]">
          <p className="text-[0.6rem] font-bold uppercase text-neutral-400 tracking-wide">Order</p>
          <p className={`text-[0.85rem] font-black leading-tight ${zoneStats.orderan.includes("Tinggi") ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-700 dark:text-neutral-300"}`}>{zoneStats.orderan.replace("Potensi ", "")}</p>
        </div>
        <div className="shrink-0 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 shadow-sm border border-neutral-100 dark:border-white/10 flex flex-col items-center min-w-[80px]">
          <p className="text-[0.6rem] font-bold uppercase text-neutral-400 tracking-wide">Saingan</p>
          <p className={`text-[0.85rem] font-black leading-tight ${zoneStats.pesaing === "Padat" ? "text-red-600 dark:text-red-400" : "text-neutral-700 dark:text-neutral-300"}`}>{zoneStats.pesaing}</p>
        </div>
        <div className="shrink-0 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 shadow-sm border border-neutral-100 dark:border-white/10 flex flex-col items-center min-w-[80px]">
          <p className="text-[0.6rem] font-bold uppercase text-neutral-400 tracking-wide">Driver</p>
          <p className="text-[0.85rem] font-black leading-tight text-neutral-700 dark:text-neutral-300">{zoneStats.driverCount}</p>
        </div>
      </div>

      {/* NGETEM TIMER COMPONENT */}
      <NgetemTimer />

      {/* TOP ZONES */}
      {topZones.length > 0 && (
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Top Zona Sekarang</p>
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
              <div key={m.id} className="shrink-0 w-[140px] bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 rounded-[1.2rem] p-3.5 border border-neutral-200/60 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                <div>
                  <p className="text-[0.85rem] font-black text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug tracking-tight relative z-10">{m.name}</p>
                  <p className="text-[0.65rem] font-bold text-neutral-500 mt-1 line-clamp-1">{m.area}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 relative z-10">
                  {m.is_flash_sale && <span className="text-[0.6rem] font-black bg-rose-500 text-white px-2 py-0.5 rounded-md shadow-sm">⚡ FLASH</span>}
                  {m.promo_active && <span className="text-[0.6rem] font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md">PROMO</span>}
                  <span className={`text-[0.6rem] font-black px-2 py-0.5 rounded-md ${m.live_score && m.live_score >= 66 ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : m.live_score && m.live_score >= 41 ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                    {m.live_score && m.live_score >= 66 ? "Ramai" : m.live_score && m.live_score >= 41 ? "Panas" : "Standby"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
