"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  initialLat: number | null;
  initialLng: number | null;
  onLocationSelect: (lat: number, lng: number, address: string, area: string) => void;
};

type SearchResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    village?: string;
    town?: string;
    city?: string;
  };
};

function MyLocationButton({ onLocate }: { onLocate: () => void }) {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onLocate();
      }}
      className="absolute bottom-4 right-4 z-[1000] bg-white text-blue-600 p-2.5 rounded-full shadow-lg active:scale-90 transition-transform border border-neutral-100 flex items-center justify-center"
      aria-label="My Location"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
    </button>
  );
}

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

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 17));
  }, [lat, lng, map]);
  return null;
}

function DraggableMarker({ lat, lng, onDragEnd }: { lat: number; lng: number; onDragEnd: (lat: number, lng: number) => void }) {
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
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // If we have initial coords, reverse-geocode them immediately
    if (initialLat && initialLng) {
      reverseGeocode(initialLat, initialLng);
    }
  }, []); // Only on mount

  useEffect(() => {
    if (isMounted && initialLat !== null && initialLng !== null) {
      if (initialLat !== position.lat || initialLng !== position.lng) {
        setPosition({ lat: initialLat, lng: initialLng });
        reverseGeocode(initialLat, initialLng);
      }
    }
  }, [initialLat, initialLng, isMounted]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=id`,
        { headers: { "Accept-Language": "id" } }
      );
      const data = await res.json();
      const area =
        data.address?.neighbourhood ||
        data.address?.suburb ||
        data.address?.city_district ||
        data.address?.village ||
        data.address?.town ||
        "Unknown Area";
      const address = data.display_name || "";
      setCurrentAddress(address.split(",").slice(0, 3).join(", "));
      onLocationSelect(lat, lng, address, area);
    } catch {
      onLocationSelect(lat, lng, "Custom location", "Unknown Area");
    }
  }, [onLocationSelect]);

  const handleLocationUpdate = useCallback(async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Live search with debounce — scoped to Indonesia
  const handleSearchInput = (value: string) => {
    setSearch(value);
    setShowSuggestions(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=id&limit=5&accept-language=id&addressdetails=1`,
          { headers: { "Accept-Language": "id" } }
        );
        const data: SearchResult[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSelectSuggestion = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSearch(result.display_name.split(",").slice(0, 2).join(", "));
    setShowSuggestions(false);
    handleLocationUpdate(lat, lng);
  };

  if (!isMounted) return <div className="h-[280px] w-full bg-neutral-100 animate-pulse rounded-2xl" />;

  return (
    <div className="space-y-3">
      {/* Search with live suggestions */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Cari nama resto, jalan, atau area..."
              className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-[0.9rem] focus:outline-none focus:border-neutral-400 pr-10"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Dropdown suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-2xl shadow-xl z-[9999] overflow-hidden">
            {suggestions.map((s) => {
              const parts = s.display_name.split(",");
              const primary = parts.slice(0, 2).join(",").trim();
              const secondary = parts.slice(2, 4).join(",").trim();
              return (
                <button
                  key={s.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition border-b border-neutral-50 last:border-0"
                >
                  <p className="text-[0.85rem] font-semibold text-neutral-900 truncate">{primary}</p>
                  {secondary && <p className="text-[0.72rem] text-neutral-400 truncate mt-0.5">{secondary}</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>
        {/* Map */}
      <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border border-neutral-100 relative z-0">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <LeafletIconFix />
          <RecenterMap lat={position.lat} lng={position.lng} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <DraggableMarker lat={position.lat} lng={position.lng} onDragEnd={handleLocationUpdate} />
          <MyLocationButton onLocate={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                handleLocationUpdate(pos.coords.latitude, pos.coords.longitude);
              });
            }
          }} />
        </MapContainer>
      </div>

      {/* Current selected address */}
      {currentAddress && (
        <p className="text-[0.72rem] text-neutral-500 font-medium px-1 truncate">
          <span className="font-bold text-neutral-400">Pin:</span> {currentAddress}
        </p>
      )}

      {/* Quick navigate buttons */}
      <div className="flex gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 text-white rounded-xl text-[0.75rem] font-bold"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          Google Maps
        </a>
        <a
          href={`https://waze.com/ul?ll=${position.lat},${position.lng}&navigate=yes`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#05C8F7] text-white rounded-xl text-[0.75rem] font-bold"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14.93V15a1 1 0 00-2 0v1.93A8.001 8.001 0 014.07 9H6a1 1 0 000-2H4.07A8.001 8.001 0 0111 3.07V5a1 1 0 002 0V3.07A8.001 8.001 0 0119.93 9H18a1 1 0 000 2h1.93A8.001 8.001 0 0113 16.93z"/></svg>
          Waze
        </a>
      </div>

      <p className="text-[0.7rem] text-neutral-400 text-center font-medium">Ketuk peta atau geser pin untuk set lokasi presisi</p>
    </div>
  );
}
