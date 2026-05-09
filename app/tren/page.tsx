"use client";

import { useState, useEffect } from "react";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { jogjaTrends, getCurrentTimeSlot, TimeSlot } from "@/lib/trendData";

function getIntensityColor(intensity: string) {
  switch (intensity) {
    case "sepi": return "bg-neutral-100 text-neutral-600 border-neutral-200";
    case "normal": return "bg-blue-50 text-blue-700 border-blue-200";
    case "ramai": return "bg-orange-50 text-orange-700 border-orange-200";
    case "super_ramai": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
  }
}

function getIntensityLabel(intensity: string) {
  switch (intensity) {
    case "sepi": return "Waktu Sepi";
    case "normal": return "Normal";
    case "ramai": return "Mulai Ramai";
    case "super_ramai": return "Sangat Sibuk";
    default: return intensity;
  }
}

export default function TrenPage() {
  const [currentSlot, setCurrentSlot] = useState<TimeSlot>("siang");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setCurrentSlot(getCurrentTimeSlot(hour));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTrend = jogjaTrends[currentSlot];
  const allSlots: TimeSlot[] = ["pagi", "siang", "sore", "malam", "tengah_malam"];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] text-neutral-900 antialiased pb-24">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 bg-white shadow-sm sticky top-0 z-20">
        <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Tren Area Jogja</h1>
        <p className="mt-1 text-[0.95rem] text-neutral-500">Prediksi keramaian & rekomendasi</p>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* Saat Ini Section */}
        <section>
          <h2 className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400 mb-3 ml-1">
            Status Saat Ini
          </h2>
          <div className={`rounded-2xl border ${getIntensityColor(currentTrend.intensity)} p-5 shadow-sm transition-colors`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[1.1rem]">{currentTrend.label}</span>
              <span className="text-[0.75rem] font-bold uppercase tracking-wider px-2 py-1 bg-white/60 rounded-lg">
                {getIntensityLabel(currentTrend.intensity)}
              </span>
            </div>
            <p className="text-[0.9rem] opacity-90 leading-relaxed mb-4">
              {currentTrend.description}
            </p>
            
            <div className="space-y-2">
              <p className="text-[0.8rem] font-semibold uppercase tracking-wider opacity-75">Target Zona Utama:</p>
              {currentTrend.recommendedZones.map((zone, idx) => (
                <div key={idx} className="bg-white/60 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[0.95rem]">{zone.area}</span>
                    <span className={`text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded ${zone.target === 'paket' ? 'bg-purple-100 text-purple-700' : zone.target === 'makanan' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-700'}`}>
                      {zone.target}
                    </span>
                  </div>
                  <span className="text-[0.8rem] opacity-80">{zone.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Jadwal Harian Section */}
        <section>
          <h2 className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-neutral-400 mb-3 ml-1">
            Jadwal Harian
          </h2>
          <div className="space-y-3">
            {allSlots.map((slot) => {
              const trend = jogjaTrends[slot];
              const isCurrent = slot === currentSlot;
              
              return (
                <div 
                  key={slot}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                    isCurrent 
                      ? "border-blue-300 bg-white shadow-md ring-1 ring-blue-100" 
                      : "border-neutral-200 bg-white shadow-sm opacity-80"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 rounded-bl-xl bg-blue-500 px-3 py-1 text-[0.65rem] font-bold text-white uppercase tracking-wider">
                      Sekarang
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[1.05rem] text-neutral-800">{trend.label}</h3>
                    <span className={`text-[0.7rem] font-bold uppercase px-2 py-1 rounded-md ${getIntensityColor(trend.intensity)}`}>
                      {getIntensityLabel(trend.intensity)}
                    </span>
                  </div>
                  <p className="text-[0.85rem] text-neutral-500 font-mono mb-2">{trend.timeRange}</p>
                  <p className="text-[0.85rem] text-neutral-600 leading-relaxed line-clamp-2">
                    {trend.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <DriverBottomNav />
    </div>
  );
}
