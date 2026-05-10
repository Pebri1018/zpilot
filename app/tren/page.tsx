"use client";

import { useState, useEffect } from "react";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { useLocation } from "@/hooks/useLocation";
import { getZoneStats, type ZoneStatsResult } from "@/app/actions/recommendation";
import { getActiveMerchants, type MerchantSignal } from "@/app/admin/actions/signals";

type PulseState = "Rising" | "Stable" | "Falling" | "Analyzing";

function getPulseColor(pulse: PulseState) {
  switch (pulse) {
    case "Rising": return "bg-green-50 text-green-700 border-green-200 ring-green-100";
    case "Stable": return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100";
    case "Falling": return "bg-orange-50 text-orange-700 border-orange-200 ring-orange-100";
    case "Analyzing": return "bg-neutral-50 text-neutral-600 border-neutral-200 ring-neutral-100";
  }
}

function getPulseText(pulse: PulseState) {
  switch (pulse) {
    case "Rising": return "Tren Naik (Gacor)";
    case "Stable": return "Stabil (Normal)";
    case "Falling": return "Tren Turun (Anyep)";
    case "Analyzing": return "Menganalisis...";
  }
}

function getRecommendation(pulse: PulseState) {
  switch (pulse) {
    case "Rising": return "Merapat sekarang, tunggu maksimal 15 menit.";
    case "Stable": return "Tetap stay, geser sedikit jika 20 menit tidak ada tarikan.";
    case "Falling": return "Hindari area ini untuk 20 menit ke depan.";
    case "Analyzing": return "Menunggu data...";
  }
}

export default function TrenPage() {
  const { areaName, loading: locLoading } = useLocation();
  const [stats, setStats] = useState<ZoneStatsResult | null>(null);
  const [merchants, setMerchants] = useState<MerchantSignal[]>([]);
  const [pulse, setPulse] = useState<PulseState>("Analyzing");

  useEffect(() => {
    if (!areaName) return;

    async function fetchPulse() {
      try {
        const [zoneStats, merchs] = await Promise.all([
          getZoneStats(areaName),
          getActiveMerchants(areaName)
        ]);
        
        setStats(zoneStats);
        setMerchants(merchs);

        // Determine Pulse
        if (zoneStats.orderan === "Potensi Tinggi" && zoneStats.pesaing !== "Padat") {
          setPulse("Rising");
        } else if (zoneStats.pesaing === "Padat" && zoneStats.orderan === "Data Minim") {
          setPulse("Falling");
        } else if (zoneStats.orderan === "Potensi Sedang" || zoneStats.pesaing === "Sedang") {
          setPulse("Stable");
        } else {
          setPulse("Stable");
        }

      } catch (e) {
        console.error("Gagal mengambil data tren", e);
      }
    }

    fetchPulse();
    const timer = setInterval(fetchPulse, 5 * 60 * 1000); // 5 min
    return () => clearInterval(timer);
  }, [areaName]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] text-neutral-900 antialiased pb-24">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 bg-white shadow-sm sticky top-0 z-20">
        <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Market Pulse</h1>
        <p className="mt-1 text-[0.95rem] text-neutral-500">Analisis tren zona secara real-time</p>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        
        {locLoading ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium text-neutral-500">Mencari sinyal GPS...</p>
          </div>
        ) : (
          <>
            {/* Live Pulse Section */}
            <section>
              <div className="flex items-center justify-between mb-3 ml-1">
                <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Radar Zona: {areaName || "Tidak Diketahui"}
                </h2>
                <span className="text-[0.65rem] font-bold bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                </span>
              </div>
              
              <div className={`rounded-3xl border p-6 shadow-sm ring-4 transition-all duration-500 ${getPulseColor(pulse)}`}>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[0.75rem] font-bold uppercase tracking-widest opacity-80 mb-2">Indikator Tren</span>
                  <span className="text-[1.8rem] font-extrabold tracking-tight mb-4">{getPulseText(pulse)}</span>
                  
                  {pulse === "Rising" && <p className="text-[0.9rem] font-medium leading-relaxed opacity-90">Sinyal orderan kuat dengan rasio driver yang menguntungkan. Sangat direkomendasikan ngetem di area ini.</p>}
                  {pulse === "Stable" && <p className="text-[0.9rem] font-medium leading-relaxed opacity-90">Kondisi pasar normal. Perputaran orderan dan driver seimbang. Coba geser sedikit jika 15 menit tidak ada tarikan.</p>}
                  {pulse === "Falling" && <p className="text-[0.9rem] font-medium leading-relaxed opacity-90">Terlalu banyak driver atau minim sinyal resto. Pertimbangkan untuk berpindah ke zona lain yang lebih potensial.</p>}
                  {pulse === "Analyzing" && <p className="text-[0.9rem] font-medium leading-relaxed opacity-90">Mengumpulkan data dari server dan laporan manual...</p>}
                </div>
              </div>

              {pulse !== "Analyzing" && (
                <div className="mt-4 bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[0.8rem] font-bold uppercase tracking-widest text-neutral-800 mb-0.5">Rekomendasi Aksi</h3>
                    <p className="text-[0.95rem] font-medium text-neutral-600 leading-snug">
                      {getRecommendation(pulse)}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Metrik Detail */}
            {stats && (
              <section className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-[1.2rem] p-4 border border-neutral-100 shadow-sm flex flex-col justify-center">
                  <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Rasio Pesaing</span>
                  <span className="text-[1.1rem] font-extrabold">{stats.pesaing}</span>
                  <span className="text-[0.75rem] text-neutral-500 mt-0.5">Est: {stats.driverCount} driver terdeteksi</span>
                </div>
                <div className="bg-white rounded-[1.2rem] p-4 border border-neutral-100 shadow-sm flex flex-col justify-center">
                  <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-widest mb-1">Potensi Order</span>
                  <span className="text-[1.1rem] font-extrabold">{stats.orderan}</span>
                  <span className="text-[0.75rem] text-neutral-500 mt-0.5">Dari {merchants.length} titik resto aktif</span>
                </div>
              </section>
            )}

            {/* Triggered Merchants */}
            {merchants.length > 0 && (
              <section>
                <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-3 ml-1">
                  Penyumbang Sinyal Utama
                </h2>
                <div className="space-y-2">
                  {merchants.map(m => (
                    <div key={m.id} className="bg-white p-3 rounded-2xl border border-neutral-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-[0.9rem] text-neutral-900">{m.name}</p>
                        <p className="text-[0.75rem] text-neutral-500 mt-0.5 flex gap-2">
                          <span>{m.category}</span>
                          {m.rating && <span className="flex items-center text-amber-500 font-medium">★ {m.rating}</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        {m.promo_active && <span className="block text-[0.6rem] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 mb-1">Promo</span>}
                        {m.busy_level === 'High' && <span className="block text-[0.6rem] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">Ramai</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <DriverBottomNav />
    </div>
  );
}
