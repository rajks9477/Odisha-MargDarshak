"use client";

import React from "react";
import { 
  AlertTriangle, 
  X, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight 
} from "lucide-react";
import { MapIncidentItem } from "../types/mapTypes";

interface IncidentDetailsCardProps {
  incident: MapIncidentItem | null;
  onClose: () => void;
  onViewAlternativeRoutes?: (incident: MapIncidentItem) => void;
  className?: string;
}

const SEVERITY_CONFIG: Record<string, { label: string; badgeClass: string; borderClass: string; iconClass: string }> = {
  CRITICAL: {
    label: "CRITICAL HAZARD",
    badgeClass: "bg-rose-950/80 text-rose-300 border-rose-800",
    borderClass: "border-rose-500/80 shadow-rose-950/40",
    iconClass: "text-rose-400 bg-rose-950/80",
  },
  HIGH: {
    label: "HIGH SEVERITY",
    badgeClass: "bg-orange-950/80 text-orange-300 border-orange-800",
    borderClass: "border-orange-500/80 shadow-orange-950/40",
    iconClass: "text-orange-400 bg-orange-950/80",
  },
  MODERATE: {
    label: "MODERATE CAUTION",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-800",
    borderClass: "border-amber-500/80 shadow-amber-950/40",
    iconClass: "text-amber-400 bg-amber-950/80",
  },
  LOW: {
    label: "MINOR DISRUPTION",
    badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    borderClass: "border-emerald-500/80 shadow-emerald-950/40",
    iconClass: "text-emerald-400 bg-emerald-950/80",
  },
};

export const IncidentDetailsCard: React.FC<IncidentDetailsCardProps> = ({
  incident,
  onClose,
  onViewAlternativeRoutes,
  className = "",
}) => {
  if (!incident) return null;

  const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.MODERATE;

  return (
    <div
      className={`rounded-3xl bg-slate-950/95 backdrop-blur-2xl border shadow-2xl p-4 sm:p-5 text-slate-200 animate-in slide-in-from-bottom-6 duration-200 ${sev.borderClass} ${className}`}
    >
      {/* Header with Type, Severity, and Close Button */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-slate-700/60 ${sev.iconClass}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {incident.incident_type.replace(/_/g, " ")}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wide ${sev.badgeClass}`}>
                {sev.label}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-slate-300">{incident.status}</span>
              <span>•</span>
              <span className="font-mono text-[10px]">{incident.id}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Location & Distance Grid */}
      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" /> Location
          </div>
          <div className="text-xs font-bold text-white truncate">
            {incident.road_name}
          </div>
          <div className="text-[10px] text-slate-400">
            {incident.district_name}, {incident.state}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Reported Time
          </div>
          <div className="text-xs font-bold text-white font-mono">
            {new Date(incident.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          {incident.distance_km !== undefined && (
            <div className="text-[10px] font-bold text-emerald-400 font-mono">
              {incident.distance_km.toFixed(1)} km ahead
            </div>
          )}
        </div>
      </div>

      {/* Hazard Description */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 leading-relaxed mb-3">
        {incident.description}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-1">
        {onViewAlternativeRoutes && (
          <button
            type="button"
            onClick={() => onViewAlternativeRoutes(incident)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/50 transition-all active:scale-95"
          >
            <span>Avoid Hazard / Smart Route</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
