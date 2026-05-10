"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { ActiveDriver } from "@/app/radar/page";
import { MerchantSignal } from "@/app/admin/actions/signals";

type RadarMapProps = {
  latitude: number | null;
  longitude: number | null;
  activeDrivers?: ActiveDriver[];
  merchants?: MerchantSignal[];
  ngetemSpots?: any[];
};

// Component to dynamically center map when coords change
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function RadarMap({ latitude, longitude, activeDrivers = [], merchants = [], ngetemSpots = [] }: RadarMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid SSR rendering for leaflet
  if (!mounted) {
    return <div className="h-full w-full bg-[#e2e8f0] animate-pulse rounded-[1.25rem]"></div>;
  }

  // Default coordinate if no location (e.g. Yogyakarta center)
  const defaultCenter: [number, number] = [-7.7680, 110.3950]; // Near Seturan
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;

  const customMarkerIcon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; background: rgba(37, 99, 235, 0.25); filter: blur(3px); border-radius: 50%;"></div>
        <div style="position: relative; width: 16px; height: 16px; background: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10]
  });

  return (
    <div className="absolute inset-0 rounded-[1.25rem] overflow-hidden" style={{ isolation: 'isolate' }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={true} 
        zoomControl={false}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render Other Active Drivers */}
        {activeDrivers
          .filter(driver => driver.status !== "offline")
          .map((driver) => {
            const color = driver.status === "ngetem" ? "#2563eb" : "#6b7280";
            return (
              <CircleMarker
                key={driver.user_id}
                center={[driver.latitude, driver.longitude]}
                radius={6}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
              />
            );
          })}

        {/* Render Merchants */}
        {merchants.map((merchant) => {
          if (!merchant.lat || !merchant.lng) return null;
          let color = "#10b981"; // green for low
          if (merchant.busy_score >= 4) color = "#ef4444"; // red for busy
          else if (merchant.busy_score >= 2) color = "#f59e0b"; // yellow for medium
          
          return (
            <CircleMarker
              key={merchant.id}
              center={[merchant.lat, merchant.lng]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">{merchant.name}</div>
                  <div className="text-gray-600">{merchant.category}</div>
                  {merchant.rating && <div>⭐ {merchant.rating}</div>}
                  <div>Busy: {merchant.busy_level}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Render Ngetem Spots */}
        {ngetemSpots.map((spot) => {
          if (!spot.lat || !spot.lng) return null;
          return (
            <CircleMarker
              key={spot.id}
              center={[spot.lat, spot.lng]}
              radius={7}
              pathOptions={{ color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">{spot.name}</div>
                  <div className="text-gray-600">Spot Ngetem</div>
                  <div>Kualitas: {spot.quality}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Render Self Location */}
        {latitude && longitude && (
          <>
            <Marker position={[latitude, longitude]} icon={customMarkerIcon}>
              <Popup className="font-sans">
                <div className="text-center font-semibold text-neutral-900 text-sm">Lokasi Saya</div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </div>
              </Popup>
            </Marker>
            <RecenterAutomatically lat={latitude} lng={longitude} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
