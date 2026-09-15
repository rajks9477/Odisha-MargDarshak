'use client';

import React from 'react';
import { Trip } from '../types/tripTypes';
import TripStatusBadge from './TripStatusBadge';

interface TripCardProps {
  trip: Trip;
  onViewRoute?: () => void;
  onStartTrip?: () => void;
  onPauseTrip?: () => void;
  onResumeTrip?: () => void;
  onCompleteTrip?: () => void;
  compact?: boolean;
}

export default function TripCard({
  trip,
  onViewRoute,
  onStartTrip,
  onPauseTrip,
  onResumeTrip,
  onCompleteTrip,
  compact = false,
}: TripCardProps) {
  const isStarted = trip.status === 'STARTED';
  const isPaused = trip.status === 'PAUSED';
  const isAssignedOrReady = trip.status === 'ASSIGNED' || trip.status === 'READY' || trip.status === 'ACCEPTED';
  const isCompleted = trip.status === 'COMPLETED' || trip.status === 'CANCELLED';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md transition-all hover:border-slate-700">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
            🚚
          </span>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">{trip.trip_number}</h3>
            <p className="text-[11px] text-slate-400">{trip.corridor_name}</p>
          </div>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* Origin -> Destination Route Info */}
      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400">
            ●
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Origin Depot</span>
            <p className="text-xs font-medium text-slate-200">{trip.origin_name}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] text-rose-400">
            📍
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Destination</span>
            <p className="text-xs font-medium text-slate-200">{trip.destination_name}</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/60 p-3 text-center">
        <div>
          <span className="text-[10px] text-slate-400">Distance</span>
          <p className="text-xs font-bold text-white">{trip.distance_km} km</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400">Est. Time</span>
          <p className="text-xs font-bold text-white">~{Math.round((trip.distance_km / 40) * 10) / 10} hrs</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400">Cargo</span>
          <p className="truncate text-xs font-bold text-emerald-400" title={trip.cargo_type}>
            {trip.cargo_type.split(' ')[0]} ({trip.cargo_weight_tonnes}T)
          </p>
        </div>
      </div>

      {/* Action Footer */}
      {!compact && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-2">
          {onViewRoute && (
            <button
              onClick={onViewRoute}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 active:scale-95"
            >
              🗺️ <span>View Route on Map</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {isAssignedOrReady && onStartTrip && (
              <button
                onClick={onStartTrip}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-95"
              >
                🚀 <span>Start Trip</span>
              </button>
            )}

            {isStarted && onPauseTrip && (
              <button
                onClick={onPauseTrip}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20 active:scale-95"
              >
                ⏸️ <span>Pause</span>
              </button>
            )}

            {isPaused && onResumeTrip && (
              <button
                onClick={onResumeTrip}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-95"
              >
                ▶️ <span>Resume</span>
              </button>
            )}

            {(isStarted || isPaused) && onCompleteTrip && (
              <button
                onClick={onCompleteTrip}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-500 active:scale-95"
              >
                🏁 <span>Complete Trip</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
