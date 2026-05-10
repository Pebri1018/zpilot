"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Circle } from "react-leaflet";
import L from "leaflet";
import { RadarMarker } from "@/app/radar/page";
import { useLanguage } from "@/context/LanguageContext";

import { HotspotZone } from "@/app/actions/hotspot";

type RadarMapProps = {
  latitude: number | null;
  longitude: number | null;
  markers?: RadarMarker[];
  hotspots?: HotspotZone[];
};

function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function RadarMap({ latitude, longitude, markers = [], hotspots = [] }: RadarMapProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-[#f0f0f0] rounded-[2.5rem]"></div>;

  const defaultCenter: [number, number] = [-7.7680, 110.3950];
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;

  const getMarkerColor = (type: RadarMarker["type"]) => {
    switch (type) {
      case "driver_ngetem": return { color: "#3B82F6", fill: "#3B82F6" }; 
      case "driver_antar": return { color: "#9CA3AF", fill: "#9CA3AF" };  
      case "merchant_high": return { color: "#EF4444", fill: "#EF4444" }; 
      case "merchant_med": return { color: "#F97316", fill: "#F97316" };  
      case "merchant_low": return { color: "#10B981", fill: "#10B981" };  
      case "spot": return { color: "#8B5CF6", fill: "#8B5CF6" };          
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

        {/* Render Hotspot Zones behind markers */}
        {hotspots.map((h) => {
          let color = "#9CA3AF"; // Gray (Sepi)
          if (h.label === "RAMAI") color = "#EF4444"; // Red
          else if (h.label === "MENARIK") color = "#F97316"; // Orange

          return (
            <Circle
              key={`hs-${h.id}`}
              center={[h.lat, h.lng]}
              radius={800} // 800 meters
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.15,
                weight: 1
              }}
            />
          );
        })}
        
        {markers.map((m) => {
          const colors = getMarkerColor(m.type);
          const isMerchant = m.type.startsWith("merchant");
          
          return (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={isMerchant ? 9 : 5}
              pathOptions={{ 
                color: colors.color, 
                fillColor: colors.fill, 
                fillOpacity: 0.8, 
                weight: isMerchant ? 3 : 2 
              }}
            >
              <Popup className="radar-popup">
                <div className="min-w-[120px] p-1">
                  <p className="text-[0.9rem] font-black text-neutral-900 leading-tight mb-1">{m.label}</p>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className={`w-2 h-2 rounded-full ${colors.color.replace("#", "bg-[#") + "]"}`} style={{ backgroundColor: colors.color }} />
                    <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-wider">
                      {m.type.replace("merchant_", "").replace("driver_", "").replace("_", " ")}
                    </span>
                  </div>
                  
                  {isMerchant && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-900 text-white rounded-xl text-[0.7rem] font-bold active:scale-95 transition-all shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {t("navigate")}
                    </a>
                  )}
                </div>
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

      <style jsx global>{`
        .radar-popup .leaflet-popup-content-wrapper {
          border-radius: 1.25rem;
          padding: 4px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
        .radar-popup .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
    </div>
  );
}
