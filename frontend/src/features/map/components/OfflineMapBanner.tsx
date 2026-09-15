"use client";

import React from "react";
import { WifiOff, Database } from "lucide-react";

interface OfflineMapBannerProps {
  isOffline: boolean;
  cachedCount?: number;
  className?: string;
}

export const OfflineMapBanner: React.FC<OfflineMapBannerProps> = ({
  isOffline,
  cachedCount = 0,
  className = "",
}) => {
  if (!isOffline) return null;

  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-amber-950/90 backdrop-blur-md border border-amber-800 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-4 ${className}`}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <div className="text-[11px] leading-tight">
          <strong className="text-white">Offline GIS Mode Active:</strong> Showing cached mountain corridor map & {cachedCount} local hazard checkpoints.
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60 text-amber-300 shrink-0">
        <Database className="w-3 h-3" />
        <span>CACHED VIEWPORT</span>
      </div>
    </div>
  );
};
