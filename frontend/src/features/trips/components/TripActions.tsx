'use client';

import React, { useState } from 'react';
import { Trip } from '../types/tripTypes';

interface TripActionsProps {
  trip: Trip;
  onStart: (notes: string) => Promise<void>;
  onPause: (reason: string) => Promise<void>;
  onResume: () => Promise<void>;
  onComplete: (notes: string) => Promise<void>;
  isLoading?: boolean;
}

export default function TripActions({
  trip,
  onStart,
  onPause,
  onResume,
  onComplete,
  isLoading = false,
}: TripActionsProps) {
  const [showStartModal, setShowStartModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [startNotes, setStartNotes] = useState('Driver vehicle inspection and freight check complete.');
  const [pauseReason, setPauseReason] = useState('Mountain convoy rest halt / driver fatigue check');
  const [completeNotes, setCompleteNotes] = useState('Consignment safely delivered to destination supply depot.');

  const isAssigned = trip.status === 'ASSIGNED' || trip.status === 'READY' || trip.status === 'ACCEPTED';
  const isStarted = trip.status === 'STARTED';
  const isPaused = trip.status === 'PAUSED';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Primary Action Buttons */}
      {isAssigned && (
        <button
          onClick={() => setShowStartModal(true)}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          🚀 <span>Start Trip Dispatch</span>
        </button>
      )}

      {isStarted && (
        <>
          <button
            onClick={() => setShowPauseModal(true)}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5 text-sm font-bold text-amber-400 shadow-lg transition hover:bg-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            ⏸️ <span>Pause Trip</span>
          </button>

          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-cyan-600/30 transition hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
          >
            🏁 <span>Complete Trip</span>
          </button>
        </>
      )}

      {isPaused && (
        <>
          <button
            onClick={onResume}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            ▶️ <span>Resume Transit</span>
          </button>

          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-5 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
          >
            🏁 <span>Complete</span>
          </button>
        </>
      )}

      {/* START CONFIRMATION MODAL */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-xl">
                🚀
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Trip Departure</h3>
                <p className="text-xs text-slate-400">Trip #{trip.trip_number}</p>
              </div>
            </div>

            <div className="my-4 space-y-3 rounded-2xl bg-slate-950/60 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Origin:</span>
                <span className="font-semibold text-white">{trip.origin_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-semibold text-white">{trip.destination_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance:</span>
                <span className="font-semibold text-emerald-400">{trip.distance_km} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cargo:</span>
                <span className="font-semibold text-white">{trip.cargo_type}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Departure Notes / Checklist
              </label>
              <textarea
                value={startNotes}
                onChange={(e) => setStartNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  await onStart(startNotes);
                  setShowStartModal(false);
                }}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
              >
                {isLoading ? 'Starting...' : 'Confirm & Start GPS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-xl">
                ⏸️
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Pause Active Transit</h3>
                <p className="text-xs text-slate-400">Specify reason for mountain halt</p>
              </div>
            </div>

            <div className="my-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Select Common Reason</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Mountain rest & meal',
                  'Vehicle mechanical check',
                  'Heavy rain / poor visibility',
                  'Road blockage / landslide halt',
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPauseReason(r)}
                    className={`rounded-xl border p-2 text-left text-[11px] transition ${
                      pauseReason === r
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                rows={2}
                placeholder="Or type specific details..."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  await onPause(pauseReason);
                  setShowPauseModal(false);
                }}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-500"
              >
                {isLoading ? 'Pausing...' : 'Confirm Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-xl">
                🏁
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Complete & Deliver Consignment</h3>
                <p className="text-xs text-slate-400">Destination: {trip.destination_name}</p>
              </div>
            </div>

            <div className="my-4">
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Delivery Confirmation Note
              </label>
              <textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  await onComplete(completeNotes);
                  setShowCompleteModal(false);
                }}
                className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white hover:bg-cyan-500"
              >
                {isLoading ? 'Completing...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
