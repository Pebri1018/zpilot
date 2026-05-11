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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
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
              radius={isMerchant ? 12 : 7}
              pathOptions={{ 
                color: colors.color, 
                fillColor: colors.fill, 
                fillOpacity: 0.9, 
                weight: isMerchant ? 4 : 2 
              }}
            >
              <Popup className="radar-popup">
                <div className="min-w-[140px] p-1">
                  <p className="text-[0.95rem] font-black text-neutral-900 leading-tight mb-1.5">{m.label}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="px-2 py-0.5 rounded-md text-[0.6rem] font-black uppercase tracking-wider text-white" style={{ backgroundColor: colors.color }}>
                      {m.type.replace("merchant_", "").replace("driver_", "").replace("_", " ")}
                    </div>
                  </div>
                  
                  {isMerchant && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 text-white rounded-xl text-[0.72rem] font-bold active:scale-95 transition-all shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        Google Maps
                      </a>
                      <a
                        href={`https://waze.com/ul?ll=${m.lat},${m.lng}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#05C8F7] text-white rounded-xl text-[0.72rem] font-bold active:scale-95 transition-all shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14.93V15a1 1 0 00-2 0v1.93A8.001 8.001 0 014.07 9H6a1 1 0 000-2H4.07A8.001 8.001 0 0111 3.07V5a1 1 0 002 0V3.07A8.001 8.001 0 0119.93 9H18a1 1 0 000 2h1.93A8.001 8.001 0 0113 16.93z"/></svg>
                        Waze
                      </a>
                    </div>
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
