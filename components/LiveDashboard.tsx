"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocation } from "@/hooks/useLocation";
import { getRecommendationV2, getZoneStats, type RecommendationResult, type ZoneStatsResult } from "@/app/actions/recommendation";

import { getActiveMerchants, type MerchantSignal } from "@/app/admin/actions/signals";
import { DriverStatusSelector } from "./DriverStatusSelector";
import { NgetemTimer } from "./NgetemTimer";

export function LiveDashboard() {
  const { areaName, loading, error, timestamp, refreshLocation } = useLocation();
  const [time, setTime] = useState(new Date());
  const [recommendation, setRecommendation] = useState<RecommendationResult>({
    action: "STAY",
    title: "Menganalisis Data...",
    reason: "Menunggu sensor AI Pilot...",
    color: "#9CA3AF"
  });
  const [merchants, setMerchants] = useState<MerchantSignal[]>([]);
  const [zoneStats, setZoneStats] = useState<ZoneStatsResult>({
    orderan: "Data Minim",
    pesaing: "Data Minim" as any,
    driverCount: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [recResult, merchantsResult, statsResult] = await Promise.all([
          getRecommendationV2(areaName),
          getActiveMerchants(areaName),
          getZoneStats(areaName)
        ]);
        setRecommendation(recResult);
        setMerchants(merchantsResult);
        setZoneStats(statsResult);
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
    }
    fetchData();
  }, [areaName, time.getHours()]); // re-fetch when area changes or hour changes

  const formattedTime = time.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
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
          <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg> Perbarui
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 relative overflow-hidden">
          {/* Decorative blur */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-100 rounded-full blur-2xl opacity-60"></div>
          
          <p className="text-[0.75rem] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Lokasi Saat Ini
          </p>
          <div className="mt-1 text-[1.25rem] font-bold text-neutral-800 flex items-center gap-2">
            {loading && !areaName ? (
              <span className="animate-pulse">Mencari lokasi...</span>
            ) : error ? (
              <span className="text-red-500 text-sm">{error}</span>
            ) : (
              <>
                <svg className="w-5 h-5 text-[#00A651] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
            {minutesAgo !== null ? `Akurat (${minutesAgo} menit lalu)` : "Menyiapkan sensor..."}
          </p>
        </div>
      </header>

      {/* Driver Status Selector */}
      <DriverStatusSelector />

      {/* Grid Dashboard Widget */}
      <section className="mt-2 mb-8">
        <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3 ml-2">
          Status Zona
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Order Card */}
          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95">
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Orderan</span>
            <span className={`text-[0.95rem] font-extrabold leading-tight ${
              zoneStats.orderan === "Potensi Tinggi" ? "text-green-600" :
              zoneStats.orderan === "Potensi Sedang" ? "text-orange-500" : "text-neutral-500"
            }`}>
              {zoneStats.orderan.split(" ")[0]}<br/>{zoneStats.orderan.split(" ")[1]}
            </span>
          </div>
          {/* Driver Card */}
          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-b ${zoneStats.pesaing === "Padat" ? "from-red-50/50" : zoneStats.pesaing === "Sedang" ? "from-orange-50/50" : "from-green-50/50"} to-transparent`}></div>
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 relative z-10">Pesaing</span>
            <span className={`text-[1.1rem] font-extrabold relative z-10 ${
              zoneStats.pesaing === "Padat" ? "text-red-600" :
              zoneStats.pesaing === "Sedang" ? "text-orange-500" : "text-green-600"
            }`}>
              {zoneStats.pesaing}
            </span>
          </div>
          {/* Ngetem Timer Card */}
          <NgetemTimer />
        </div>
      </section>

      {/* Restoran Aktif Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 ml-2 mr-1">
          <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-400">
            Resto & Promo Aktif
          </h2>
          <span className="text-[0.7rem] font-bold text-blue-600 active:scale-95 transition-transform cursor-pointer">Lihat Peta</span>
        </div>
        
        {/* Horizontal scroll container (Hide scrollbar visually) */}
        <div className="flex overflow-x-auto pb-4 -mx-5 px-5 gap-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
          
          {merchants.length === 0 ? (
            <div className="w-full text-center py-6 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              <p className="text-[0.85rem] text-neutral-400 font-medium">Belum ada sinyal resto di area ini.</p>
            </div>
          ) : (
            merchants.map((resto) => {
              // Map Category to colors
              let baseColor = "#3B82F6"; // Blue Default
              if (resto.category === "Makanan") baseColor = "#F97316"; // Orange
              if (resto.category === "Minuman") baseColor = "#06B6D4"; // Cyan
              if (resto.category === "Snack") baseColor = "#8B5CF6";   // Purple

              return (
                <div key={resto.id} className="shrink-0 w-[140px] bg-white rounded-3xl p-3 shadow-[0_8px_24px_rgb(0,0,0,0.04)] border border-neutral-100 active:scale-95 transition-all cursor-pointer">
                  <div className="h-[4.5rem] rounded-[1.1rem] mb-3 flex items-center justify-center shadow-inner relative overflow-hidden" style={{ backgroundColor: baseColor + '18' }}>
                    {resto.busy_level === 'High' && (
                       <span className="absolute top-0 right-0 bg-red-500 text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded-bl-lg">RAMAI</span>
                    )}
                    <span className="text-[1.5rem] font-extrabold" style={{ color: baseColor }}>{resto.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-[0.85rem] font-bold text-neutral-800 line-clamp-1 mb-1.5 tracking-tight">{resto.name}</h3>
                  <div className="flex flex-col gap-1.5">
                    {resto.promo_active && (
                      <span className="inline-block text-[0.6rem] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-max border border-red-100">
                        Promo Aktif
                      </span>
                    )}
                    {resto.fast_pickup && (
                      <span className="inline-block text-[0.6rem] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-max border border-green-100">
                        Pickup Cepat
                      </span>
                    )}
                    {(!resto.promo_active && !resto.fast_pickup) && (
                      <span className="inline-block text-[0.6rem] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md w-max border border-neutral-200">
                        Level: {resto.busy_level}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* AI Recommendation Card */}
      <section className="pb-8">
        <div 
          className="rounded-[2rem] px-6 py-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-neutral-100 transition-all hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] bg-white relative overflow-hidden"
        >
          {/* Subtle background color hint based on recommendation */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundColor: recommendation.color }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: recommendation.color }}></span>
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-500">
                Saran AI Pilot
              </p>
            </div>
            
            <p className="text-[1.4rem] font-extrabold leading-tight tracking-[-0.02em] text-neutral-900">
              {recommendation.title}
            </p>
            <p className="mt-2 text-[1.05rem] leading-relaxed text-neutral-600 font-medium">
              {recommendation.reason}
            </p>
            
            <Link
              href="/radar"
              className="mt-6 flex w-full items-center justify-center rounded-[1.25rem] py-4 text-[1.05rem] font-bold text-white shadow-lg transition-all active:scale-[0.97] hover:brightness-110"
              style={{ 
                backgroundColor: recommendation.color,
                boxShadow: `0 10px 25px -5px ${recommendation.color}60`
              }}
            >
              Buka Radar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
