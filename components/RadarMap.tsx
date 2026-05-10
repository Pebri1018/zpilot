"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { RadarMarker } from "@/app/radar/page";

type RadarMapProps = {
  latitude: number | null;
  longitude: number | null;
  markers?: RadarMarker[];
};

function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function RadarMap({ latitude, longitude, markers = [] }: RadarMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-[#f0f0f0] rounded-[2.5rem]"></div>;

  const defaultCenter: [number, number] = [-7.7680, 110.3950];
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;

  const getMarkerColor = (type: RadarMarker["type"]) => {
    switch (type) {
      case "driver_ngetem": return { color: "#3B82F6", fill: "#3B82F6" }; // Blue
      case "driver_antar": return { color: "#9CA3AF", fill: "#9CA3AF" };  // Gray
      case "merchant_high": return { color: "#EF4444", fill: "#EF4444" }; // Red
      case "merchant_med": return { color: "#F97316", fill: "#F97316" };  // Orange
      case "merchant_low": return { color: "#10B981", fill: "#10B981" };  // Green
      case "spot": return { color: "#8B5CF6", fill: "#8B5CF6" };          // Purple
      default: return { color: "#000", fill: "#000" };
    }
  };

  const selfIcon = L.divIcon({
    className: "self-marker",
    html: `<div style="width: 14px; height: 14px; background: #000; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  return (
    <div className="absolute inset-0">
      <MapContainer 
        center={center} 
        zoom={16} 
        scrollWheelZoom={true} 
        zoomControl={false}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {markers.map((m) => {
          const colors = getMarkerColor(m.type);
          return (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={m.type.startsWith("merchant") ? 8 : 5}
              pathOptions={{ 
                color: colors.color, 
                fillColor: colors.fill, 
                fillOpacity: 0.8, 
                weight: m.type.startsWith("merchant") ? 3 : 2 
              }}
            >
              <Popup>
                <div className="text-[0.75rem] font-bold">{m.label}</div>
                <div className="text-[0.65rem] text-neutral-500 uppercase font-bold tracking-tighter mt-0.5">{m.type.replace("_", " ")}</div>
              </Popup>
            </CircleMarker>
          );
        })}

        {latitude && longitude && (
          <>
            <Marker position={[latitude, longitude]} icon={selfIcon}>
              <Popup>Lokasi Anda</Popup>
            </Marker>
            <RecenterAutomatically lat={latitude} lng={longitude} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
