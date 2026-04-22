"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, ThumbsUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

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

interface IssueCardProps {
  issue: Issue;
  onSupport: () => void;
}

// ✅ BASE URL (works in local + production)
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Clock size={16} className="text-yellow-500" />;
    case "VERIFIED":
      return <CheckCircle size={16} className="text-blue-500" />;
    case "RESOLVED":
      return <CheckCircle size={16} className="text-green-500" />;
    default:
      return <XCircle size={16} className="text-red-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    case "VERIFIED":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "RESOLVED":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    default:
      return "bg-red-500/20 text-red-700 border-red-500/30";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return "bg-red-500/20 text-red-700";
    case "MEDIUM":
      return "bg-yellow-500/20 text-yellow-700";
    default:
      return "bg-green-500/20 text-green-700";
  }
};

const getCategoryDisplay = (category: string) => {
  const categoryMap: { [key: string]: string } = {
    ROADS: "Roads & Transport",
    GARBAGE: "Waste & Garbage",
    ELECTRICITY: "Electricity",
    WATER: "Water Management",
    OTHER: "Other Issues",
  };
  return categoryMap[category] || category;
};

export default function IssueCard({ issue, onSupport }: IssueCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isSupporting, setIsSupporting] = useState(false);

  const handleSupport = async () => {
    setIsSupporting(true);
    try {
      await onSupport();
    } finally {
      setIsSupporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass p-6 cursor-pointer group hover:shadow-glow transition-all duration-300"
    >
      {/* Image */}
      {issue.media && issue.media.length > 0 && !imageError ? (
        <div className="w-full h-32 rounded-lg overflow-hidden mb-4 bg-slate-100">
          <img
            src={`${BASE_URL}${issue.media[0]}`} // ✅ FIXED
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-primary/60" />
        </div>
      )}

      {/* Category + Priority */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
          {getCategoryDisplay(issue.category)}
        </span>
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${getPriorityColor(issue.priority)}`}>
          {issue.priority}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {issue.title}
      </h3>

      {/* Description */}
      <p className="text-foreground/70 text-sm mb-4 line-clamp-3">
        {issue.description}
      </p>

      {/* Status + Distance */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
          {getStatusIcon(issue.status)}
          {issue.status}
        </div>

        {issue.distance !== undefined && (
          <div className="flex items-center gap-1 text-xs text-foreground/60">
            <MapPin size={12} />
            {issue.distance < 1
              ? `${(issue.distance * 1000).toFixed(0)}m`
              : `${issue.distance.toFixed(1)}km`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-foreground/60">
          <div className="flex items-center gap-1">
            <ThumbsUp size={12} />
            {issue.votes || 0}
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {formatDate(issue.createdAt)}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSupport();
          }}
          disabled={isSupporting}
          className="flex items-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          <ThumbsUp size={14} className={isSupporting ? "animate-pulse" : ""} />
          {isSupporting ? "Supporting..." : "Support"}
        </button>
      </div>
    </motion.div>
  );
}
