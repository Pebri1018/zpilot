"use client";

import { useState, useEffect } from "react";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { useLocation } from "@/hooks/useLocation";
import { getZoneStats, type ZoneStatsResult } from "@/app/actions/recommendation";
import { getActiveMerchants, type MerchantSignal } from "@/app/admin/actions/signals";
import { getJogjaTrends, getCurrentTimeSlot, type TimeSlot } from "@/lib/trendData";
import { getHotspots, type HotspotZone } from "@/app/actions/hotspot";
import { getDailyPerformance, type DailyPerformance } from "@/app/actions/feedback";

type PulseState = "Rising" | "Stable" | "Falling" | "Analyzing";

function getPulseStyle(pulse: PulseState): { bg: string; text: string; border: string; ring: string; badge: string } {
  switch (pulse) {
    case "Rising":  return { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200",  ring: "ring-green-100",  badge: "bg-green-100 text-green-700" };
    case "Stable":  return { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   ring: "ring-blue-100",   badge: "bg-blue-100 text-blue-700" };
    case "Falling": return { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200", ring: "ring-orange-100", badge: "bg-orange-100 text-orange-700" };
    case "Analyzing": return { bg: "bg-neutral-50", text: "text-neutral-600", border: "border-neutral-200", ring: "ring-neutral-100", badge: "bg-neutral-100 text-neutral-600" };
  }
}

function getIntensityLabel(intensity: string) {
  switch (intensity) {
    case "sepi": return "Sepi";
    case "normal": return "Normal";
    case "ramai": return "Ramai";
    case "super_ramai": return "Sangat Ramai";
    default: return intensity;
  }
}

function getIntensityColor(intensity: string) {
  switch (intensity) {
    case "sepi": return "bg-neutral-100 text-neutral-500";
    case "normal": return "bg-blue-100 text-blue-700";
    case "ramai": return "bg-orange-100 text-orange-700";
    case "super_ramai": return "bg-red-100 text-red-700";
    default: return "bg-neutral-100 text-neutral-500";
  }
}

function getRecommendation(pulse: PulseState, historicIntensity: string): string {
  // Combine both live and historical to give smart recommendation
  if (pulse === "Rising" && historicIntensity === "super_ramai") {
    return "Saat ini sedang gacor dan histori zona ini memang sangat ramai. Ngetem dulu, potensi tinggi.";
  }
  if (pulse === "Rising") {
    return "Sinyal bagus. Merapat sekarang, tunggu maksimal 15 menit.";
  }
  if (pulse === "Stable" && (historicIntensity === "ramai" || historicIntensity === "super_ramai")) {
    return "Saat ini masih normal, tapi histori menunjukkan zona ini biasanya ramai. Stay 10–15 menit lagi.";
  }
  if (pulse === "Stable") {
    return "Kondisi seimbang. Tetap di posisi, geser sedikit jika 20 menit tidak ada tarikan.";
  }
  if (pulse === "Falling" && historicIntensity === "sepi") {
    return "Zona ini memang secara histori sepi di waktu ini. Lebih baik pindah ke zona lain.";
  }
  if (pulse === "Falling") {
    return "Terlalu padat atau minim sinyal saat ini. Pertimbangkan pindah zona untuk 20 menit ke depan.";
  }
  return "Mengumpulkan data...";
}

export default function TrenPage() {
  const { areaName, loading: locLoading } = useLocation();
  const [stats, setStats] = useState<ZoneStatsResult | null>(null);
  const [merchants, setMerchants] = useState<MerchantSignal[]>([]);
  const [hotspots, setHotspots] = useState<HotspotZone[]>([]);
  const [performance, setPerformance] = useState<DailyPerformance>({ correct: 0, failed: 0, avgWaitSaved: 0 });
  const [pulse, setPulse] = useState<PulseState>("Analyzing");
  const [currentSlot, setCurrentSlot] = useState<TimeSlot>("siang");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setCurrentSlot(getCurrentTimeSlot(hour));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!areaName) return;

    async function fetchPulse() {
      try {
        const [zoneStats, merchs, hSpots, perf] = await Promise.all([
          getZoneStats(areaName),
          getActiveMerchants(areaName),
          getHotspots(),
          getDailyPerformance()
        ]);

        setStats(zoneStats);
        setMerchants(merchs);
        setHotspots(hSpots.slice(0, 5)); // Top 5
        setPerformance(perf);

        if (zoneStats.orderan === "Potensi Tinggi" && zoneStats.pesaing !== "Padat") {
          setPulse("Rising");
        } else if (zoneStats.pesaing === "Padat" && zoneStats.orderan === "Data Minim") {
          setPulse("Falling");
        } else {
          setPulse("Stable");
        }
      } catch (e) {
        console.error("Gagal mengambil data tren", e);
      }
    }

    fetchPulse();
    const timer = setInterval(fetchPulse, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [areaName]);

  if (!mounted) return null;

  const trendsData = getJogjaTrends(new Date());
  const historical = trendsData[currentSlot];
  const pulseStyle = getPulseStyle(pulse);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] text-neutral-900 antialiased pb-24">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 bg-white shadow-sm sticky top-0 z-20">
        <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Market Pulse</h1>
        <p className="mt-1 text-[0.9rem] text-neutral-500">Tren histori + kondisi live area kamu</p>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5">
        {locLoading ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-500">Mencari sinyal GPS...</p>
          </div>
        ) : (
          <>
            {/* HISTORICAL CONTEXT */}
            <section>
              <div className="flex items-center justify-between mb-2 ml-1">
                <h2 className="text-[0.72rem] font-bold uppercase tracking-widest text-neutral-400">Histori Waktu Ini</h2>
                <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${getIntensityColor(historical.intensity)}`}>
                  {getIntensityLabel(historical.intensity)}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-[0.95rem] text-neutral-900">{historical.label}</p>
                    <p className="text-[0.75rem] text-neutral-500 font-mono mt-0.5">{historical.timeRange}</p>
                    <p className="text-[0.82rem] text-neutral-600 leading-relaxed mt-2 line-clamp-2">{historical.description}</p>
                  </div>
                </div>
                {historical.recommendedZones.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-neutral-200">
                    <p className="text-[0.7rem] font-bold uppercase tracking-wider text-neutral-400 mb-2">Zona Rekomendasi Histori</p>
                    <div className="space-y-1">
                      {historical.recommendedZones.slice(0, 2).map((zone, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                          <span className="text-[0.82rem] font-semibold text-neutral-700">{zone.area}</span>
                          <span className="text-[0.72rem] text-neutral-500 truncate">— {zone.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* DAILY PERFORMANCE */}
            <section>
              <h2 className="text-[0.72rem] font-bold uppercase tracking-widest text-neutral-400 mb-2 ml-1">Performa Hari Ini</h2>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-center">
                  <span className="text-[1.25rem] font-black text-green-600">{performance.correct}</span>
                  <span className="text-[0.6rem] font-bold text-neutral-400 uppercase mt-1 tracking-wider">Tepat</span>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-center">
                  <span className="text-[1.25rem] font-black text-red-500">{performance.failed}</span>
                  <span className="text-[0.6rem] font-bold text-neutral-400 uppercase mt-1 tracking-wider">Meleset</span>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-center">
                  <span className="text-[1.25rem] font-black text-blue-600">{performance.avgWaitSaved}m</span>
                  <span className="text-[0.6rem] font-bold text-neutral-400 uppercase mt-1 tracking-wider">Waktu Hemat</span>
                </div>
              </div>
            </section>

            {/* TOP 5 LIVE ZONES */}
            <section>
              <div className="flex items-center justify-between mb-2 ml-1">
                <h2 className="text-[0.72rem] font-bold uppercase tracking-widest text-neutral-400">Top 5 Live Zones</h2>
                <span className="text-[0.65rem] font-bold bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                </span>
              </div>
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                {hotspots.map((h, i) => (
                  <div key={h.id} className={`p-4 flex items-center justify-between ${i !== hotspots.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[0.75rem] font-bold text-neutral-500 shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-[0.95rem] text-neutral-900 leading-none mb-1">{h.name}</p>
                        <p className="text-[0.7rem] font-medium text-neutral-500">
                          {h.antar_drivers} Antar • {h.ngetem_drivers} Ngetem • {h.merchant_count} Resto
                        </p>
                      </div>
                    </div>
                    <span className={`text-[0.65rem] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0 ${h.label === 'RAMAI' ? 'bg-red-50 text-red-600 border border-red-100' : h.label === 'MENARIK' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-neutral-50 text-neutral-600 border border-neutral-200'}`}>
                      {h.label}
                    </span>
                  </div>
                ))}
                {hotspots.length === 0 && (
                  <div className="p-6 text-center text-sm text-neutral-500">Belum ada data hotspot tersedia.</div>
                )}
              </div>
            </section>

            {/* LIVE PULSE (Current Area) */}
            <section>
              <div className="flex items-center justify-between mb-2 ml-1">
                <h2 className="text-[0.72rem] font-bold uppercase tracking-widest text-neutral-400">
                  Kondisi Live: {areaName || "—"}
                </h2>
                <span className="text-[0.65rem] font-bold bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                </span>
              </div>
              <div className={`rounded-3xl border p-5 shadow-sm ring-4 transition-all duration-500 ${pulseStyle.bg} ${pulseStyle.border} ${pulseStyle.ring}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[1.4rem] font-extrabold tracking-tight ${pulseStyle.text}`}>
                    {pulse === "Rising" ? "Tren Naik (Gacor)" : pulse === "Stable" ? "Stabil (Normal)" : pulse === "Falling" ? "Tren Turun (Anyep)" : "Menganalisis..."}
                  </span>
                  <span className={`text-[0.65rem] font-bold uppercase tracking-wide px-2 py-1 rounded-xl ${pulseStyle.badge}`}>
                    {pulse}
                  </span>
                </div>

                {stats && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/70 rounded-xl p-2.5 text-center">
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-neutral-500">Potensi Order</p>
                      <p className="text-[0.9rem] font-extrabold text-neutral-900 mt-0.5">{stats.orderan}</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-2.5 text-center">
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-neutral-500">Pesaing</p>
                      <p className="text-[0.9rem] font-extrabold text-neutral-900 mt-0.5">{stats.pesaing}</p>
                    </div>
                  </div>
                )}

                {/* Combined Recommendation */}
                {pulse !== "Analyzing" && (
                  <div className="bg-white/80 rounded-xl p-3 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-[0.85rem] font-semibold text-neutral-700 leading-snug">
                      {getRecommendation(pulse, historical.intensity)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Active Merchants */}
            {merchants.length > 0 && (
              <section>
                <h2 className="text-[0.72rem] font-bold uppercase tracking-widest text-neutral-400 mb-2 ml-1">
                  Sinyal Aktif Nearby ({merchants.length})
                </h2>
                <div className="space-y-2">
                  {merchants.map(m => (
                    <div key={m.id} className="bg-white p-3.5 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-[0.9rem] text-neutral-900">{m.name}</p>
                        <p className="text-[0.75rem] text-neutral-500 mt-0.5 flex items-center gap-2">
                          <span>{m.category}</span>
                          {m.rating && <span className="text-amber-500 font-semibold">★ {m.rating}</span>}
                          {m.eta_minutes && <span className="text-neutral-400">~{m.eta_minutes}min</span>}
                        </p>
                      </div>
                      <div className="text-right flex flex-col gap-1">
                        {m.promo_active && <span className="text-[0.6rem] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">Promo</span>}
                        {m.busy_level === "High" && <span className="text-[0.6rem] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">Ramai</span>}
                        {m.free_shipping && <span className="text-[0.6rem] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">Gratis Ongkir</span>}
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
