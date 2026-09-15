"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { DriverProfile, DriverAlert, DriverService } from "@/services/driverService";
import { DriverHeader } from "@/components/driver/DriverHeader";
import { QuickActionGrid } from "@/components/driver/QuickActionGrid";
import { VehicleStatusCard } from "@/components/driver/VehicleStatusCard";
import { ActiveTripSummary } from "@/components/driver/ActiveTripSummary";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { OfflineNotice } from "@/components/driver/OfflineNotice";
import { DriverSkeleton } from "@/components/driver/DriverSkeleton";
import { TrackingControlBar } from "@/components/tracking/TrackingControlBar";
import { DriverRouteHazardAlert } from "@/components/driver/DriverRouteHazardAlert";
import { DriverOperationalActionsCard } from "@/components/driver/DriverOperationalActionsCard";
import { 
  AlertCircle, 
  RefreshCw, 
  ShieldAlert, 
  Lock 
} from "lucide-react";

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [alerts, setAlerts] = useState<DriverAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDriverData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [profData, alertsData] = await Promise.all([
        DriverService.getProfile(),
        DriverService.getAlerts(),
      ]);

      setProfile(profData);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error("Failed to load driver dashboard data", err);
      setErrorMessage(err.detail || "Unable to load driver telemetry. Please check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, []);

  // Strict RBAC UI guard
  if (user && user.role !== "DRIVER") {
    return (
      <div className="bg-rose-950/50 border border-rose-800 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Restricted Driver Console</h2>
        <p className="text-xs text-slate-300">
          Your current authenticated role is <strong>{user.role}</strong>. This dashboard requires the <strong>DRIVER</strong> role credentials.
        </p>
      </div>
    );
  }

  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Offline Connectivity Detector */}
      <OfflineNotice />

      {/* Error state with retry */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={loadDriverData}
            className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading ? (
        <DriverSkeleton />
      ) : profile ? (
        <>
          {/* Driver identity & Live Availability toggle */}
          <DriverHeader 
            profile={profile} 
            onProfileUpdated={(updated) => setProfile(updated)} 
          />

          {/* Live Vehicle Tracking Control Console */}
          <TrackingControlBar />

          {/* Two Boxes Side-by-Side: Reported Hazard Alert (Left) + Driver Operational Actions / Navigator (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Box 1: Real-time Field Officer Geo-Tagged Incident & Route Hazard Alert */}
            <DriverRouteHazardAlert 
              trip={profile.active_trip} 
              onDetourAccepted={(detourName) => {
                if (profile.active_trip) {
                  setProfile({
                    ...profile,
                    active_trip: {
                      ...profile.active_trip,
                      notes: `Navigating via ${detourName} (Bypassing active hill blockage).`,
                    }
                  });
                }
              }}
            />

            {/* Box 2: Driver Operational Actions & Google Map Route Navigator */}
            <DriverOperationalActionsCard />
          </div>

          {/* 4 Main Action Cards & Advanced Telemetry Modules */}
          <QuickActionGrid unreadAlertCount={unreadAlertsCount} />

          {/* Active Trip & Vehicle specs grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActiveTripSummary trip={profile.active_trip} />
            <VehicleStatusCard vehicle={profile.assigned_vehicle} />
          </div>
        </>
      ) : null}

      {/* Mobile-first bottom navigation */}
      <DriverBottomNav unreadAlertCount={unreadAlertsCount} />
    </div>
  );
}
