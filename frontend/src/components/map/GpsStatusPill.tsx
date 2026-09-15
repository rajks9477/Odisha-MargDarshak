"use client";

import React, { useState, useEffect } from "react";
import { GpsTelemetry } from "@/services/locationService";
import { 
  Radio, 
  Compass, 
  Navigation2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Sparkles
} from "lucide-react";

interface GpsStatusPillProps {
  gps: GpsTelemetry | null;
  isWatching: boolean;
  onLocateMe?: () => void;
}

export const GpsStatusPill: React.FC<GpsStatusPillProps> = ({
  gps,
  isWatching,
  onLocateMe,
}) => {
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  useEffect(() => {
    if (!gps) return;
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - gps.timestamp) / 1000);
      setSecondsAgo(Math.max(0, diffSec));
    }, 1000);

    return () => clearInterval(interval);
  }, [gps]);

  if (!gps) {
    return (
      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-400 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>Acquiring Mountain Satellite Lock...</span>
      </div>
    );
  }

  const isStale = secondsAgo > 120;
  const isWeak = gps.accuracy > 50;

  return (
    <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl text-xs shadow-2xl flex flex-wrap items-center gap-x-3 gap-y-1">
      {/* GPS Status Indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isStale
              ? "bg-slate-500"
              : isWeak
              ? "bg-amber-400 animate-pulse"
              : "bg-emerald-400 animate-pulse"
          }`}
        />
        <span className="font-bold text-white font-mono">
          {gps.isSimulated ? "SIMULATED GPS" : `GPS ±${Math.round(gps.accuracy)}m`}
        </span>
      </div>

      <span className="text-slate-600 hidden sm:inline">•</span>

      {/* Freshness Timer */}
      <div className="flex items-center gap-1 text-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className={isStale ? "text-rose-400 font-bold" : "text-slate-300 font-mono"}>
          {isStale
            ? `Stale GPS (${Math.floor(secondsAgo / 60)}m ago)`
            : secondsAgo === 0
            ? "Just now"
            : `${secondsAgo}s ago`}
        </span>
      </div>

      {gps.speed > 0 && (
        <>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
            <span>{Math.round(gps.speed)} km/h</span>
          </div>
        </>
      )}

      {onLocateMe && (
        <button
          type="button"
          onClick={onLocateMe}
          className="ml-auto text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors pl-2"
        >
          <Navigation2 className="w-3 h-3" />
          <span>Center</span>
        </button>
      )}
    </div>
  );
};
