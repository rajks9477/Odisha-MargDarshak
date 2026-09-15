"use client";

import React from "react";
import { Filter, X, Check } from "lucide-react";
import { IncidentSeverityType } from "../types/mapTypes";

interface MapFilterPanelProps {
  selectedSeverities: Set<IncidentSeverityType>;
  onToggleSeverity: (sev: IncidentSeverityType) => void;
  onClearFilters: () => void;
  className?: string;
}

const SEVERITIES: { id: IncidentSeverityType; label: string; colorClass: string }[] = [
  { id: "CRITICAL", label: "Critical", colorClass: "border-rose-500 text-rose-400 bg-rose-950/40" },
  { id: "HIGH", label: "High", colorClass: "border-orange-500 text-orange-400 bg-orange-950/40" },
  { id: "MODERATE", label: "Moderate", colorClass: "border-amber-500 text-amber-400 bg-amber-950/40" },
  { id: "LOW", label: "Low", colorClass: "border-emerald-500 text-emerald-400 bg-emerald-950/40" },
];

export const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  selectedSeverities,
  onToggleSeverity,
  onClearFilters,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800/80 shadow-xl ${className}`}>
      <div className="flex items-center gap-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <Filter className="w-3 h-3 text-slate-400" />
        <span>Filters</span>
      </div>

      {SEVERITIES.map((item) => {
        const isSelected = selectedSeverities.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggleSeverity(item.id)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
              isSelected
                ? `${item.colorClass} shadow-md`
                : "border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-400"
            }`}
          >
            {isSelected && <Check className="w-2.5 h-2.5 shrink-0" />}
            <span>{item.label}</span>
          </button>
        );
      })}

      {selectedSeverities.size > 0 && (
        <button
          type="button"
          onClick={onClearFilters}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] ml-auto flex items-center gap-0.5"
          title="Reset severity filters"
        >
          <X className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
