"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from "react-leaflet";
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

function MyLocationButton({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  if (!lat || !lng) return null;
  
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        map.flyTo([lat, lng], 16);
      }}
      className="absolute bottom-6 right-6 z-[1000] bg-white text-blue-600 p-3 rounded-full shadow-lg active:scale-90 transition-transform border border-neutral-100 flex items-center justify-center"
      aria-label="My Location"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
    </button>
  );
}

export default function RadarMap({ latitude, longitude, markers = [], hotspots = [] }: RadarMapProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(16);

  function ZoomTracker() {
    useMapEvents({
      zoomend: (e) => setZoom(e.target.getZoom()),
    });
    return null;
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-[#f0f0f0] rounded-[2.5rem]"></div>;

  const defaultCenter: [number, number] = [-7.7680, 110.3950];
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;

  const getMarkerColor = (type: RadarMarker["type"]) => {
    switch (type) {
      case "driver_ngetem": return { color: "#4F46E5", fill: "#4F46E5" }; // Indigo 600
      case "driver_antar": return { color: "#EC4899", fill: "#EC4899" };  // Pink 500
      case "merchant_sangatsibuk": return { color: "#991B1B", fill: "#991B1B" }; 
      case "merchant_ramai": return { color: "#EF4444", fill: "#EF4444" }; 
      case "merchant_mulaipanas": return { color: "#F97316", fill: "#F97316" }; 
      case "merchant_bergerak": return { color: "#3B82F6", fill: "#3B82F6" };  
      case "merchant_sepi": return { color: "#9CA3AF", fill: "#9CA3AF" };  
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

        <ZoomTracker />

        {/* Render Hotspot Zones behind markers */}
        {hotspots.map((h) => {
          let color = "#9CA3AF"; // Gray (Sepi)
          if (h.label === "KOMPETISI") color = "#991B1B"; // Red-800
          else if (h.label === "RAMAI") color = "#EF4444"; // Red
          else if (h.label === "MENARIK") color = "#F97316"; // Orange
          else if (h.label === "PELUANG") color = "#10B981"; // Emerald-500

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
          
            // Pin size by priority (px)
            const getPinSize = (type: string) => {
              switch(type) {
                case "merchant_sangatsibuk": return 15;
                case "merchant_ramai": return 13;
                case "merchant_mulaipanas": return 11;
                case "merchant_bergerak": return 9;
                case "merchant_sepi": return 7;
                case "driver_ngetem": return 13;
                case "driver_antar": return 10;
                case "spot": return 10;
                default: return 10;
              }
            };
            const size = getPinSize(m.type);
            const showLabel = !m.type.startsWith("driver_") && zoom >= 14;

            const pinIcon = L.divIcon({
            className: "bg-transparent",
            html: `<div style="display: flex; align-items: center; gap: 4px; transform: translate(-${size/2}px, -${size/2}px); cursor: pointer;">
                    <div style="width: ${size}px; height: ${size}px; background-color: ${colors.fill}; border: 2.5px solid rgba(255,255,255,0.95); border-radius: 50%; box-shadow: 0 1px 5px rgba(0,0,0,0.4), 0 0 0 1px ${colors.fill}; flex-shrink:0;"></div>
                    ${showLabel ? `<span style="font-size: 9px; font-weight: 900; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; text-shadow: 0 0 4px #fff, 0 0 4px #fff, 0 0 4px #fff;">${m.label.length > 16 ? m.label.slice(0, 15) + '\u2026' : m.label}</span>` : ''}
                  </div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -10]
          });
          
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={pinIcon}
            >
              <Popup className="radar-popup">
                <div className="min-w-[150px] p-1">
                  <p className="text-[0.95rem] font-black text-neutral-900 leading-tight mb-1.5">{m.label}</p>
                  
                  {m.type.startsWith("merchant_") ? (
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="px-2 py-0.5 rounded-md text-[0.6rem] font-black uppercase tracking-wider text-white w-fit" style={{ backgroundColor: colors.color }}>
                        {m.live_status || "Merchant"}
                      </div>
                      <p className="text-[0.65rem] font-medium text-neutral-600 mt-1">Driver Antar dekat: <b>{m.antar_nearby || 0}</b></p>
                      <p className="text-[0.65rem] font-medium text-neutral-600">Driver Ngetem dekat: <b>{m.ngetem_nearby || 0}</b></p>
                      <p className="text-[0.65rem] font-medium text-neutral-600">Promo: <b>{m.promo_active ? "Ya" : "Tidak"}</b></p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="px-2 py-0.5 rounded-md text-[0.6rem] font-black uppercase tracking-wider text-white" style={{ backgroundColor: colors.color }}>
                        {m.type.replace("driver_", "").replace("_", " ")}
                      </div>
                    </div>
                  )}
                  
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
                </div>
              </Popup>
            </Marker>
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
        <MyLocationButton lat={latitude} lng={longitude} />
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
