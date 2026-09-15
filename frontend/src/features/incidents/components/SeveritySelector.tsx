"use client";

import React from "react";
import { IncidentSeverity } from "../types/incidentTypes";

interface SeverityOption {
  level: IncidentSeverity;
  label: string;
  desc: string;
  badgeColor: string;
  activeBorder: string;
  activeBg: string;
}

const SEVERITY_OPTIONS: SeverityOption[] = [
  {
    level: IncidentSeverity.LOW,
    label: "LOW",
    desc: "Minor issue; route is still usable.",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    activeBorder: "border-emerald-500 ring-2 ring-emerald-500/30",
    activeBg: "bg-emerald-950/40",
  },
  {
    level: IncidentSeverity.MEDIUM,
    label: "MEDIUM",
    desc: "Travel may be delayed or single-lane.",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    activeBorder: "border-amber-500 ring-2 ring-amber-500/30",
    activeBg: "bg-amber-950/40",
  },
  {
    level: IncidentSeverity.HIGH,
    label: "HIGH",
    desc: "Route may be unsafe or partially blocked.",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    activeBorder: "border-orange-500 ring-2 ring-orange-500/30",
    activeBg: "bg-orange-950/40",
  },
  {
    level: IncidentSeverity.CRITICAL,
    label: "CRITICAL",
    desc: "Immediate danger; major route disruption.",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
    activeBorder: "border-red-500 ring-2 ring-red-500/30",
    activeBg: "bg-red-950/40",
  },
];

interface Props {
  selectedSeverity: IncidentSeverity;
  onSelect: (severity: IncidentSeverity) => void;
}

export const SeveritySelector: React.FC<Props> = ({ selectedSeverity, onSelect }) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        2. Incident Severity <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SEVERITY_OPTIONS.map((item) => {
          const isSelected = selectedSeverity === item.level;
          return (
            <button
              key={item.level}
              type="button"
              onClick={() => onSelect(item.level)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? `${item.activeBorder} ${item.activeBg} shadow-md`
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                  {item.label}
                </span>
                {isSelected && (
                  <span className="text-xs text-emerald-400 font-medium">✓</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-1">{item.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
