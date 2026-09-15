"use client";

import React from "react";
import { GpsTelemetry } from "@/services/locationService";
import { Radio, Compass, ShieldCheck, AlertCircle } from "lucide-react";

interface MapStatusIndicatorProps {
  gps?: GpsTelemetry | null;
  freshness: "LIVE" | "STALE" | "OFFLINE";
  matchedRoadName?: string;
  matchedDistrictName?: string;
  isFollowing: boolean;
  className?: string;
}

export const MapStatusIndicator: React.FC<MapStatusIndicatorProps> = ({
  gps,
  freshness,
  matchedRoadName,
  matchedDistrictName,
  isFollowing,
  className = "",
}) => {
  const isLive = freshness === "LIVE";
  const isStale = freshness === "STALE";

  return (
    <div className={`flex flex-wrap items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800/80 shadow-2xl text-xs ${className}`}>
      {/* Freshness Status Badge */}
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isLive
              ? "bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50"
              : isStale
              ? "bg-amber-400"
              : "bg-rose-400"
          }`}
        />
        <span
          className={`font-black text-[11px] uppercase tracking-wider ${
            isLive ? "text-emerald-400" : isStale ? "text-amber-400" : "text-rose-400"
          }`}
        >
          {freshness}
        </span>
      </div>

      {/* GPS Accuracy */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
        <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span className="text-[11px] font-mono font-bold">
          ±{gps ? Math.round(gps.accuracy) : 5}m
        </span>
      </div>

      {/* Matched Highway Corridor */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 truncate max-w-xs">
        <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-[11px] font-semibold truncate text-slate-200">
          {matchedRoadName || "NH-6 Sonapur Corridor"}
        </span>
        {matchedDistrictName && (
          <span className="text-[10px] text-slate-400">
            • {matchedDistrictName}
          </span>
        )}
      </div>

      {/* Tracking Follow Mode Pill */}
      <div className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider ${
        isFollowing 
          ? "bg-blue-950/60 border-blue-500/50 text-blue-400"
          : "bg-slate-900 border-slate-800 text-slate-400"
      }`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        <span>{isFollowing ? "FOLLOWING" : "FREE EXPLORE"}</span>
      </div>
    </div>
  );
};
