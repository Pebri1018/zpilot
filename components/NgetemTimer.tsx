"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";

// Haversine formula to calculate distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function NgetemTimer() {
  const { latitude, longitude } = useLocation();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem("ztips_ngetem");
    if (saved) {
      try {
        const { startTime, lat, lng } = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = 15 * 60 - elapsed;

        if (remaining > 0) {
          setTimeLeft(remaining);
        } else {
          localStorage.removeItem("ztips_ngetem");
          setShowSuggestion(true);
        }
      } catch (e) {
        localStorage.removeItem("ztips_ngetem");
      }
    }
  }, []);

  useEffect(() => {
    if (timeLeft === null) return;

    // Check GPS drift every tick if we have GPS
    const saved = localStorage.getItem("ztips_ngetem");
    if (saved && latitude && longitude) {
      try {
        const { lat, lng } = JSON.parse(saved);
        const distance = getDistanceInMeters(lat, lng, latitude, longitude);
        if (distance > 200) {
          alert("Kamu terdeteksi berpindah > 200m. Timer Ngetem direset.");
          stopTimer();
          return;
        }
      } catch (e) {}
    }

    if (timeLeft <= 0) {
      stopTimer();
      setShowSuggestion(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(t => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, latitude, longitude]);

  const startTimer = () => {
    if (!latitude || !longitude) {
      alert("Tunggu GPS mengunci lokasi dulu.");
      return;
    }
    const data = { startTime: Date.now(), lat: latitude, lng: longitude };
    localStorage.setItem("ztips_ngetem", JSON.stringify(data));
    setTimeLeft(15 * 60);
  };

  const stopTimer = () => {
    localStorage.removeItem("ztips_ngetem");
    setTimeLeft(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-neutral-100 flex flex-col items-center justify-center text-center transition-transform active:scale-95 relative overflow-hidden h-full min-h-[80px]">
        {timeLeft === null ? (
          <button 
            onClick={startTimer}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[0.65rem] font-bold uppercase tracking-widest leading-tight">Mulai<br/>Ngetem</span>
          </button>
        ) : (
          <button onClick={stopTimer} className="w-full h-full flex flex-col items-center justify-center">
            <span className="text-[0.6rem] font-bold text-blue-500 uppercase tracking-widest mb-1.5">Timer Berjalan</span>
            <span className="text-[1.2rem] font-extrabold text-blue-600 tabular-nums leading-none tracking-tight">{formatTime(timeLeft)}</span>
          </button>
        )}
      </div>

      {showSuggestion && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-[1.1rem] font-black text-neutral-900 mb-2">Waktu Ngetem Habis</h3>
            <p className="text-[0.85rem] text-neutral-500 leading-relaxed mb-6">
              Kamu sudah ngetem 15 menit. Sistem menyarankan kamu untuk segera pindah atau patroli agar peluang mendapat orderan lebih tinggi!
            </p>
            <button 
              onClick={() => setShowSuggestion(false)}
              className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-bold text-[0.95rem] active:scale-95 transition-transform"
            >
              Oke, Saya Pindah
            </button>
          </div>
        </div>
      )}
    </>
  );
}
