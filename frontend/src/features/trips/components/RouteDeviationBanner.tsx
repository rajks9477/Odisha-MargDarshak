'use client';

import React from 'react';

interface RouteDeviationBannerProps {
  deviationDistanceKm: number;
  onViewMap?: () => void;
}

export default function RouteDeviationBanner({
  deviationDistanceKm,
  onViewMap,
}: RouteDeviationBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 p-4 text-amber-200 shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
          ⚠️
        </span>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Route Deviation Detected
          </h4>
          <p className="text-xs text-amber-200/90">
            Vehicle is currently <strong className="font-semibold text-white">{deviationDistanceKm} km</strong> away from the planned route corridor.
          </p>
        </div>
      </div>

      {onViewMap && (
        <button
          onClick={onViewMap}
          className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30 active:scale-95"
        >
          View Map
        </button>
      )}
    </div>
  );
}
