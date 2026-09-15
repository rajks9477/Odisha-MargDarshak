'use client';

import React from 'react';
import { TripProgress as TripProgressType } from '../types/tripTypes';

interface TripProgressProps {
  progress: TripProgressType;
  originName?: string;
  destinationName?: string;
}

export default function TripProgress({ progress, originName = 'Origin', destinationName = 'Destination' }: TripProgressProps) {
  const pct = Math.min(100, Math.max(0, progress.progress_percentage));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 text-xs text-cyan-400">
            📊
          </span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Trip Progress</h4>
        </div>
        <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
          {pct}% Completed
        </span>
      </div>

      {/* Visual Route Progress Track */}
      <div className="my-4">
        <div className="relative flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span className="truncate max-w-[40%] text-emerald-400">● {originName.split(',')[0]}</span>
          <span className="truncate max-w-[40%] text-right text-rose-400">📍 {destinationName.split(',')[0]}</span>
        </div>

        <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-950">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-3 text-center">
        <div>
          <span className="text-[10px] uppercase text-slate-400">Covered</span>
          <p className="text-xs font-bold text-emerald-400">{progress.distance_completed_km} km</p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-400">Remaining</span>
          <p className="text-xs font-bold text-amber-400">{progress.distance_remaining_km} km</p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-400">Est. Time Left</span>
          <p className="text-xs font-bold text-cyan-400">
            {Math.floor(progress.estimated_remaining_minutes / 60)}h {Math.round(progress.estimated_remaining_minutes % 60)}m
          </p>
        </div>
      </div>

      {/* Current Road Banner */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/70 px-3.5 py-2 text-xs">
        <span className="text-slate-400">Current Roadway:</span>
        <span className="font-semibold text-white">{progress.current_road_name}</span>
      </div>
    </div>
  );
}
