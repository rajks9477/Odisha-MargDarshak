"use client";

import React, { useState, useEffect } from "react";
import { 
  TrackingService, 
  TrackingSession 
} from "@/services/trackingService";
import { GpsTelemetry, LocationService } from "@/services/locationService";
import { 
  Navigation, 
  Play, 
  Pause, 
  Square, 
  Truck, 
  Radio, 
  Clock, 
  Compass, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Gauge
} from "lucide-react";

interface TrackingControlBarProps {
  gps?: GpsTelemetry | null;
  onSessionUpdated?: (session: TrackingSession | null) => void;
  className?: string;
}

export const TrackingControlBar: React.FC<TrackingControlBarProps> = ({
  gps,
  onSessionUpdated,
  className = "",
}) => {
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionBusy, setIsActionBusy] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showStopConfirm, setShowStopConfirm] = useState<boolean>(false);

  // 1. Fetch initial tracking session
  const loadActiveSession = async () => {
    try {
      const active = await TrackingService.getCurrentSession();
      setSession(active);
      if (onSessionUpdated) onSessionUpdated(active);
    } catch (err) {
      console.error("Failed to load active tracking session", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveSession();
  }, []);

  // 2. Elapsed Time Counter
  useEffect(() => {
    if (!session || session.status !== "ACTIVE") return;

    const startEpoch = new Date(session.start_time).getTime();
    const updateElapsed = () => {
      const sec = Math.floor((Date.now() - startEpoch) / 1000);
      setElapsedSeconds(Math.max(0, sec));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // 3. Continuously send GPS pings when tracking is ACTIVE
  useEffect(() => {
    if (!session || session.status !== "ACTIVE" || !gps) return;

    TrackingService.sendLocationPing(session.session_id, gps)
      .then((pingRes) => {
        if (pingRes) {
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  total_distance_km: pingRes.total_distance_km,
                  ping_count: pingRes.ping_count,
                }
              : prev
          );
        }
      })
      .catch((err) => {
        console.warn("[Tracking] GPS sync deferred or failed", err);
      });
  }, [gps, session]);

  const handleStart = async () => {
    setIsActionBusy(true);
    try {
      const newSession = await TrackingService.startTracking({
        startLat: gps?.latitude || 26.180,
        startLon: gps?.longitude || 91.730,
        notes: "Live Consignment Tracking Dispatch",
      });
      setSession(newSession);
      if (onSessionUpdated) onSessionUpdated(newSession);
    } catch (err: any) {
      alert(err.detail || "Failed to start tracking session");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handlePause = async () => {
    if (!session) return;
    setIsActionBusy(true);
    try {
      await TrackingService.pauseTracking(session.session_id, "Driver rest / mountain halt");
      setSession({ ...session, status: "PAUSED" });
    } catch (err: any) {
      alert(err.detail || "Failed to pause tracking");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleResume = async () => {
    if (!session) return;
    setIsActionBusy(true);
    try {
      await TrackingService.resumeTracking(session.session_id);
      setSession({ ...session, status: "ACTIVE" });
    } catch (err: any) {
      alert(err.detail || "Failed to resume tracking");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleStop = async () => {
    if (!session) return;
    setIsActionBusy(true);
    try {
      const completed = await TrackingService.stopTracking(
        session.session_id,
        gps?.latitude,
        gps?.longitude,
        "Consignment reached destination"
      );
      setSession(null);
      setShowStopConfirm(false);
      if (onSessionUpdated) onSessionUpdated(null);
    } catch (err: any) {
      alert(err.detail || "Failed to stop tracking session");
    } finally {
      setIsActionBusy(false);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse ${className}`}>
        <div className="h-10 bg-slate-800 rounded-xl w-full" />
      </div>
    );
  }

  // State A: NOT TRACKING
  if (!session || session.status === "COMPLETED" || session.status === "CANCELLED") {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">Carrier Fleet Readiness</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                STANDBY
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Assigned Vehicle: <strong className="text-slate-200 font-mono">AS-01-GC-9104</strong> • GPS Telemetry Ready
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={isActionBusy}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all hover:scale-105 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Start Vehicle Tracking</span>
        </button>
      </div>
    );
  }

  // State B: TRACKING ACTIVE or PAUSED
  const isActive = session.status === "ACTIVE";

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xl transition-all space-y-4 ${
      isActive
        ? "bg-slate-950/95 border-emerald-500/80 shadow-emerald-950/30"
        : "bg-slate-950/95 border-amber-500/80 shadow-amber-950/30"
    } ${className}`}>
      {/* Top Header & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isActive ? "bg-emerald-400 animate-ping" : "bg-amber-400"
          }`} />

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold tracking-wide uppercase ${
                isActive ? "text-emerald-400" : "text-amber-400"
              }`}>
                {isActive ? "● Live Vehicle Tracking Active" : "⏸️ Tracking Paused (Rest Period)"}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {session.session_id}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Carrier: <strong className="text-white font-mono">{session.vehicle_number || "AS-01-GC-9104"}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons: Pause / Resume / Stop */}
        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              type="button"
              onClick={handlePause}
              disabled={isActionBusy}
              className="px-3.5 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Pause className="w-3.5 h-3.5 fill-amber-300" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResume}
              disabled={isActionBusy}
              className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-300" />
              <span>Resume</span>
            </button>
          )}

          {showStopConfirm ? (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <button
                type="button"
                onClick={handleStop}
                disabled={isActionBusy}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-colors"
              >
                Confirm Stop
              </button>
              <button
                type="button"
                onClick={() => setShowStopConfirm(false)}
                className="px-2 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowStopConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-rose-300" />
              <span>Stop Tracking</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-400" /> Distance Covered
          </div>
          <div className="text-sm font-black text-white font-mono">
            {session.total_distance_km.toFixed(2)} km
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Duration
          </div>
          <div className="text-sm font-black text-white font-mono">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Current Speed
          </div>
          <div className="text-sm font-black text-emerald-400 font-mono">
            {gps ? Math.round(gps.speed) : 0} km/h
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-purple-400" /> GPS Pings
          </div>
          <div className="text-sm font-black text-slate-200 font-mono">
            {session.ping_count} Logged
          </div>
        </div>
      </div>
    </div>
  );
};
