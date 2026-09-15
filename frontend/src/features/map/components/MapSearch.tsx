"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Route, Building2, AlertTriangle, X, Loader2 } from "lucide-react";
import { SearchService } from "../services/searchService";
import { MapSearchItem } from "../types/mapTypes";

interface MapSearchProps {
  onSelectResult: (result: MapSearchItem) => void;
  className?: string;
}

const RESULT_ICON_MAP: Record<string, React.ReactNode> = {
  PLACE: <MapPin className="w-3.5 h-3.5 text-blue-400" />,
  DISTRICT: <MapPin className="w-3.5 h-3.5 text-indigo-400" />,
  ROAD: <Route className="w-3.5 h-3.5 text-emerald-400" />,
  INFRASTRUCTURE: <Building2 className="w-3.5 h-3.5 text-purple-400" />,
  INCIDENT: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
};

export const MapSearch: React.FC<MapSearchProps> = ({
  onSelectResult,
  className = "",
}) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<MapSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await SearchService.searchLocations(query);
      setResults(res);
      setIsSearching(false);
      setIsOpen(res.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (item: MapSearchItem) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelectResult(item);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, NH corridors, districts, hospitals..."
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 text-xs text-white placeholder-slate-400 shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
        />

        {isSearching ? (
          <Loader2 className="absolute right-3.5 w-4 h-4 text-blue-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Suggestions Popover */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-12 left-0 right-0 z-50 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in">
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-2.5 flex items-start gap-3 text-left hover:bg-slate-900 border-b border-slate-900 last:border-0 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                {RESULT_ICON_MAP[item.type] || <MapPin className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {item.name}
                </div>
                {item.subtitle && (
                  <div className="text-[10px] text-slate-400 truncate">
                    {item.subtitle}
                  </div>
                )}
              </div>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                {item.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
