"use client";

import { useEffect, useState, useMemo, memo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { RadarMarker } from "@/app/radar/page";
import { useLanguage } from "@/context/LanguageContext";

import { HotspotZone } from "@/app/actions/hotspot";

type RadarMapProps = {
  latitude: number | null;
  longitude: number | null;
  markers?: RadarMarker[];
  hotspots?: HotspotZone[];
  isAdmin?: boolean;
};

const MemoizedMarker = memo(({ m, zoom, isAdmin }: { m: RadarMarker, zoom: number, isAdmin: boolean }) => {
  const getMarkerColor = (type: RadarMarker["type"]) => {
    switch (type) {
      case "merchant_gacor": return { color: "#EF4444", fill: "#EF4444" }; 
      case "merchant_lumayan": return { color: "#F59E0B", fill: "#F59E0B" }; 
      case "merchant_sepi": return { color: "#3B82F6", fill: "#3B82F6" };  
      case "merchant_tutup": return { color: "#1F2937", fill: "#111827" };
      case "driver_ngetem": return { color: "#6B7280", fill: "#6B7280" }; 
      case "driver_antar": return { color: "#9CA3AF", fill: "#9CA3AF" }; 
      case "seller": return { color: "#8B5CF6", fill: "#8B5CF6" }; 
      case "spot": return { color: "#10B981", fill: "#10B981" };          
      default: return { color: "#000", fill: "#000" };
    }
  };

  const colors = getMarkerColor(m.type);
  const getPinSize = (type: string) => {
    switch(type) {
      case "merchant_gacor": return 15;
      case "merchant_lumayan": return 11;
      case "merchant_sepi": return 7;
      case "driver_ngetem": return 8;
      case "driver_antar": return 8;
      default: return 9;
    }
  };
  const size = getPinSize(m.type);
  const showLabel = !m.type.startsWith("driver_") && zoom >= 15;

  const pinIcon = useMemo(() => L.divIcon({
    className: "bg-transparent",
    html: `<div style="display: flex; align-items: center; gap: 4px; transform: translate(-${size/2}px, -${size/2}px);">
            <div style="width: ${size}px; height: ${size}px; background-color: ${colors.fill}; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.3); flex-shrink:0;"></div>
            ${showLabel ? `<span style="font-size: 9px; font-weight: 800; color: #111; white-space: nowrap; text-shadow: 0 0 3px #fff, 0 0 3px #fff;">${m.label.length > 15 ? m.label.slice(0, 14) + '...' : m.label}</span>` : ''}
          </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -10]
  }), [size, colors.fill, showLabel, m.label]);

  return (
    <Marker position={[m.lat, m.lng]} icon={pinIcon}>
      <Popup className="radar-popup">
        <div className="min-w-[150px] p-1">
          <p className="text-[0.9rem] font-black text-neutral-900 leading-tight mb-1">
            {m.type.startsWith("driver_") ? (isAdmin ? m.label : `Driver #${m.id.slice(0, 6)}`) : m.label}
          </p>
          <div className="flex flex-col gap-0.5 mb-2">
            <div className="px-1.5 py-0.5 rounded-md text-[0.5rem] font-black uppercase tracking-wider text-white w-fit" style={{ backgroundColor: colors.color }}>
              {m.live_status || m.type.replace("driver_", "").replace("_", " ")}
            </div>
            {m.antar_nearby !== undefined && <p className="text-[0.6rem] font-medium text-neutral-600">Antar dekat: <b>{m.antar_nearby}</b></p>}
            {m.ngetem_nearby !== undefined && <p className="text-[0.6rem] font-medium text-neutral-600">Ngetem dekat: <b>{m.ngetem_nearby}</b></p>}
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-neutral-900 text-white rounded-xl text-[0.65rem] font-black active:scale-95 transition-all shadow-sm"
          >
            Navigasi Gmaps
          </a>
        </div>
      </Popup>
    </Marker>
  );
});

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
      className="absolute bottom-[calc(14rem+env(safe-area-inset-bottom))] right-3 z-[1000] bg-white text-neutral-900 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] active:scale-90 transition-transform border border-neutral-100 flex items-center justify-center"
      aria-label="My Location"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
    </button>
  );
}

export default function RadarMap({ latitude, longitude, markers = [], hotspots = [], isAdmin = false }: RadarMapProps) {
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

  const center: [number, number] = latitude && longitude ? [latitude, longitude] : [-7.7680, 110.3950];

  const selfIcon = L.divIcon({
    className: "self-marker",
    html: `<div style="width: 14px; height: 14px; background: #2d5af1; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
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
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <ZoomTracker />

        {hotspots.map((h) => {
          let color = "#6B7280"; 
          if (h.label === "PELUANG EMAS") color = "#2563EB"; 
          else if (h.label === "BAGUS SEKARANG") color = "#1D4ED8"; 
          else if (h.label === "KOMPETITIF") color = "#F97316"; 
          else if (h.label === "JEBAKAN KERUMUNAN") color = "#EF4444";

          return (
            <Circle
              key={`hs-${h.id}`}
              center={[h.lat, h.lng]}
              radius={800}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 1 }}
            />
          );
        })}
        
        {markers.filter(m => !m.type.startsWith("driver_")).map((m) => (
          <MemoizedMarker key={m.id} m={m} zoom={zoom} isAdmin={isAdmin} />
        ))}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          disableClusteringAtZoom={18}
          showCoverageOnHover={false}
        >
          {markers.filter(m => m.type.startsWith("driver_")).map((m) => (
            <MemoizedMarker key={m.id} m={m} zoom={zoom} isAdmin={isAdmin} />
          ))}
        </MarkerClusterGroup>

        {latitude && longitude && (
          <>
            <Marker position={[latitude, longitude]} icon={selfIcon} />
            <RecenterAutomatically lat={latitude} lng={longitude} />
          </>
        )}
        <MyLocationButton lat={latitude} lng={longitude} />
      </MapContainer>

      <style jsx global>{`
        .radar-popup .leaflet-popup-content-wrapper { border-radius: 1.25rem; padding: 4px; }
        .radar-popup .leaflet-popup-tip-container { display: none; }
        .marker-cluster-small { background-color: rgba(181, 226, 140, 0.6); }
        .marker-cluster-small div { background-color: rgba(110, 204, 57, 0.6); }
        .marker-cluster-medium { background-color: rgba(241, 211, 87, 0.6); }
        .marker-cluster-medium div { background-color: rgba(240, 194, 12, 0.6); }
        .marker-cluster-large { background-color: rgba(253, 156, 115, 0.6); }
        .marker-cluster-large div { background-color: rgba(241, 128, 23, 0.6); }
        .marker-cluster { background-clip: padding-box; border-radius: 20px; }
        .marker-cluster div { width: 30px; height: 30px; margin-left: 5px; margin-top: 5px; text-align: center; border-radius: 15px; font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif; }
        .marker-cluster span { line-height: 30px; }
      `}</style>
    </div>
  );
}
