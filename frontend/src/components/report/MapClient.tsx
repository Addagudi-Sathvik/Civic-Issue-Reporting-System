"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icon issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

function LocationMarker({ position, setPosition, onLocationSelect }: any) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect(e.latlng.lat, e.latlng.lng, `Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true} 
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition(pos);
          onLocationSelect(pos.lat, pos.lng, `Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)}`);
        }
      }}
    />
  );
}

export default function MapClient({ onLocationSelect }: MapComponentProps) {
  const [center, setCenter] = useState<L.LatLngExpression>([17.3850, 78.4867]); // Default Hyderabad
  const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(L.latLng(17.3850, 78.4867));

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = L.latLng(position.coords.latitude, position.coords.longitude);
          setCenter(newPos);
          setMarkerPosition(newPos);
          onLocationSelect(newPos.lat, newPos.lng, "GPS Location Auto-Detected");
        },
        () => alert("Location access denied or failed.")
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <button 
        type="button"
        onClick={handleUseMyLocation}
        className="self-start flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-all border border-primary/20"
      >
        <Navigation size={16} /> Use My Current Location
      </button>

      <div className="w-full h-[300px] rounded-2xl overflow-hidden glass border border-slate-200 shadow-inner relative z-0">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={markerPosition} setPosition={setMarkerPosition} onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>
    </div>
  );
}
