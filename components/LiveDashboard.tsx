"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocation } from "@/hooks/useLocation";
import { getRecommendation } from "@/lib/recommendation";

const getMockRestaurants = (area: string | null) => {
  const baseRestos = [
    { name: "McDonald's", promo: "Diskon 50%", time: "10 min", color: "#FFC107" },
    { name: "KFC", promo: "Flash Sale", time: "5 min", color: "#EF4444" },
    { name: "Mie Gacoan", promo: "Paling Laris", time: "15 min", color: "#F97316" },
  ];

  if (!area) return baseRestos;
  const lowerArea = area.toLowerCase();

  if (lowerArea.includes("seturan") || lowerArea.includes("babarsari") || lowerArea.includes("condongcatur")) {
    return [
      { name: "Mie Gacoan Seturan", promo: "Paling Laris", time: "15 min", color: "#F97316" },
      { name: "Preksu Seturan", promo: "Diskon 20%", time: "8 min", color: "#8B5CF6" },
      { name: "Burjo Andeska", promo: "Rekomendasi", time: "5 min", color: "#10B981" },
      { name: "Olive Fried Chicken", promo: "Promo Ongkir", time: "12 min", color: "#EF4444" },
    ];
  }
  if (lowerArea.includes("ugm") || lowerArea.includes("uny") || lowerArea.includes("gejayan")) {
    return [
      { name: "Nasi Padang Murah", promo: "Paling Laris", time: "5 min", color: "#F59E0B" },
      { name: "Olive Jakal", promo: "Diskon 30%", time: "10 min", color: "#EF4444" },
      { name: "Warteg Kharisma", promo: "Rekomendasi", time: "7 min", color: "#3B82F6" },
    ];
  }
  return baseRestos;
};

export function LiveDashboard() {
  const { areaName, loading, error, timestamp, refreshLocation } = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  const formattedTime = time.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
  const recommendation = getRecommendation(areaName, hour);
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

      {/* Grid Dashboard Widget */}
      <section className="mt-2 mb-8">
        <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3 ml-2">
          Status Zona
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Order Card */}
          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center text-center transition-transform active:scale-95">
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Orderan</span>
            <span className="text-[1.1rem] font-extrabold text-neutral-800">Normal</span>
          </div>
          {/* Driver Card */}
          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center text-center transition-transform active:scale-95 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent"></div>
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 relative z-10">Pesaing</span>
            <span className="text-[1.1rem] font-extrabold text-orange-600 relative z-10">Padat</span>
          </div>
          {/* Wait Time Card */}
          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center text-center transition-transform active:scale-95">
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Ngetem</span>
            <span className="text-[1.1rem] font-extrabold text-neutral-800 tabular-nums">8<span className="text-[0.8rem] text-neutral-500 font-medium ml-0.5">mnt</span></span>
          </div>
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
          
          {getMockRestaurants(areaName).map((resto, i) => (
            <div key={i} className="shrink-0 w-[130px] bg-white rounded-3xl p-3 shadow-[0_8px_24px_rgb(0,0,0,0.04)] border border-neutral-100 active:scale-95 transition-all cursor-pointer">
              <div className="h-[4.5rem] rounded-[1.1rem] mb-3 flex items-center justify-center shadow-inner" style={{ backgroundColor: resto.color + '18' }}>
                 <span className="text-[1.5rem] font-extrabold" style={{ color: resto.color }}>{resto.name.charAt(0)}</span>
              </div>
              <h3 className="text-[0.85rem] font-bold text-neutral-800 line-clamp-1 mb-1.5 tracking-tight">{resto.name}</h3>
              <div className="flex flex-col gap-1.5">
                <span className="inline-block text-[0.6rem] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-max border border-red-100">
                  {resto.promo}
                </span>
                <span className="text-[0.65rem] font-semibold text-neutral-500 flex items-center gap-1">
                  <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {resto.time}
                </span>
              </div>
            </div>
          ))}
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
