"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Filter, Navigation, AlertCircle, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import IssueCard from "@/components/events/IssueCard";
import FilterBar from "@/components/events/FilterBar";
import NearbyMap from "@/components/events/NearbyMap";

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

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export default function NearbyIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [filters, setFilters] = useState({
    category: "ALL",
    status: "ALL",
    radius: 3,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch nearby issues when location is available
  useEffect(() => {
    if (!location) return;

    const fetchNearbyIssues = async () => {
      try {
        setLoading(true);
        const response = await api.post("/issues/nearby", {
          lat: location.lat,
          lng: location.lng,
          category: filters.category !== "ALL" ? filters.category : undefined,
          radiusKm: filters.radius,
        });

        const issuesWithDistance = response.data
          .filter((issue: Issue) => {
            if (filters.status !== "ALL" && issue.status !== filters.status) return false;
            return true;
          })
          .map((issue: Issue) => ({
            ...issue,
            distance: calculateDistance(location.lat, location.lng, issue.location.lat, issue.location.lng),
          }))
          .sort((a: Issue, b: Issue) => (a.distance || 0) - (b.distance || 0));

        setIssues(issuesWithDistance);
      } catch (error) {
        console.error("Failed to fetch nearby issues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyIssues();
  }, [location, filters]);

  const getUserLocation = () => {
    setLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Your Current Location",
        };
        setLocation(newLocation);
        setLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Location access denied. Please enable location permissions or enter manually.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleSupportIssue = async (issueId: string) => {
    try {
      await api.post(`/issues/${issueId}/vote`);
      // Update the local state
      setIssues(issues.map(issue =>
        issue._id === issueId
          ? { ...issue, votes: (issue.votes || 0) + 1 }
          : issue
      ));
    } catch (error) {
      console.error("Failed to support issue:", error);
    }
  };

  const filteredIssues = issues.filter(issue =>
    searchQuery === "" ||
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Nearby Issues</h1>
        <p className="text-foreground/60 text-lg">Discover and support civic issues in your area</p>
      </header>

      {/* Location Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${location ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="font-semibold text-foreground">
                {location ? "Location Detected" : "Location Required"}
              </p>
              <p className="text-sm text-foreground/60">
                {location ? location.address : locationError || "Getting your location..."}
              </p>
            </div>
          </div>
          <button
            onClick={getUserLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Location
          </button>
        </div>
      </motion.div>

      {/* Map and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <NearbyMap issues={filteredIssues} userLocation={location} />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </motion.div>
      </div>

      {/* Issues List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Issues Near You ({filteredIssues.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12 glass p-8">
            <AlertCircle size={48} className="text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Issues Found</h3>
            <p className="text-foreground/60">
              {location
                ? "No reported issues found in your area. Be the first to report!"
                : "Please enable location access to view nearby issues."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onSupport={() => handleSupportIssue(issue._id)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}