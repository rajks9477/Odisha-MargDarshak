'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trip } from '@/features/trips/types/tripTypes';
import { tripsApi } from '@/features/trips/api/tripsApi';
import TripHistoryCard from '@/features/trips/components/TripHistoryCard';
import TripCard from '@/features/trips/components/TripCard';

export default function DriverTripsPage() {
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [historyTrips, setHistoryTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [active, history] = await Promise.all([
          tripsApi.getTrips(),
          tripsApi.getTripHistory(),
        ]);
        setActiveTrips(active);
        setHistoryTrips(history);
      } catch (err) {
        console.error('Failed to load trips:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 px-4 py-3.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/driver"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              ←
            </Link>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Trip Directory & History</h1>
              <p className="text-[11px] text-slate-400">All dispatches and transit records</p>
            </div>
          </div>

          <Link
            href="/dashboard/driver/route"
            className="rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition"
          >
            🚚 My Route
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-5 space-y-4">
        {/* Tab Toggle */}
        <div className="flex rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
              activeTab === 'ACTIVE'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Assigned & Active ({activeTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
              activeTab === 'HISTORY'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Delivered History ({historyTrips.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 py-8">
            <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-900" />
            <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-900" />
          </div>
        ) : activeTab === 'ACTIVE' ? (
          /* Active Trips List */
          activeTrips.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
              <p className="text-xs text-slate-400">No active trips currently assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrips.map((t) => (
                <TripCard key={t.id} trip={t} compact />
              ))}
            </div>
          )
        ) : (
          /* History Trips List */
          historyTrips.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
              <p className="text-xs text-slate-400">No completed trip history found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyTrips.map((t) => (
                <TripHistoryCard key={t.id} trip={t} />
              ))}
            </div>
          )
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/90 px-6 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between text-center">
          <Link href="/dashboard/driver" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/dashboard/driver/map" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
            <span className="text-lg">🗺️</span>
            <span className="text-[10px] font-medium">Map</span>
          </Link>
          <Link href="/dashboard/driver/route" className="flex flex-col items-center gap-1 text-cyan-400 font-semibold">
            <span className="text-lg">🚚</span>
            <span className="text-[10px]">Route</span>
          </Link>
          <Link href="/dashboard/driver/alerts" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
            <span className="text-lg">🔔</span>
            <span className="text-[10px] font-medium">Alerts</span>
          </Link>
          <Link href="/dashboard/driver/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
            <span className="text-lg">👤</span>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
