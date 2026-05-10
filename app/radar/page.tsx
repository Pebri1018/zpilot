"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { useLocation } from "@/hooks/useLocation";
import { getActiveMerchants, type MerchantSignal } from "@/app/admin/actions/signals";
import { saveNgetemSpot } from "@/app/admin/actions/notes";

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
  status?: "ngetem" | "antar" | "offline";
};

export default function RadarPage() {
  const { latitude, longitude, areaName, loading, error } = useLocation();
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [merchants, setMerchants] = useState<MerchantSignal[]>([]);
  const [ngetemSpots, setNgetemSpots] = useState<any[]>([]);
  const [fetchingDrivers, setFetchingDrivers] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        // Active = updated within the last 15 minutes
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();

        let query = supabase
          .from("driver_locations")
          .select("user_id, latitude, longitude, status")
          .gte("updated_at", fifteenMinsAgo);

        if (user) {
          // Exclude self
          query = query.neq("user_id", user.id);
        }

        const { data: drivers } = await query;
        if (drivers) {
          // Map status to our types
          const driversWithStatus = drivers.map(d => ({
            ...d,
            status: (d.status === "Ngetem" ? "ngetem" : d.status === "Antar" ? "antar" : "offline") as "ngetem" | "antar" | "offline"
          }));
          setActiveDrivers(driversWithStatus);
        }

        // Fetch merchants
        const merchantsData = await getActiveMerchants(areaName);
        setMerchants(merchantsData);

        // Fetch ngetem spots (assuming there's a table)
        const { data: spots } = await supabase
          .from("ngetem_spots")
          .select("*")
          .eq("is_active", true);
        setNgetemSpots(spots || []);

      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setFetchingDrivers(false);
      }
    }

    fetchData();
    
    // Refresh data every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [areaName]);

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
        <RadarMap 
          latitude={latitude} 
          longitude={longitude} 
          activeDrivers={activeDrivers} 
          merchants={merchants}
          ngetemSpots={ngetemSpots}
        />
        
        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-10">
          <div className="text-xs font-bold text-neutral-900 mb-2">LEGEND</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-neutral-700">Driver Ngetem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-xs text-neutral-700">Driver Antar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-neutral-700">Merchant Busy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-neutral-700">Merchant Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-neutral-700">Merchant Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-neutral-700">Hangout Spot</span>
            </div>
          </div>
        </div>
        
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
