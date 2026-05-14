"use client";

import { useState, useEffect } from "react";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { useLocation } from "@/hooks/useLocation";
import { getZoneStats, type ZoneStatsResult } from "@/app/actions/recommendation";
import { getJogjaTrends, getCurrentTimeSlot, type TimeSlot } from "@/lib/trendData";
import { getHotspots, type HotspotZone } from "@/app/actions/hotspot";

function getTimeContext(hour: number): { label: string; emoji: string; color: string } {
  if (hour >= 11 && hour <= 13) return { label: "Lunch Rush", emoji: "🔥", color: "text-red-600" };
  if (hour >= 17 && hour <= 19) return { label: "Dinner Rush", emoji: "🔥", color: "text-orange-600" };
  if (hour >= 20 && hour <= 23) return { label: "Malam Aktif", emoji: "🌙", color: "text-indigo-600" };
  if (hour >= 7 && hour <= 10) return { label: "Pagi Aktif", emoji: "☀️", color: "text-amber-600" };
  if (hour >= 0 && hour <= 4) return { label: "Dini Hari", emoji: "🌌", color: "text-purple-600" };
  return { label: "Normal", emoji: "📡", color: "text-blue-600" };
}

function getMovement(h: HotspotZone): { arrow: string; color: string } {
  const ratio = h.merchant_count > 0 ? h.ngetem_drivers / h.merchant_count : 0;
  if (ratio > 1.5) return { arrow: "↓", color: "text-red-500" };
  if (ratio < 0.5 && h.merchant_count >= 2) return { arrow: "↑", color: "text-emerald-500" };
  return { arrow: "→", color: "text-neutral-400" };
}

const ZONE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  "PELUANG EMAS":    { bg: "bg-emerald-100", text: "text-emerald-700", label: "Peluang Emas" },
  "BAGUS SEKARANG":  { bg: "bg-emerald-50",  text: "text-emerald-600", label: "Bagus" },
  "NORMAL":          { bg: "bg-blue-50",     text: "text-blue-600",    label: "Normal" },
  "KOMPETITIF":      { bg: "bg-orange-100",  text: "text-orange-700",  label: "Kompetitif" },
  "HINDARI SEMENTARA": { bg: "bg-neutral-100", text: "text-neutral-500", label: "Hindari" },
  "JEBAKAN KERUMUNAN": { bg: "bg-red-100",     text: "text-red-700",     label: "Jebakan" },
  "SEPI":            { bg: "bg-neutral-50",  text: "text-neutral-400", label: "Sepi" },
};

export default function TrenPage() {
  const { areaName } = useLocation();
  const [stats, setStats] = useState<ZoneStatsResult | null>(null);
  const [hotspots, setHotspots] = useState<HotspotZone[]>([]);
  const [currentSlot, setCurrentSlot] = useState<TimeSlot>("siang");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setCurrentSlot(getCurrentTimeSlot(hour));
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetch() {
      const [zoneStats, hSpots] = await Promise.all([
        getZoneStats(areaName),
        getHotspots()
      ]);
      setStats(zoneStats);
      setHotspots(hSpots.slice(0, 5));
    }
    fetch();
    const t = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [areaName]);

  if (!mounted) return null;

  const hour = new Date().getHours();
  const timeCtx = getTimeContext(hour);
  const trendsData = getJogjaTrends(new Date());
  const historical = trendsData[currentSlot];
  const topZones = hotspots.slice(0, 3);
  const movingUp = hotspots.filter(h => getMovement(h).arrow === "↑").slice(0, 2);
  const movingDown = hotspots.filter(h => getMovement(h).arrow === "↓").slice(0, 2);

  // Advice generation
  let advice = "Pantau sinyal dan pilih zona dengan saingan paling longgar.";
  if (stats?.pesaing === "Padat" && stats?.orderan.includes("Tinggi")) {
    advice = "Zona padat tapi orderan tinggi — ambil pinggiran hotspot, jangan di pusat.";
  } else if (stats?.pesaing === "Longgar" && stats?.orderan.includes("Tinggi")) {
    advice = "Kondisi ideal! Potensi tinggi, saingan longgar. Stay di zona ini.";
  } else if (stats?.pesaing === "Padat" && !stats?.orderan.includes("Tinggi")) {
    advice = "Hindari pusat yang padat tanpa sinyal. Geser ke zona peluang terdekat.";
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f4] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased pb-24">

      {/* STICKY HEADER */}
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 bg-[#f2f2f4] dark:bg-neutral-950 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[1.3rem] font-black tracking-tight">ZPilot Intelligence</h1>
            <p className={`text-[0.8rem] font-bold ${timeCtx.color} flex items-center gap-1`}>
              {timeCtx.emoji} {timeCtx.label}
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1 inline-block" />
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.62rem] font-bold text-neutral-400 uppercase">Area</p>
            <p className="text-[0.82rem] font-black text-neutral-800 dark:text-neutral-200 max-w-[130px] truncate">{areaName || "—"}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">

        {/* NOW STATUS */}
        <div className="bg-neutral-900 rounded-3xl px-5 py-4 shadow-lg">
          <p className="text-[0.62rem] font-black uppercase tracking-widest text-white/40 mb-1">KONDISI SEKARANG</p>
          <p className="text-[1.5rem] font-black text-white leading-tight">
            {timeCtx.emoji} {timeCtx.label}
          </p>
          <p className="text-[0.82rem] text-white/60 font-medium mt-1">{historical.description}</p>

          {/* Stats pills */}
          {stats && (
            <div className="flex gap-2 mt-3">
              <span className={`text-[0.72rem] font-black px-3 py-1 rounded-full ${stats.orderan.includes("Tinggi") ? "bg-emerald-500 text-white" : "bg-white/10 text-white/70"}`}>
                Order: {stats.orderan.replace("Potensi ", "")}
              </span>
              <span className={`text-[0.72rem] font-black px-3 py-1 rounded-full ${stats.pesaing === "Padat" ? "bg-red-500 text-white" : "bg-white/10 text-white/70"}`}>
                Saingan: {stats.pesaing}
              </span>
            </div>
          )}
        </div>

        {/* TOP ZONES */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-neutral-400">Zona Efisien Sekarang</p>
            <span className="text-[0.6rem] font-bold text-neutral-400 bg-white rounded-full px-2 py-0.5 border border-neutral-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {topZones.length === 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 text-center text-[0.85rem] text-neutral-400 border border-neutral-100 dark:border-white/10">
                Mengumpulkan data zona...
              </div>
            )}
            {topZones.map((h, i) => {
              const zs = ZONE_STYLE[h.label] || ZONE_STYLE.SEPI;
              const mv = getMovement(h);
              return (
                <div key={h.id} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3 border border-neutral-100 dark:border-white/10 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[0.75rem] font-black text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">{i+1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[0.9rem] font-black text-neutral-900 dark:text-neutral-100">{h.name}</p>
                        <span className={`text-[1rem] font-black ${mv.color}`}>{mv.arrow}</span>
                      </div>
                      <p className="text-[0.67rem] text-neutral-500 dark:text-neutral-400 font-medium">{h.ngetem_drivers} ngetem · {h.antar_drivers} antar · {h.merchant_count} resto</p>
                    </div>
                  </div>
                  <span className={`text-[0.62rem] font-black uppercase px-2 py-1 rounded-lg shrink-0 ${zs.bg} ${zs.text}`}>{zs.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOVEMENT */}
        {(movingUp.length > 0 || movingDown.length > 0) && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-white/10 shadow-sm">
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-neutral-400 mb-3">Pergerakan Zona</p>
            <div className="flex gap-4">
              {movingUp.length > 0 && (
                <div className="flex-1">
                  <p className="text-[0.65rem] font-bold text-emerald-600 uppercase mb-1">Naik ↑</p>
                  {movingUp.map(h => <p key={h.id} className="text-[0.82rem] font-bold text-neutral-800 dark:text-neutral-200">{h.name}</p>)}
                </div>
              )}
              {movingDown.length > 0 && (
                <div className="flex-1">
                  <p className="text-[0.65rem] font-bold text-red-500 uppercase mb-1">Turun ↓</p>
                  {movingDown.map(h => <p key={h.id} className="text-[0.82rem] font-bold text-neutral-800 dark:text-neutral-200">{h.name}</p>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADVICE */}
        <div className="bg-indigo-900 rounded-2xl px-4 py-4">
          <p className="text-[0.62rem] font-black uppercase tracking-widest text-indigo-300 mb-1">💡 ZPilot Insight</p>
          <p className="text-[0.9rem] font-bold text-white leading-snug">{advice}</p>
        </div>

        {/* HISTORICAL CONTEXT */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-4 border border-neutral-100 dark:border-white/10 shadow-sm">
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-neutral-400 mb-2">Histori Waktu Ini</p>
          <p className="text-[0.9rem] font-bold text-neutral-900 dark:text-neutral-100">{historical.label}</p>
          <p className="text-[0.75rem] text-neutral-500 font-mono">{historical.timeRange}</p>
          {historical.recommendedZones.slice(0, 2).map((z, i) => (
            <div key={i} className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
              <p className="text-[0.8rem] font-semibold text-neutral-700 dark:text-neutral-300">{z.area} <span className="text-neutral-400 font-normal">— {z.reason}</span></p>
            </div>
          ))}
        </div>

      </main>

      <DriverBottomNav />
    </div>
  );
}
