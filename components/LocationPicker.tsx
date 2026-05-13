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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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



      <p className="text-[0.7rem] text-neutral-400 text-center font-medium">Ketuk peta atau geser pin untuk set lokasi presisi</p>
    </div>
  );
}
