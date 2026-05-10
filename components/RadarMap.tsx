"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { ActiveDriver } from "@/app/radar/page";

type RadarMapProps = {
  latitude: number | null;
  longitude: number | null;
  activeDrivers?: ActiveDriver[];
};

// Component to dynamically center map when coords change
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function RadarMap({ latitude, longitude, activeDrivers = [] }: RadarMapProps) {
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
        
        {/* Render Other Active Drivers as small orange dots */}
        {activeDrivers.map((driver) => (
          <CircleMarker
            key={driver.user_id}
            center={[driver.latitude, driver.longitude]}
            radius={5}
            pathOptions={{ color: "#ea580c", fillColor: "#f97316", fillOpacity: 0.85, weight: 2 }}
          />
        ))}

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
