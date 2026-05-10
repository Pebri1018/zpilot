"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordSessionOpen, recordZoneChange, recordActiveMinute } from "@/app/actions/analytics";
import { updateDriverStatus } from "@/app/akun/actions";

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
    status: "Offline",
  });

  const stateRef = useRef(state);
  const prevAreaRef = useRef<string | null>(null);
  const sessionOpenedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!sessionOpenedRef.current) {
      sessionOpenedRef.current = true;
      recordSessionOpen().catch(console.error);
    }
  }, []);

  const fetchLocation = useCallback(async (force: boolean = false) => {
    const currentState = stateRef.current;
    
    // --- OFFLINE RULE: STOP TRACKING ---
    if (currentState.status === "Offline" && !force) return;

    const now = Date.now();
    if (!force && currentState.timestamp && (now - currentState.timestamp < 3 * 60 * 1000)) {
      return;
    }

    if (!currentState.latitude || force) {
      setState((s) => ({ ...s, loading: true, error: null }));
    }

    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "GPS not supported", loading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // --- STOP SYNC IF OFFLINE ---
        if (stateRef.current.status === "Offline") {
          setState(s => ({ ...s, loading: false }));
          return;
        }

        let area = stateRef.current.areaName; 
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await response.json();
          area = data.address?.neighbourhood || data.address?.suburb || data.address?.village || "Unknown Area";
        } catch (err) {}

        if (area && area !== prevAreaRef.current) {
          if (prevAreaRef.current !== null) recordZoneChange(area).catch(console.error);
          prevAreaRef.current = area;
        }

        try {
          await updateDriverStatus(stateRef.current.status, latitude, longitude);
        } catch (syncErr) {}

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
        setState((s) => ({ ...s, error: "GPS Error", loading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
    const intervalId = setInterval(() => {
      const cur = stateRef.current;
      // --- TRACK ONLY IF ACTIVE ---
      if (cur.status !== "Offline") {
        fetchLocation(false);
        // --- COUNT ACTIVE MINUTES ONLY IF NGETEM ---
        if (cur.status === "Ngetem" && cur.latitude) {
          recordActiveMinute().catch(console.error);
        }
      }
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchLocation]);

  const value: LocationState = {
    ...state,
    setStatus: async (newStatus: string) => {
      setState(s => ({ ...s, status: newStatus }));
      // Force sync with server on status change
      const current = stateRef.current;
      await updateDriverStatus(newStatus, current.latitude || undefined, current.longitude || undefined);
      
      if (newStatus !== "Offline") {
        fetchLocation(true);
      } else {
        // Clear local cache if offline
        setState(s => ({ ...s, loading: false }));
      }
    },
    refreshLocation: () => fetchLocation(true),
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) throw new Error("useLocation must be used within a LocationProvider");
  return context;
}
