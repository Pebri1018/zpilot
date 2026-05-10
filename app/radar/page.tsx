"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { useLocation } from "@/hooks/useLocation";
import { createClient } from "@/lib/supabase/client";

// Dynamically import map so it doesn't break during Server-Side Rendering
const RadarMap = dynamic(() => import("@/components/RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#e2e8f0] animate-pulse rounded-[1.25rem] flex items-center justify-center">
      <span className="text-neutral-500 text-[0.95rem] font-medium tracking-wide">Memuat Peta...</span>
    </div>
  ),
});

export type ActiveDriver = {
  user_id: string;
  latitude: number;
  longitude: number;
};

export default function RadarPage() {
  const { latitude, longitude, areaName, loading, error } = useLocation();
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [fetchingDrivers, setFetchingDrivers] = useState(true);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        // Active = updated within the last 15 minutes
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();

        let query = supabase
          .from("driver_locations")
          .select("user_id, latitude, longitude")
          .gte("updated_at", fifteenMinsAgo);

        if (user) {
          // Exclude self
          query = query.neq("user_id", user.id);
        }

        const { data } = await query;
        if (data) {
          setActiveDrivers(data);
        }
      } catch (err) {
        console.error("Failed to fetch active drivers", err);
      } finally {
        setFetchingDrivers(false);
      }
    }

    fetchDrivers();
    
    // Refresh driver positions every minute
    const interval = setInterval(fetchDrivers, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] text-neutral-900 antialiased">
      <header className="shrink-0 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Radar</h1>
            <p className="mt-1 text-[0.95rem] text-neutral-600">
              {loading ? "Mencari lokasi GPS..." : error ? "Gagal membaca GPS" : areaName ? `Zona: ${areaName}` : "Peta lapangan"}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-1 text-[0.75rem] font-semibold text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {fetchingDrivers ? "..." : activeDrivers.length} Aktif
            </span>
          </div>
        </div>
      </header>

      <div className="relative mx-4 mb-4 min-h-0 flex-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-[1.25rem]">
        {/* Render the interactive Leaflet map */}
        <RadarMap latitude={latitude} longitude={longitude} activeDrivers={activeDrivers} />
        
        {/* Overlay error message if GPS fails */}
        {error && (
          <div className="pointer-events-none absolute inset-x-4 top-4 z-10 rounded-xl bg-red-500/90 px-4 py-2.5 text-center text-[0.85rem] font-medium text-white shadow-md backdrop-blur-md">
            Pastikan fitur Lokasi (GPS) aktif di perangkat Anda.
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,calc(4.75rem+env(safe-area-inset-bottom)))]">
        <Link
          href="/"
          className="block text-center text-[0.95rem] font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 active:text-neutral-900"
        >
          Kembali ke ringkasan
        </Link>
      </div>

      <DriverBottomNav />
    </div>
  );
}
