"use client";

import { motion } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";

interface Filters {
  category: string;
  status: string;
  radius: number;
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const categories = [
  { value: "ALL", label: "All Categories" },
  { value: "ROADS", label: "Roads & Transport" },
  { value: "GARBAGE", label: "Waste & Garbage" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "WATER", label: "Water Management" },
  { value: "OTHER", label: "Other Issues" },
];

const statuses = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "RESOLVED", label: "Resolved" },
];

const radiusOptions = [
  { value: 1, label: "1 km" },
  { value: 3, label: "3 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
];

export default function FilterBar({ filters, onFiltersChange, searchQuery, onSearchChange }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Filter size={20} />
          Filters
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          {showFilters ? <X size={20} /> : <Filter size={20} />}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full glass-input pl-10 py-3 text-sm"
        />
      </div>

      {/* Filters - Desktop */}
      <div className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* Category */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full glass-input py-2 text-sm"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full glass-input py-2 text-sm"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Radius */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-2">Search Radius</label>
          <div className="flex gap-2">
            {radiusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter('radius', option.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filters.radius === option.value
                    ? 'bg-primary text-white'
                    : 'bg-white/20 hover:bg-white/30 text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            onFiltersChange({
              category: "ALL",
              status: "ALL",
              radius: 3,
            });
            onSearchChange("");
          }}
          className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-600 text-sm font-medium rounded-lg transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </motion.div>
  );
}