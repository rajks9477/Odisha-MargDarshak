"use client";

import React, { useState } from "react";
import { 
  Layers, 
  Check, 
  X, 
  Navigation, 
  AlertTriangle, 
  Route, 
  Building2, 
  Anchor, 
  Truck 
} from "lucide-react";
import { MapLayerConfigItem } from "../types/mapTypes";

interface MapLayerControlProps {
  layers: MapLayerConfigItem[];
  activeLayerIds: Set<string>;
  onToggleLayer: (layerId: string) => void;
  className?: string;
}

const LAYER_ICON_MAP: Record<string, React.ReactNode> = {
  my_location: <Navigation className="w-4 h-4 text-blue-400" />,
  incidents: <AlertTriangle className="w-4 h-4 text-rose-400" />,
  roads: <Route className="w-4 h-4 text-emerald-400" />,
  infrastructure: <Building2 className="w-4 h-4 text-purple-400" />,
  bridges: <Anchor className="w-4 h-4 text-cyan-400" />,
  vehicles: <Truck className="w-4 h-4 text-amber-400" />,
};

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  layers,
  activeLayerIds,
  onToggleLayer,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className={`relative ${className}`}>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Map Layers"
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all border ${
          isOpen
            ? "bg-slate-800 border-slate-600 text-white"
            : "bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-slate-300 shadow-slate-950/80"
        }`}
      >
        <Layers className="w-5 h-5 text-slate-200" />
      </button>

      {/* Layer Control Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-14 right-0 z-50 w-72 sm:w-80 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                GIS Map Layers
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {layers.map((layer) => {
              const isChecked = activeLayerIds.has(layer.id);
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => onToggleLayer(layer.id)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    isChecked
                      ? "bg-slate-900/90 border-slate-700/80 text-white"
                      : "bg-slate-950/50 border-slate-900 text-slate-500 hover:text-slate-400"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {LAYER_ICON_MAP[layer.id] || <Layers className="w-4 h-4 text-slate-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">
                      {layer.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      {layer.description}
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isChecked
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-slate-800 bg-slate-900/50 text-transparent"
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 text-center">
            Toggle layers to optimize mobile rendering speed.
          </div>
        </div>
      )}
    </div>
  );
};
