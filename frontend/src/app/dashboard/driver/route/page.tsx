'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Trip, TripRouteGeometry, TripProgress as TripProgressType } from '@/features/trips/types/tripTypes';
import { tripService } from '@/features/trips/services/tripService';
import { routeService } from '@/features/trips/services/routeService';
import { LocationService, GpsTelemetry } from '@/services/locationService';
import { TrackingService } from '@/services/trackingService';

import TripCard from '@/features/trips/components/TripCard';
import TripProgress from '@/features/trips/components/TripProgress';
import RouteSummary from '@/features/trips/components/RouteSummary';
import TripActions from '@/features/trips/components/TripActions';
import RouteDeviationBanner from '@/features/trips/components/RouteDeviationBanner';
import OfflineTripBanner from '@/features/trips/components/OfflineTripBanner';

// Dynamic import for Leaflet RouteMapPreview
const RouteMapPreview = dynamic(
  () => import('@/features/trips/components/RouteMapPreview'),
  { ssr: false, loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-800" /> }
);

export default function MyRoutePage() {
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [route, setRoute] = useState<TripRouteGeometry | null>(null);
  const [progress, setProgress] = useState<TripProgressType | null>(null);
  const [gps, setGps] = useState<GpsTelemetry | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviationInfo, setDeviationInfo] = useState<{ isDeviated: boolean; deviationDistanceKm: number }>({
    isDeviated: false,
    deviationDistanceKm: 0,
  });

  const loadTripData = useCallback(async () => {
    try {
      setError(null);
      const activeTrip = await tripService.fetchCurrentTrip();
      setTrip(activeTrip);

      if (activeTrip) {
        const [routeData, progressData] = await Promise.all([
          routeService.fetchTripRoute(activeTrip.id),
          routeService.fetchTripProgress(activeTrip.id),
        ]);
        setRoute(routeData);
        setProgress(progressData);
      }
    } catch (err: any) {
      console.error('Failed to load trip/route data:', err);
      setError(err.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTripData();

    // Monitor Online/Offline Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to GPS Telemetry
    LocationService.startWatching(
      (telemetry) => {
        setGps(telemetry);
      },
      (err) => {
        console.warn('GPS watch notice:', err);
      }
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      LocationService.stopWatching();
    };
  }, [loadTripData]);

  // Check Deviation whenever GPS or Route updates
  useEffect(() => {
    if (gps && route && route.coordinates.length > 0) {
      const dev = routeService.calculateDeviation(
        gps.latitude,
        gps.longitude,
        gps.accuracy || 10,
        route.coordinates,
        1.5
      );
      setDeviationInfo(dev);
    }
  }, [gps, route]);

  // Trip Lifecycle Handlers
  const handleStartTrip = async (notes: string) => {
    if (!trip) return;
    try {
      setActionLoading(true);
      await TrackingService.startTracking({
        tripId: trip.id,
        vehicleId: trip.vehicle_id || 'VEH-AS-01-9104',
        startLat: gps?.latitude,
        startLon: gps?.longitude,
        notes,
      });
      await tripService.queueOfflineAction(trip.id, 'START', { lat: gps?.latitude, lng: gps?.longitude, notes });
      await loadTripData();
    } catch (err: any) {
      alert(`Error starting trip: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseTrip = async (reason: string) => {
    if (!trip) return;
    try {
      setActionLoading(true);
      await tripService.queueOfflineAction(trip.id, 'PAUSE', { reason, lat: gps?.latitude, lng: gps?.longitude });
      await loadTripData();
    } catch (err: any) {
      alert(`Error pausing trip: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeTrip = async () => {
    if (!trip) return;
    try {
      setActionLoading(true);
      await tripService.queueOfflineAction(trip.id, 'RESUME', { lat: gps?.latitude, lng: gps?.longitude });
      await loadTripData();
    } catch (err: any) {
      alert(`Error resuming trip: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async (notes: string) => {
    if (!trip) return;
    try {
      setActionLoading(true);
      const activeSession = await TrackingService.getActiveSession();
      if (activeSession) {
        await TrackingService.stopTracking(activeSession.session_id, gps?.latitude, gps?.longitude, notes);
      }
      await tripService.queueOfflineAction(trip.id, 'COMPLETE', {
        lat: gps?.latitude,
        lng: gps?.longitude,
        notes,
        finalDistanceKm: trip.distance_km,
      });
      await loadTripData();
    } catch (err: any) {
      alert(`Error completing trip: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Top Header */}
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
              <h1 className="text-base font-bold text-white tracking-tight">My Route & Active Trip</h1>
              <p className="text-[11px] text-slate-400">Odisha Strategic Freight & Transit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/driver/trips"
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              📜 History
            </Link>
            <button
              onClick={loadTripData}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh Route"
            >
              🔄
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-5 space-y-4">
        {!isOnline && <OfflineTripBanner />}

        {deviationInfo.isDeviated && (
          <RouteDeviationBanner
            deviationDistanceKm={deviationInfo.deviationDistanceKm}
            onViewMap={() => router.push('/dashboard/driver/map')}
          />
        )}

        {loading ? (
          <div className="space-y-4 py-10">
            <div className="h-44 w-full animate-pulse rounded-3xl bg-slate-900" />
            <div className="h-64 w-full animate-pulse rounded-3xl bg-slate-900" />
          </div>
        ) : !trip ? (
          /* Empty State: No Active Trip */
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-md">
            <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-slate-800/80 text-3xl mb-4">
              📭
            </span>
            <h3 className="text-base font-bold text-white">No Active Trip Assigned</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              You do not currently have any active dispatch. Check your trip history or wait for fleet control assignment.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/dashboard/driver/trips"
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                View Trip History
              </Link>
              <Link
                href="/dashboard/driver"
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Active Trip Content */
          <>
            {/* Trip Action Controls */}
            <TripActions
              trip={trip}
              onStart={handleStartTrip}
              onPause={handlePauseTrip}
              onResume={handleResumeTrip}
              onComplete={handleCompleteTrip}
              isLoading={actionLoading}
            />

            {/* Live Progress Bar (if in transit) */}
            {progress && (
              <TripProgress
                progress={progress}
                originName={trip.origin_name}
                destinationName={trip.destination_name}
              />
            )}

            {/* Route Map Preview */}
            {route && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    GIS Route Map View
                  </h4>
                  <Link
                    href="/dashboard/driver/map"
                    className="text-xs font-semibold text-cyan-400 hover:underline"
                  >
                    Open Full GIS Map →
                  </Link>
                </div>
                <RouteMapPreview route={route} gps={gps} />
              </div>
            )}

            {/* Trip Detail Card */}
            <TripCard
              trip={trip}
              onViewRoute={() => router.push('/dashboard/driver/map')}
            />

            {/* Corridor Legs & Risk Rating */}
            {route && <RouteSummary route={route} />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
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
