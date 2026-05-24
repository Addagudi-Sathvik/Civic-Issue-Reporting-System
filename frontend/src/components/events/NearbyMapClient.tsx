"use client";

import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: string;
  votes: number;
  priority: string;
  createdAt: string;
  media?: string[];
  distance?: number;
}

interface NearbyMapProps {
  issues: Issue[];
  userLocation: { lat: number; lng: number; address: string } | null;
}

const getMarkerColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '#f59e0b'; // yellow
    case 'VERIFIED':
      return '#3b82f6'; // blue
    case 'RESOLVED':
      return '#10b981'; // green
    default:
      return '#ef4444'; // red
  }
};

const getCategoryIcon = (category: string) => {
  // Simple text-based icons for different categories
  const icons: { [key: string]: string } = {
    'ROADS': '🛣️',
    'GARBAGE': '🗑️',
    'ELECTRICITY': '⚡',
    'WATER': '💧',
    'OTHER': '📍'
  };
  return icons[category] || '📍';
};

// Create custom icons dynamically using L.divIcon
const createCustomIcon = (status: string, category: string) => {
  const color = getMarkerColor(status);
  const icon = getCategoryIcon(category);
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: white;">${icon}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function NearbyMapClient({ issues, userLocation }: NearbyMapProps) {
  const center: L.LatLngExpression = userLocation ? [userLocation.lat, userLocation.lng] : [17.3850, 78.4867];

  return (
    <div className="w-full glass p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MapPin size={20} />
          Nearby Issues Map
        </h3>
        <div className="text-sm text-foreground/60">
          {issues.length} issues found
        </div>
      </div>

      <div className="w-full h-[400px] rounded-2xl overflow-hidden glass border border-slate-200 shadow-inner relative z-0">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
               <Popup>Your Location</Popup>
            </Marker>
          )}

          {/* Issue markers */}
          {issues.map((issue) => (
            <Marker
              key={issue._id}
              position={[issue.location.lat, issue.location.lng]}
              icon={createCustomIcon(issue.status, issue.category)}
            >
              <Popup>
                <div className="p-1 max-w-xs">
                  <h4 className="font-bold text-foreground mb-1">{issue.title}</h4>
                  <p className="text-sm text-foreground/70 mb-2 line-clamp-2">
                    {issue.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      issue.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-700' :
                      issue.status === 'VERIFIED' ? 'bg-blue-500/20 text-blue-700' :
                      issue.status === 'RESOLVED' ? 'bg-green-500/20 text-green-700' :
                      'bg-red-500/20 text-red-700'
                    }`}>
                      {issue.status}
                    </span>
                    {issue.distance !== undefined && (
                      <span className="text-foreground/60 ml-2">
                        {issue.distance < 1
                          ? `${(issue.distance * 1000).toFixed(0)}m away`
                          : `${issue.distance.toFixed(1)}km away`
                        }
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full text-white"></div>
          <span className="text-foreground/70">Your Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-foreground/70">Pending Issues</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-foreground/70">Verified Issues</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-foreground/70">Resolved Issues</span>
        </div>
      </div>
    </div>
  );
}
