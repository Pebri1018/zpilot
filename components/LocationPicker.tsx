"use client";

import { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  initialLat: number | null;
  initialLng: number | null;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
};

// Component to handle icon fix inside browser context
function LeafletIconFix() {
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);
  return null;
}

function DraggableMarker({ lat, lng, onDragEnd }: { lat: number; lng: number, onDragEnd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onDragEnd(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={[lat, lng]}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onDragEnd(position.lat, position.lng);
        },
      }}
    />
  );
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }: Props) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLat || -7.7680,
    lng: initialLng || 110.3950,
  });
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`);
      const data = await res.json();
      if (data && data[0]) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setPosition({ lat: newLat, lng: newLng });
        onLocationSelect(newLat, newLng, data[0].display_name);
      }
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setSearching(false);
    }
  };

  const handleDragEnd = useCallback(async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
      const data = await res.json();
      onLocationSelect(lat, lng, data.display_name || "Custom location");
    } catch (err) {
      onLocationSelect(lat, lng, "Custom location");
    }
  }, [onLocationSelect]);

  if (!isMounted) return <div className="h-[200px] w-full bg-neutral-100 animate-pulse rounded-2xl" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari alamat..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {searching ? "..." : "Cari"}
        </button>
      </div>

      <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-neutral-200 relative z-0">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <LeafletIconFix />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <DraggableMarker lat={position.lat} lng={position.lng} onDragEnd={handleDragEnd} />
        </MapContainer>
      </div>
    </div>
  );
}
