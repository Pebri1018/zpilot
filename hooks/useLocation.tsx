"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordSessionOpen, recordZoneChange, recordActiveMinute } from "@/app/actions/analytics";
import { updateDriverStatus } from "@/app/akun/actions";

const geocodeCache = new Map<string, string>();

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

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p = Math.PI / 180;
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

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
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handlePositionUpdate = useCallback(async (position: GeolocationPosition, force: boolean = false) => {
    const { latitude, longitude } = position.coords;
    const currentState = stateRef.current;

    // Distance threshold check (10 meters)
    if (!force && currentState.latitude && currentState.longitude) {
      const dist = getDistanceInMeters(currentState.latitude, currentState.longitude, latitude, longitude);
      if (dist < 10) {
        return; // Skip update if moved less than 10 meters
      }
    }

    setState((s) => ({
      ...s,
      latitude,
      longitude,
      error: null,
      loading: false,
      timestamp: Date.now(),
    }));

    // Sync to DB ONLY if active
    if (currentState.status !== "Offline") {
      updateDriverStatus(currentState.status, latitude, longitude).catch(() => {});
    }

    // Reverse geocode
    let area = stateRef.current.areaName;
    const cacheKey = `${Math.round(latitude * 10000) / 10000},${Math.round(longitude * 10000) / 10000}`;
    
    if (geocodeCache.has(cacheKey)) {
      area = geocodeCache.get(cacheKey)!;
    } else {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "id" } }
        );
        const data = await response.json();
        const addr = data.address || {};
        
        const road = addr.road || addr.pedestrian || addr.path || addr.footway || null;
        const neighbourhood = addr.neighbourhood || addr.hamlet || null;
        const suburb = addr.suburb || addr.village || null;
        const district = addr.district || addr.city_district || addr.subdistrict || null;

        const parts: string[] = [];
        if (road) parts.push(road);
        if (neighbourhood) parts.push(neighbourhood);
        else if (suburb) parts.push(suburb);
        
        if (parts.length < 2 && district) parts.push(district);

        if (parts.length > 0) {
          area = parts.join(", ");
        } else {
          area = addr.city || addr.town || addr.county || "Unknown Area";
        }
        
        if (area) geocodeCache.set(cacheKey, area);
      } catch (err) {}
    }

    if (area && area !== prevAreaRef.current) {
      if (prevAreaRef.current !== null) recordZoneChange(area).catch(console.error);
      prevAreaRef.current = area;
    }

    setState((s) => ({ ...s, areaName: area }));
  }, []);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "GPS not supported", loading: false }));
      return;
    }
    setState(s => ({ ...s, loading: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePositionUpdate(pos, true),
      () => setState((s) => ({ ...s, error: "GPS Error", loading: false })),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [handlePositionUpdate]);

  useEffect(() => {
    if (!sessionOpenedRef.current) {
      sessionOpenedRef.current = true;
      recordSessionOpen().catch(console.error);

      async function fetchInitialStatus() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('users').select('status').eq('id', user.id).maybeSingle();
          if (data?.status && data.status !== "Offline") {
            setState(s => ({ ...s, status: data.status }));
            stateRef.current = { ...stateRef.current, status: data.status };
          } else if (data?.status === "Offline") {
            setState(s => ({ ...s, status: "Offline" }));
          }
        }
      }
      fetchInitialStatus().finally(() => {
        // Dual-Strategy Step 1: Immediate First Lock
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => handlePositionUpdate(pos, true), // force=true skips distance threshold
            () => setState((s) => ({ ...s, error: "GPS Error", loading: false })),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
          );
        } else {
          setState((s) => ({ ...s, error: "GPS not supported", loading: false }));
        }
      });
    }
  }, [handlePositionUpdate]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    // Dual-Strategy Step 2: Hand over to watchPosition ONLY AFTER initial lock (latitude !== null)
    if (state.status !== "Offline" && state.latitude !== null) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => handlePositionUpdate(pos, false),
        (err) => setState((s) => ({ ...s, error: "GPS Error", loading: false })),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 5000 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [state.status, state.latitude, handlePositionUpdate]);

  useEffect(() => {
    const analyticsId = setInterval(() => {
      const cur = stateRef.current;
      if (cur.status !== "Offline") {
        if (cur.status === "Ngetem" && cur.latitude) {
          recordActiveMinute().catch(console.error);
        }
        updateDriverStatus(cur.status, cur.latitude || undefined, cur.longitude || undefined).catch(() => {});
      }

      if (cur.status !== "Offline" && cur.timestamp) {
        const now = Date.now();
        const idleTime = now - cur.timestamp;
        if (idleTime > 60 * 60 * 1000) {
          console.log("Idle auto-offline triggered");
          const supabase = createClient();
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
               updateDriverStatus("Offline", cur.latitude || undefined, cur.longitude || undefined).then(() => {
                 setState(s => ({ ...s, status: "Offline" }));
               });
            }
          });
        }
      }
    }, 60 * 1000);

    return () => clearInterval(analyticsId);
  }, []);

  const value: LocationState = {
    ...state,
    setStatus: (newStatus: string) => {
      setState(s => ({ ...s, status: newStatus }));
      const current = stateRef.current;
      updateDriverStatus(newStatus, current.latitude || undefined, current.longitude || undefined)
        .catch(console.error);

      if (newStatus !== "Offline") {
        if (current.status === "Offline") {
          refreshLocation();
        }
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    },
    refreshLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) throw new Error("useLocation must be used within a LocationProvider");
  return context;
}
