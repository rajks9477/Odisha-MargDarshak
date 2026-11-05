"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogisticsHub } from "../types/routingTypes";
import { routingApi } from "../api/routingApi";
import { searchOdishaLocations, OdishaLocation, ODISHA_LOCATIONS_DATABASE } from "../services/nerLocations";
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Compass,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  RotateCcw,
  Building,
  Check
} from "lucide-react";

interface Props {
  origin: string;
  destination: string;
  onOriginChange: (val: string, hub?: LogisticsHub) => void;
  onDestinationChange: (val: string, hub?: LogisticsHub) => void;
  onUseLiveGps: () => void;
  onCalculate: () => void;
  loading: boolean;
  priority: "ESSENTIAL_SAFETY" | "BALANCED_LOGISTICS" | "FASTEST_TRANSIT";
  onPriorityChange: (val: "ESSENTIAL_SAFETY" | "BALANCED_LOGISTICS" | "FASTEST_TRANSIT") => void;
}

export const LocationSearch: React.FC<Props> = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onUseLiveGps,
  onCalculate,
  loading,
  priority,
  onPriorityChange,
}) => {
  const [originSuggestions, setOriginSuggestions] = useState<OdishaLocation[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<OdishaLocation[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  const handleOriginType = (text: string) => {
    onOriginChange(text);
    if (text.length > 0) {
      setOriginSuggestions(searchOdishaLocations(text));
      setShowOriginDropdown(true);
    } else {
      setShowOriginDropdown(false);
    }
  };

  const handleDestType = (text: string) => {
    onDestinationChange(text);
    if (text.length > 0) {
      setDestSuggestions(searchOdishaLocations(text));
      setShowDestDropdown(true);
    } else {
      setShowDestDropdown(false);
    }
  };

  const selectOriginLoc = (loc: OdishaLocation) => {
    onOriginChange(`${loc.name}, ${loc.state}`, {
      id: loc.id,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      state: loc.state,
    });
    setShowOriginDropdown(false);
  };

  const selectDestLoc = (loc: OdishaLocation) => {
    onDestinationChange(`${loc.name}, ${loc.state}`, {
      id: loc.id,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      state: loc.state,
    });
    setShowDestDropdown(false);
  };

  const handleSwap = () => {
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
  };

  const handlePreset = (origName: string, destName: string) => {
    const origLoc = ODISHA_LOCATIONS_DATABASE.find((l) => l.name.toLowerCase().includes(origName.toLowerCase()) || l.district.toLowerCase().includes(origName.toLowerCase()));
    const destLoc = ODISHA_LOCATIONS_DATABASE.find((l) => l.name.toLowerCase().includes(destName.toLowerCase()) || l.district.toLowerCase().includes(destName.toLowerCase()));

    if (origLoc) {
      onOriginChange(`${origLoc.name}, ${origLoc.state}`, {
        id: origLoc.id,
        name: origLoc.name,
        latitude: origLoc.latitude,
        longitude: origLoc.longitude,
        state: origLoc.state,
      });
    } else {
      onOriginChange(origName);
    }

    if (destLoc) {
      onDestinationChange(`${destLoc.name}, ${destLoc.state}`, {
        id: destLoc.id,
        name: destLoc.name,
        latitude: destLoc.latitude,
        longitude: destLoc.longitude,
        state: destLoc.state,
      });
    } else {
      onDestinationChange(destName);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 font-sans text-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Google Maps-Style Route Navigator</h2>
            <p className="text-[11px] text-stone-500">Search any district, city, highway corridor or port across all 30 Odisha districts</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUseLiveGps}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>My Live GPS</span>
        </button>
      </div>

      {/* Inputs with Swap */}
      <div className="relative space-y-2">
        {/* Origin Input */}
        <div className="relative">
          <div className="absolute left-3 top-3 text-emerald-700 pointer-events-none">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-700 bg-white" />
          </div>
          <input
            ref={originInputRef}
            type="text"
            placeholder="Choose starting point or district..."
            value={origin}
            onChange={(e) => handleOriginType(e.target.value)}
            onFocus={() => {
              if (origin.length > 0) setOriginSuggestions(searchOdishaLocations(origin));
              else setOriginSuggestions(ODISHA_LOCATIONS_DATABASE.slice(0, 6));
              setShowOriginDropdown(true);
            }}
            className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50/70 border border-stone-200 focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 outline-none transition-all"
          />

          {showOriginDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1 animate-in fade-in">
              <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Select Origin Location:
              </div>
              {originSuggestions.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => selectOriginLoc(loc)}
                  className="w-full text-left p-2 rounded-lg hover:bg-stone-50 text-xs flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-stone-800 group-hover:text-emerald-800">
                      {loc.name}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {loc.district} • {loc.state}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                    {loc.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwap}
          className="absolute right-3 top-[32px] z-10 p-1.5 rounded-full bg-white border border-stone-300 text-stone-600 hover:text-stone-900 hover:bg-stone-100 shadow-2xs transition-all cursor-pointer"
          title="Swap Origin and Destination"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>

        {/* Destination Input */}
        <div className="relative">
          <div className="absolute left-3 top-3 text-rose-600 pointer-events-none">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            ref={destInputRef}
            type="text"
            placeholder="Choose destination terminal or district..."
            value={destination}
            onChange={(e) => handleDestType(e.target.value)}
            onFocus={() => {
              if (destination.length > 0) setDestSuggestions(searchOdishaLocations(destination));
              else setDestSuggestions(ODISHA_LOCATIONS_DATABASE.slice(0, 6));
              setShowDestDropdown(true);
            }}
            className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50/70 border border-stone-200 focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 outline-none transition-all"
          />

          {showDestDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1 animate-in fade-in">
              <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Select Destination Location:
              </div>
              {destSuggestions.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => selectDestLoc(loc)}
                  className="w-full text-left p-2 rounded-lg hover:bg-stone-50 text-xs flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-stone-800 group-hover:text-emerald-800">
                      {loc.name}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {loc.district} • {loc.state}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                    {loc.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optimization Mode Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-stone-500">Route Preference Goal:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "ESSENTIAL_SAFETY", label: "Safest AI Route", desc: "Avoid mudslides & high risk", icon: ShieldCheck },
            { key: "FASTEST_TRANSIT", label: "Shortest / Fastest", desc: "Minimum km & duration", icon: Zap },
            { key: "BALANCED_LOGISTICS", label: "Valley Bypass", desc: "Smooth low-incline detour", icon: RotateCcw },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = priority === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onPriorityChange(item.key as any)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs"
                    : "bg-stone-50/50 hover:bg-stone-100/80 border-stone-200 text-stone-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-800" : "text-stone-400"}`} />
                  <span>{item.label}</span>
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5 truncate">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Corridor Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
        <span className="text-[10px] text-stone-500 font-bold whitespace-nowrap">Fast Corridors:</span>
        <button
          type="button"
          onClick={() => handlePreset("Bhubaneswar", "Balasore")}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 whitespace-nowrap border border-stone-200 cursor-pointer"
        >
          Bhubaneswar ➔ Balasore (NH-6)
        </button>
        <button
          type="button"
          onClick={() => handlePreset("Bhubaneswar", "Paradip")}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 whitespace-nowrap border border-stone-200 cursor-pointer"
        >
          Bhubaneswar ➔ Sambalpur (NH-306)
        </button>
        <button
          type="button"
          onClick={() => handlePreset("Tezpur", "Tawang")}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 whitespace-nowrap border border-stone-200 cursor-pointer"
        >
          Tezpur ➔ Tawang (NH-13)
        </button>
        <button
          type="button"
          onClick={() => handlePreset("Bhubaneswar", "Berhampur")}
          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 whitespace-nowrap border border-stone-200 cursor-pointer"
        >
          Bhubaneswar ➔ Berhampur (NH-2)
        </button>
      </div>

      {/* Search Route Button */}
      <button
        type="button"
        onClick={onCalculate}
        disabled={loading || !origin.trim() || !destination.trim()}
        className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
      >
        <Search className="w-4 h-4" />
        <span>{loading ? "Calculating Shortest & Safest Routes..." : "Find Route & Compare Risk"}</span>
      </button>
    </div>
  );
};
