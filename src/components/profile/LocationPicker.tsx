"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiNavigation, FiSearch, FiLoader } from "react-icons/fi";

// Fix Leaflet's default icon path issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Default center: Tehran, Iran
const DEFAULT_CENTER: [number, number] = [35.6892, 51.389];
const DEFAULT_ZOOM = 12;

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number }) => void;
}) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    value ? [value.lat, value.lng] : null
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setMarkerPos([lat, lng]);
      onChange({ lat, lng });
    },
    [onChange]
  );

  // Geolocate user
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarkerPos([lat, lng]);
        setFlyTarget([lat, lng]);
        onChange({ lat, lng });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Search via Nominatim (free geocoding)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMarkerPos([lat, lng]);
        setFlyTarget([lat, lng]);
        onChange({ lat, lng });
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  const center: [number, number] = markerPos || DEFAULT_CENTER;

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar + geolocate */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="جستجوی آدرس یا مکان..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-500/40 focus:bg-white/8"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white cursor-pointer"
          >
            {searching ? (
              <FiLoader className="animate-spin text-sm" />
            ) : (
              <FiSearch className="text-sm" />
            )}
          </button>
        </div>

        <button
          onClick={handleGeolocate}
          disabled={locating}
          className="flex h-[46px] items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
          title="موقعیت فعلی من"
        >
          {locating ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FiNavigation />
          )}
          <span className="hidden sm:inline">موقعیت من</span>
        </button>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-xl">
        <MapContainer
          center={center}
          zoom={markerPos ? 16 : DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ height: "350px", width: "100%" }}
          className="z-0"
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          <FlyToLocation position={flyTarget} />
          {markerPos && <Marker position={markerPos} icon={customIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-white/30 text-center">
        روی نقشه کلیک کنید تا موقعیت مکانی انتخاب شود
      </p>
    </div>
  );
}
