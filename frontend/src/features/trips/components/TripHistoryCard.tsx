'use client';

import React from 'react';
import { Trip } from '../types/tripTypes';
import TripStatusBadge from './TripStatusBadge';

interface TripHistoryCardProps {
  trip: Trip;
}

export default function TripHistoryCard({ trip }: TripHistoryCardProps) {
  const formattedDate = trip.actual_end
    ? new Date(trip.actual_end).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : trip.created_at
    ? new Date(trip.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition hover:border-slate-700">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
        <div>
          <span className="text-xs font-bold text-white">{trip.trip_number}</span>
          <span className="ml-2 text-[10px] text-slate-500">{formattedDate}</span>
        </div>
        <TripStatusBadge status={trip.status} size="sm" />
      </div>

      <div className="my-2.5 text-xs text-slate-300">
        <p className="truncate">
          <strong className="text-emerald-400">From:</strong> {trip.origin_name}
        </p>
        <p className="truncate">
          <strong className="text-rose-400">To:</strong> {trip.destination_name}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-slate-950/50 px-3 py-2 text-[11px] text-slate-400">
        <span>Distance: <strong className="text-white">{trip.actual_distance_km || trip.distance_km} km</strong></span>
        <span>Duration: <strong className="text-white">{trip.actual_duration_minutes ? `${Math.round(trip.actual_duration_minutes)}m` : `~${Math.round((trip.distance_km / 40) * 60)}m`}</strong></span>
        <span>Cargo: <strong className="text-emerald-400">{trip.cargo_weight_tonnes}T</strong></span>
      </div>
    </div>
  );
}
