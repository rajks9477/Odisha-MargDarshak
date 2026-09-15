"use client";

import React from "react";
import { DisasterAlert } from "../types/weatherTypes";
import {
  AlertTriangle,
  Flame,
  CloudRain,
  Mountain,
  Waves,
  Wind,
  ShieldAlert,
  Compass,
  Building,
} from "lucide-react";

interface Props {
  disaster: DisasterAlert;
}

export const DisasterEventCard: React.FC<Props> = ({ disaster }) => {
  const getHazardIcon = (type: string) => {
    switch (type) {
      case "FLASH_FLOOD":
      case "RIVER_OVERFLOW":
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case "LANDSLIDE":
        return <Mountain className="w-4 h-4 text-amber-400" />;
      case "CLOUD_BURST":
        return <CloudRain className="w-4 h-4 text-purple-400" />;
      case "CYCLONE_WIND":
        return <Wind className="w-4 h-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/50";
      case "MEDIUM":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "LOW":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            {getHazardIcon(disaster.hazard_type)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                {disaster.hazard_type.replace("_", " ")}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800 font-mono">
                {disaster.affected_highway}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-100 truncate mt-0.5">
              {disaster.title}
            </h3>
          </div>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase shrink-0 font-mono ${getSeverityStyle(disaster.severity)}`}>
          {disaster.severity}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
        {disaster.description}
      </p>

      {disaster.recommended_action && (
        <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-900/50 space-y-1">
          <div className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SDMA / PWD Mandatory Advisory</span>
          </div>
          <p className="text-xs text-amber-200/90 font-medium">
            {disaster.recommended_action}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
        <span className="truncate">Issued by: {disaster.issued_by}</span>
        <span className="text-emerald-400 font-bold shrink-0">{disaster.data_quality}</span>
      </div>
    </div>
  );
};
