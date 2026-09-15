"use client";

import React from "react";
import { Layers, MapPin, Truck, AlertTriangle, CloudRain, Building2 } from "lucide-react";

export interface LayerState {
  showRoads: boolean;
  showNodes: boolean;
  showFleet: boolean;
  showIncidents: boolean;
  showWeather: boolean;
}

interface Props {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}

export const LayerControl: React.FC<Props> = ({ layers, onToggle }) => {
  return (
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
        <Layers className="w-3.5 h-3.5 text-cyan-400" /> Map Layers:
      </span>

      <button
        type="button"
        onClick={() => onToggle("showRoads")}
        className={`px-2.5 py-1 rounded-xl border font-mono transition-colors flex items-center gap-1 ${
          layers.showRoads
            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
            : "bg-slate-950 text-slate-400 border-slate-800"
        }`}
      >
        <Layers className="w-3 h-3" />
        <span>Road Corridors</span>
      </button>

      <button
        type="button"
        onClick={() => onToggle("showNodes")}
        className={`px-2.5 py-1 rounded-xl border font-mono transition-colors flex items-center gap-1 ${
          layers.showNodes
            ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold"
            : "bg-slate-950 text-slate-400 border-slate-800"
        }`}
      >
        <Building2 className="w-3 h-3" />
        <span>Critical Hubs</span>
      </button>

      <button
        type="button"
        onClick={() => onToggle("showFleet")}
        className={`px-2.5 py-1 rounded-xl border font-mono transition-colors flex items-center gap-1 ${
          layers.showFleet
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
            : "bg-slate-950 text-slate-400 border-slate-800"
        }`}
      >
        <Truck className="w-3 h-3" />
        <span>Active Fleet</span>
      </button>

      <button
        type="button"
        onClick={() => onToggle("showIncidents")}
        className={`px-2.5 py-1 rounded-xl border font-mono transition-colors flex items-center gap-1 ${
          layers.showIncidents
            ? "bg-red-500/20 text-red-300 border-red-500/40 font-bold"
            : "bg-slate-950 text-slate-400 border-slate-800"
        }`}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>Incidents</span>
      </button>
    </div>
  );
};
