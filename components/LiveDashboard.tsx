"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocation } from "@/hooks/useLocation";
import { getRecommendationV2, getZoneStats, type RecommendationResult, type ZoneStatsResult } from "@/app/actions/recommendation";
import { getActiveMerchants, type MerchantSignal } from "@/app/admin/actions/signals";
import { getHotspots, type HotspotZone } from "@/app/actions/hotspot";
import { DriverStatusSelector } from "./DriverStatusSelector";
import { NgetemTimer } from "./NgetemTimer";
import { useLanguage } from "@/context/LanguageContext";

export function LiveDashboard() {
  const { lang, t } = useLanguage();
  const { status, areaName, loading, error, timestamp, refreshLocation, latitude, longitude } = useLocation();
  const [time, setTime] = useState(new Date());
  const [ngetemStartTime, setNgetemStartTime] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult>({
    action: "STAY",
    title: t("loading"),
    reason: lang === "ID" ? "Menunggu sensor AI Pilot..." : "Waiting for AI Pilot sensor...",
    color: "#9CA3AF"
  });
  const [merchants, setMerchants] = useState<MerchantSignal[]>([]);
  const [nearestHotspot, setNearestHotspot] = useState<(HotspotZone & { dist: number }) | null>(null);
  const [zoneStats, setZoneStats] = useState<ZoneStatsResult>({
    orderan: "Data Minim",
    pesaing: "Longgar" as any,
    driverCount: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "Ngetem") {
      if (!ngetemStartTime) setNgetemStartTime(Date.now());
    } else {
      setNgetemStartTime(null);
    }
  }, [status, ngetemStartTime]);

  useEffect(() => {
    async function fetchData() {
      try {
        const idleMinutes = status === "Ngetem" && ngetemStartTime ? Math.floor((Date.now() - ngetemStartTime) / 60000) : 0;
        
        const merchantsResult = await getActiveMerchants(areaName);
        const statsResult = await getZoneStats(areaName);
        const recResult = await getRecommendationV2(areaName, status, idleMinutes, statsResult.driverCount, merchantsResult.length, lang);
        
        setMerchants(merchantsResult);
        setZoneStats(statsResult);
        setRecommendation(recResult);

        // Fetch hotspots
        const hotspotResult = await getHotspots();
        if (hotspotResult.length > 0 && latitude && longitude) {
          // Haversine
          const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; 
            const dLat = (lat2 - lat1) * Math.PI / 180;  
            const dLon = (lon2 - lon1) * Math.PI / 180; 
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          };
          
          let closest = hotspotResult[0];
          let minDist = getDist(latitude, longitude, closest.lat, closest.lng);
          
          for(let i=1; i<hotspotResult.length; i++) {
            const d = getDist(latitude, longitude, hotspotResult[i].lat, hotspotResult[i].lng);
            if (d < minDist) {
              minDist = d;
              closest = hotspotResult[i];
            }
          }
          setNearestHotspot({ ...closest, dist: minDist });
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
    }
    fetchData();
  }, [areaName, time.getHours(), status, ngetemStartTime, latitude, longitude]);

  const formattedTime = time.toLocaleTimeString(lang === "ID" ? "id-ID" : "en-US", { hour: '2-digit', minute: '2-digit' });
  const minutesAgo = timestamp ? Math.floor((time.getTime() - timestamp) / 60000) : null;

  return (
    <>
      <header className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.95rem] font-bold text-neutral-400 uppercase tracking-widest">
            {formattedTime}
          </p>
          <button 
            onClick={() => refreshLocation()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.75rem] font-bold text-[#00A651] shadow-sm border border-neutral-100 transition-all active:scale-90 disabled:opacity-50 hover:shadow-md"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg> 
            {t("refresh")}
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-100 rounded-full blur-2xl opacity-60"></div>
          
          <p className="text-[0.75rem] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            {t("current_loc")}
          </p>
          <div className="mt-1 text-[1.25rem] font-bold text-neutral-800 flex items-center gap-2">
            {loading && !areaName ? (
              <span className="animate-pulse">{t("searching_loc")}</span>
            ) : error ? (
              <span className="text-red-500 text-sm">{error}</span>
            ) : (
              <>
                <svg className="w-5 h-5 text-[#00A651] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{areaName}</span>
              </>
            )}
          </div>
          <p className="text-[0.75rem] font-medium text-neutral-400 mt-3 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {minutesAgo !== null ? (lang === "ID" ? `Akurat (${minutesAgo} menit lalu)` : `Accurate (${minutesAgo}m ago)`) : "..."}
          </p>
        </div>
      </header>

      <DriverStatusSelector />

      <section className="mt-2 mb-8">
        <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3 ml-2">
          {t("zone_status")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95">
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">{t("order_potential")}</span>
            <span className={`text-[0.95rem] font-extrabold leading-tight ${zoneStats.orderan.includes("Tinggi") ? "text-green-600" : "text-neutral-500"}`}>
              {zoneStats.orderan}
            </span>
          </div>
          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95 relative overflow-hidden">
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 relative z-10">{t("rivals")}</span>
            <span className={`text-[1.1rem] font-extrabold relative z-10 ${zoneStats.pesaing === "Padat" ? "text-red-600" : "text-green-600"}`}>
              {zoneStats.pesaing}
            </span>
          </div>
          <NgetemTimer />
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 ml-2 mr-1">
          <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-400">
            {t("active_merchants")}
          </h2>
          <Link href="/radar" className="text-[0.7rem] font-bold text-blue-600">{lang === "ID" ? "Lihat Peta" : "Open Map"}</Link>
        </div>
        
        <div className="flex overflow-x-auto pb-4 -mx-5 px-5 gap-3 no-scrollbar">
          {merchants.length === 0 ? (
            <div className="w-full text-center py-6 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              <p className="text-[0.85rem] text-neutral-400 font-medium">{lang === "ID" ? "Belum ada sinyal resto." : "No merchant signals yet."}</p>
            </div>
          ) : (
            merchants.map((resto) => (
              <div key={resto.id} className="shrink-0 w-[140px] bg-white rounded-3xl p-3 shadow-[0_8px_24px_rgb(0,0,0,0.04)] border border-neutral-100 active:scale-95 transition-all">
                <div className="h-[4.5rem] rounded-[1.1rem] mb-3 flex items-center justify-center relative overflow-hidden bg-orange-50">
                  <span className="text-[1.5rem] font-extrabold text-orange-500">{resto.name.charAt(0)}</span>
                </div>
                <h3 className="text-[0.85rem] font-bold text-neutral-800 line-clamp-1 mb-1.5">{resto.name}</h3>
                <div className="flex flex-col gap-1">
                  {resto.promo_active && <span className="text-[0.6rem] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-max">PROMO</span>}
                  <span className="text-[0.6rem] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md w-max uppercase">{resto.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="pb-8">
        <div className="rounded-[2rem] px-6 py-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-neutral-100 bg-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full" style={{ backgroundColor: recommendation.color }}></span>
                <p className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-500">{t("ai_pilot_suggest")}</p>
              </div>
              {recommendation.badge && (
                <span className={`text-[0.6rem] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${recommendation.badge === 'High' ? 'bg-red-50 text-red-600' : recommendation.badge === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {recommendation.badge} CONFIDENCE
                </span>
              )}
            </div>
            <p className="text-[1.4rem] font-extrabold leading-tight text-neutral-900">{recommendation.title}</p>
            <p className="mt-2 text-[1.05rem] text-neutral-600 font-medium">{recommendation.reason}</p>
            
            {nearestHotspot && recommendation.action !== "OFFLINE" && (
              <div className="mt-5 bg-neutral-50 rounded-[1.25rem] p-4 border border-neutral-100 flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">{lang === "ID" ? "Hotspot Terdekat" : "Nearest Hotspot"}</p>
                  <p className="text-[1rem] font-black text-neutral-800">{nearestHotspot.name} <span className="text-neutral-500 font-bold text-[0.85rem]">({nearestHotspot.dist.toFixed(1)} km)</span></p>
                </div>
                <span className={`text-[0.7rem] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${nearestHotspot.label === 'RAMAI' ? 'bg-red-100 text-red-600' : nearestHotspot.label === 'MENARIK' ? 'bg-orange-100 text-orange-600' : 'bg-neutral-200 text-neutral-600'}`}>
                  {nearestHotspot.label}
                </span>
              </div>
            )}

            {recommendation.action !== "OFFLINE" && recommendation.action !== "BUSY" && (
              <Link href="/radar" className="mt-6 flex w-full items-center justify-center rounded-[1.25rem] py-4 text-[1.05rem] font-bold text-white shadow-lg active:scale-95 transition-all" style={{ backgroundColor: recommendation.color }}>
                {t("open_radar")}
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
