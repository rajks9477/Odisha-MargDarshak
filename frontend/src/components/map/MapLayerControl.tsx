"use client";

import React from "react";
import { 
  Layers, 
  MapPin, 
  Truck, 
  AlertTriangle, 
  Sparkles, 
  CloudRain, 
  ShieldAlert, 
  Check, 
  X,
  Compass
} from "lucide-react";

export interface ActiveLayers {
  roads: boolean;
  myLocation: boolean;
  bridges: boolean;
  incidents: boolean;
  vehicles: boolean;
  districts: boolean;
  // Future placeholder slots
  aiRisk: boolean;
  weather: boolean;
  emergencyRoutes: boolean;
}

interface MapLayerControlProps {
  layers: ActiveLayers;
  onToggleLayer: (key: keyof ActiveLayers) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  layers,
  onToggleLayer,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const coreLayers = [
    { key: "roads" as const, label: "Road Accessibility Network (4-Color)", icon: Compass, color: "text-emerald-400" },
    { key: "myLocation" as const, label: "My Live Driver GPS Location", icon: MapPin, color: "text-blue-400" },
    { key: "bridges" as const, label: "Mountain Bridges & Spans", icon: Truck, color: "text-amber-400" },
    { key: "incidents" as const, label: "Active Road Incidents & Hazards", icon: AlertTriangle, color: "text-rose-400" },
    { key: "vehicles" as const, label: "Assigned Fleet Telemetry", icon: Truck, color: "text-purple-400" },
    { key: "districts" as const, label: "District Boundaries (Odisha - 30 Districts)", icon: Layers, color: "text-slate-300" },
  ];

  const futureLayers = [
    { key: "aiRisk" as const, label: "AI Predictive Disruption Heatmap", icon: Sparkles, badge: "Phase 4 Ready" },
    { key: "weather" as const, label: "IMD Weather & Rainfall Radar", icon: CloudRain, badge: "Phase 5 Ready" },
    { key: "emergencyRoutes" as const, label: "Green Corridors / Military Convoys", icon: ShieldAlert, badge: "Phase 6 Ready" },
  ];

  return (
    <div className="absolute top-16 right-4 z-[1000] w-80 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-4 text-xs space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 font-bold text-white">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>GIS Map Layer Controls</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active GIS Data Layers */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operational GIS Layers
        </div>

        {coreLayers.map((layer) => {
          const isActive = layers[layer.key];
          const Icon = layer.icon;

          return (
            <button
              key={layer.key}
              type="button"
              onClick={() => onToggleLayer(layer.key)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isActive
                  ? "bg-slate-900 border-slate-700 text-white font-semibold"
                  : "bg-slate-950/50 border-slate-900 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${layer.color}`} />
                <span className="text-left text-xs leading-tight">{layer.label}</span>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  isActive
                    ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Future Layer Architecture Slots */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Planned Future Intelligent Layers
        </div>

        {futureLayers.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.key}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/30 border border-slate-900 text-slate-500 opacity-60 cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="text-[11px]">{layer.label}</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                {layer.badge}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
