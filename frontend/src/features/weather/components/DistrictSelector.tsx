"use client";

import React from "react";
import { MapPin, ChevronDown } from "lucide-react";

interface Props {
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
}

const DISTRICT_LOCATIONS = [
  "Sonapur (East Jaintia Hills, Meghalaya)",
  "Shillong (East Khasi Hills, Meghalaya)",
  "Guwahati (Kamrup Metropolitan, Assam)",
  "Silchar (Cachar, Assam)",
  "Aizawl (Aizawl District, Mizoram)",
  "Tawang (Tawang District, Arunachal Pradesh)",
];

export const DistrictSelector: React.FC<Props> = ({
  selectedLocation,
  onSelectLocation,
}) => {
  return (
    <div className="relative w-full sm:w-auto">
      <div className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
        <select
          value={selectedLocation}
          onChange={(e) => onSelectLocation(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-100 outline-none cursor-pointer pr-4 w-full"
        >
          {DISTRICT_LOCATIONS.map((loc) => (
            <option key={loc} value={loc} className="bg-slate-900 text-slate-200">
              {loc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
