"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { useLocation } from "@/hooks/useLocation";
import { createClient } from "@/lib/supabase/client";

const RadarMap = dynamic(() => import("@/components/RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#f0f0f0] animate-pulse rounded-[1.25rem] flex items-center justify-center">
      <span className="text-neutral-500 text-[0.8rem] font-bold uppercase tracking-widest">Memuat Radar...</span>
    </div>
  ),
});

export type RadarMarker = {
  id: string;
  lat: number;
  lng: number;
  type: "driver_ngetem" | "driver_antar" | "merchant_high" | "merchant_med" | "merchant_low" | "spot";
  label: string;
};

export default function RadarPage() {
  const { latitude, longitude, areaName, loading, error } = useLocation();
  const [markers, setMarkers] = useState<RadarMarker[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const now = new Date();
        const activeLimit = new Date(now.getTime() - 15 * 60000).toISOString();

        // 1. Fetch Drivers from users table
        const { data: drivers } = await supabase
          .from("users")
          .select("id, last_lat, last_lng, status, nama")
          .not("last_lat", "is", null)
          .gte("last_active", activeLimit);

        // 2. Fetch Active Merchants
        const { data: merchants } = await supabase
          .from("merchant_signals")
          .select("id, lat, lng, name, busy_score")
          .eq("is_active", true);

        // 3. Fetch Hangout Spots
        const { data: spots } = await supabase
          .from("ngetem_spots")
          .select("id, lat, lng, name");

        const newMarkers: RadarMarker[] = [];

        drivers?.forEach(d => {
          if (d.status === "Offline") return;
          newMarkers.push({
            id: d.id,
            lat: d.last_lat,
            lng: d.last_lng,
            type: d.status === "Ngetem" ? "driver_ngetem" : "driver_antar",
            label: d.nama || "Driver"
          });
        });

        merchants?.forEach(m => {
          if (m.lat && m.lng) {
            let type: RadarMarker["type"] = "merchant_low";
            if (m.busy_score >= 4) type = "merchant_high";
            else if (m.busy_score >= 2) type = "merchant_med";
            
            newMarkers.push({
              id: m.id,
              lat: m.lat,
              lng: m.lng,
              type,
              label: m.name
            });
          }
        });

        spots?.forEach(s => {
          if (s.lat && s.lng) {
            newMarkers.push({
              id: s.id,
              lat: s.lat,
              lng: s.lng,
              type: "spot",
              label: s.name
            });
          }
        });

        setMarkers(newMarkers);
      } catch (err) {
        console.error("Radar fetch error", err);
      } finally {
        setFetching(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f8] text-neutral-900 antialiased">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-tight">Radar Intel</h1>
          <p className="text-[0.85rem] text-neutral-500">{areaName || "Scanning area..."}</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[0.7rem] font-bold uppercase tracking-wider">{fetching ? "..." : markers.length} Sinyal</span>
        </div>
      </header>

      <div className="relative flex-1 mx-4 mb-4 overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white">
        <RadarMap latitude={latitude} longitude={longitude} markers={markers} />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-[1.5rem] shadow-lg z-[1000] border border-white/50">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-neutral-400 mb-2">Keterangan Radar</p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <LegendItem color="bg-blue-500" label="Ngetem" />
            <LegendItem color="bg-neutral-400" label="Antar" />
            <LegendItem color="bg-red-500" label="Resto Ramai" />
            <LegendItem color="bg-orange-400" label="Resto Sedang" />
            <LegendItem color="bg-emerald-500" label="Resto Sepi" />
            <LegendItem color="bg-purple-500" label="Spot Mangkal" />
          </div>
        </div>
      </div>

      <div className="pb-[calc(5rem+env(safe-area-inset-bottom))]" />
      <DriverBottomNav />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[0.75rem] font-semibold text-neutral-700">{label}</span>
    </div>
  );
}
