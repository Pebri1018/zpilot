"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordSessionOpen, recordZoneChange, recordActiveMinute } from "@/app/actions/analytics";

export type LocationState = {
  latitude: number | null;
  longitude: number | null;
  areaName: string | null;
  error: string | null;
  loading: boolean;
  timestamp: number | null;
  status: string;
  setStatus: (status: string) => void;
  refreshLocation: () => void;
};

const LocationContext = createContext<LocationState | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<LocationState, "refreshLocation" | "setStatus">>({
    latitude: null,
    longitude: null,
    areaName: null,
    error: null,
    loading: true,
    timestamp: null,
    status: "Cari Spot",
  });

  const stateRef = useRef(state);
  const prevAreaRef = useRef<string | null>(null);
  const sessionOpenedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Record open session on mount
  useEffect(() => {
    if (!sessionOpenedRef.current) {
      sessionOpenedRef.current = true;
      recordSessionOpen().catch(console.error);
    }
  }, []);

  const fetchLocation = useCallback((force: boolean = false) => {
    const currentState = stateRef.current;
    const now = Date.now();
    
    // If not forcing, and we have a timestamp < 5 mins old, do nothing
    if (!force && currentState.timestamp && (now - currentState.timestamp < 5 * 60 * 1000)) {
      return;
    }

    // If forcing or no data, set loading state
    if (!currentState.latitude || force) {
      setState((s) => ({ ...s, loading: true, error: null }));
    }

    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "Geolocation tidak didukung browser ini",
        loading: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let area = currentState.areaName; 

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await response.json();
          area = data.address?.neighbourhood || data.address?.suburb || data.address?.village || data.address?.city_district || "Area tidak diketahui";
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          if (!area) area = "Koordinat didapat";
        }

        // Track Zone Change
        if (area && area !== prevAreaRef.current) {
          if (prevAreaRef.current !== null) { // Not the first load
            recordZoneChange(area).catch(console.error);
          }
          prevAreaRef.current = area;
        }

        // Sync to Supabase for crowdsourcing
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            await supabase.from("driver_locations").upsert({
              user_id: user.id,
              latitude,
              longitude,
              area_name: area,
              status: currentState.status,
              updated_at: new Date().toISOString(),
            });
          }
        } catch (syncErr) {
          console.error("Failed to sync location to Supabase", syncErr);
        }

        setState((s) => ({
          ...s,
          latitude,
          longitude,
          areaName: area,
          error: null,
          loading: false,
          timestamp: Date.now(),
        }));
      },
      (error) => {
        setState((s) => ({
          ...s,
          error: "Gagal membaca GPS (Pastikan izin lokasi aktif)",
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchLocation();
    
    // Background refresh check every 1 minute
    const intervalId = setInterval(() => {
      fetchLocation(false);
      // Track active minute if we have location
      if (stateRef.current.latitude) {
        recordActiveMinute().catch(console.error);
      }
    }, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchLocation]);

  const value: LocationState = {
    ...state,
    setStatus: (newStatus: string) => {
      setState(s => ({ ...s, status: newStatus }));
      // Immediately force a sync to update the DB with new status
      fetchLocation(true);
    },
    refreshLocation: () => fetchLocation(true),
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
