"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RequestPreviewMapProps {
  location: { lat: number; lng: number };
}

export default function RequestPreviewMap({ location }: RequestPreviewMapProps) {
  const center: [number, number] = [location.lat, location.lng];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 shadow-xl h-[250px] w-full z-0">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center} icon={customIcon} />
      </MapContainer>
    </div>
  );
}
