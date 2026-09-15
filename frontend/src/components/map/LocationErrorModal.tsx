"use client";

import React from "react";
import { LocationErrorState } from "@/services/locationService";
import { 
  MapPinOff, 
  Sparkles, 
  ShieldAlert, 
  RefreshCw, 
  X,
  Play
} from "lucide-react";

interface LocationErrorModalProps {
  error: LocationErrorState | null;
  onRetry: () => void;
  onStartSimulation: () => void;
  onClose: () => void;
}

export const LocationErrorModal: React.FC<LocationErrorModalProps> = ({
  error,
  onRetry,
  onStartSimulation,
  onClose,
}) => {
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <MapPinOff className="w-5 h-5" />
            <span>GPS Location Notice</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/80 text-rose-300">
            <strong>Hardware Status: </strong>
            {error.type === "PERMISSION_DENIED"
              ? "Location permission was denied in your browser."
              : error.type === "POSITION_UNAVAILABLE"
              ? "GPS hardware signal not currently detected (common inside mountain valleys or buildings)."
              : error.message}
          </div>

          <p className="text-slate-400 leading-relaxed">
            For operational security and green corridor dispatch in the North East, real-time driver telemetry is recommended. You can enable GPS in browser permissions or activate testing mode.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
          <button
            type="button"
            onClick={onStartSimulation}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Simulated Drive (NH-6)</span>
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry GPS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
