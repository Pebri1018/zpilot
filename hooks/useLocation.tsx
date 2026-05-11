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
  const fetchLocationRef = useRef<(force?: boolean) => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!sessionOpenedRef.current) {
      sessionOpenedRef.current = true;
      recordSessionOpen().catch(console.error);

      // Fetch initial status so it doesn't default to Offline on refresh
      async function fetchInitialStatus() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('users').select('status').eq('id', user.id).maybeSingle();
          if (data?.status && data.status !== "Offline") {
            // Restore status AND immediately trigger GPS via ref (avoids forward-reference)
            setState(s => ({ ...s, status: data.status }));
            stateRef.current = { ...stateRef.current, status: data.status };
            setTimeout(() => fetchLocationRef.current(true), 100);
          } else if (data?.status === "Offline") {
            setState(s => ({ ...s, status: "Offline", loading: false }));
          }
        }
      }
      fetchInitialStatus();
    }
  }, []);

  const fetchLocation = useCallback(async (force: boolean = false) => {
    const currentState = stateRef.current;
    
    // --- OFFLINE RULE: STOP TRACKING ---
    if (currentState.status === "Offline" && !force) {
      if (currentState.loading) setState(s => ({ ...s, loading: false }));
      return;
    }

    const now = Date.now();
    if (!force && currentState.timestamp && (now - currentState.timestamp < 3 * 60 * 1000)) {
      if (currentState.loading) setState(s => ({ ...s, loading: false }));
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

        // Update coords immediately — don't wait for reverse geocode
        setState((s) => ({
          ...s,
          latitude,
          longitude,
          error: null,
          loading: false,
          timestamp: Date.now(),
        }));

        // Sync location to DB in background (non-blocking)
        updateDriverStatus(stateRef.current.status, latitude, longitude).catch(() => {});

        // Reverse geocode in background
        let area = stateRef.current.areaName;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await response.json();
          const addr = data.address || {};
          area = addr.road || addr.neighbourhood || addr.suburb || addr.village || "Unknown Area";
        } catch (err) {}

        if (area && area !== prevAreaRef.current) {
          if (prevAreaRef.current !== null) recordZoneChange(area).catch(console.error);
          prevAreaRef.current = area;
        }

        // Update area name once we have it
        setState((s) => ({ ...s, areaName: area }));
      },
      (error) => {
        setState((s) => ({ ...s, error: "GPS Error", loading: false }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  // Keep ref in sync with the latest fetchLocation
  useEffect(() => {
    fetchLocationRef.current = fetchLocation;
  }, [fetchLocation]);

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
    setStatus: (newStatus: string) => {
      // Update local state immediately
      setState(s => ({ ...s, status: newStatus }));

      // Sync to DB in background (non-blocking — avoids UI freeze)
      const current = stateRef.current;
      updateDriverStatus(newStatus, current.latitude || undefined, current.longitude || undefined)
        .catch(console.error);

      if (newStatus !== "Offline") {
        // Trigger GPS fetch immediately without waiting for DB
        fetchLocation(true);
      } else {
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
