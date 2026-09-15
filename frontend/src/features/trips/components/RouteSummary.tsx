'use client';

import React from 'react';
import { TripRouteGeometry } from '../types/tripTypes';

interface RouteSummaryProps {
  route: TripRouteGeometry;
}

export default function RouteSummary({ route }: RouteSummaryProps) {
  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Planned Corridor</h4>
          <p className="text-sm font-bold text-white">{route.corridor_name}</p>
        </div>
        <div className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskColor(route.risk_level)}`}>
          Risk Score: {route.risk_score} ({route.risk_level})
        </div>
      </div>

      {/* Overview Stats */}
      <div className="my-3.5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-xl bg-slate-950/60 p-2.5">
          <span className="text-[10px] text-slate-400">Total Distance</span>
          <p className="text-xs font-bold text-white">{route.distance_km} km</p>
        </div>
        <div className="rounded-xl bg-slate-950/60 p-2.5">
          <span className="text-[10px] text-slate-400">Est. Duration</span>
          <p className="text-xs font-bold text-white">~{Math.round(route.estimated_duration_minutes)} min</p>
        </div>
        <div className="rounded-xl bg-slate-950/60 p-2.5">
          <span className="text-[10px] text-slate-400">Waypoints</span>
          <p className="text-xs font-bold text-white">{route.coordinates.length} pts</p>
        </div>
        <div className="rounded-xl bg-slate-950/60 p-2.5">
          <span className="text-[10px] text-slate-400">Segments</span>
          <p className="text-xs font-bold text-white">{route.segments?.length || 1} Legs</p>
        </div>
      </div>

      {/* Road Segment Legs */}
      {route.segments && route.segments.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Corridor Legs</h5>
          <div className="space-y-1.5">
            {route.segments.map((seg, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-2 text-xs border border-slate-800/40"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-200">{seg.road_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{seg.distance_km} km</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      seg.status === 'GREEN'
                        ? 'bg-emerald-400'
                        : seg.status === 'YELLOW'
                        ? 'bg-yellow-400'
                        : 'bg-rose-400'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
