"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DriverAlert,
  AlertSeverity,
  AlertType,
} from "../types/alertTypes";
import { AlertService } from "../services/alertService";
import { alertsApi } from "../api/alertsApi";
import { useAlertsWebSocket } from "../hooks/useAlertsWebSocket";
import { NotificationWebService } from "../services/notificationWebService";
import { AlertFilterTabs, AlertFilterTabKey } from "../components/AlertFilterTabs";
import { AlertCard } from "../components/AlertCard";
import { AlertDetailModal } from "../components/AlertDetailModal";
import { EmergencyBroadcastBanner } from "../components/EmergencyBroadcastBanner";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { OfflineNotice } from "@/components/driver/OfflineNotice";
import {
  ArrowLeft,
  RefreshCw,
  CheckCheck,
  Bell,
  BellRing,
  ShieldAlert,
  Wifi,
  WifiOff,
  Radio,
  Loader2,
} from "lucide-react";

export const DriverAlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<DriverAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AlertFilterTabKey>("ALL");
  const [selectedAlert, setSelectedAlert] = useState<DriverAlert | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Real-time WebSocket
  const { isConnected, reconnect } = useAlertsWebSocket((newAlert) => {
    setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
  });

  const fetchAlerts = async () => {
    try {
      const data = await AlertService.getAlerts();
      setAlerts(data);
    } catch (e) {
      console.warn("Failed to load driver alerts", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    if (NotificationWebService.isSupported()) {
      setNotifPermission(NotificationWebService.getPermission());
    }
  }, []);

  const handleRequestPermission = async () => {
    const perm = await NotificationWebService.requestPermission();
    setNotifPermission(perm);
  };

  const handleMarkAllRead = async () => {
    try {
      await alertsApi.markAllAlertsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true, status: "READ" as any })));
    } catch {
      // Offline fallback
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    }
  };

  const handleAcknowledge = async (alertId: string, notes?: string) => {
    await AlertService.acknowledge(alertId, notes);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, is_read: true, is_acknowledged: true, status: "ACKNOWLEDGED" as any }
          : a
      )
    );
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await alertsApi.dismissAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
  };

  // Filter logic
  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "CRITICAL") return alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH;
    if (activeTab === "UNREAD") return !alert.is_read;
    if (activeTab === "WEATHER") return alert.type === AlertType.FLOOD_WARNING || alert.type === AlertType.LANDSLIDE_WARNING;
    if (activeTab === "INCIDENTS") return alert.type === AlertType.ROAD_BLOCKAGE || alert.type === AlertType.BRIDGE_CLOSURE || alert.type === AlertType.TRAFFIC_DISRUPTION;
    if (activeTab === "DIRECTIVES") return alert.type === AlertType.GOVERNMENT_DIRECTIVE || alert.type === AlertType.EMERGENCY_INSTRUCTION || alert.type === AlertType.TRIP_UPDATE;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const criticalCount = alerts.filter((a) => (a.severity === AlertSeverity.CRITICAL || a.severity === AlertSeverity.HIGH) && !a.is_acknowledged).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/driver"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">Driver Alerts & Safety</h1>
              {isConnected ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.2 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Stream
                </span>
              ) : (
                <button
                  type="button"
                  onClick={reconnect}
                  className="flex items-center gap-1 text-[10px] text-slate-400 font-medium px-2 py-0.2 bg-slate-800 rounded-full border border-slate-700"
                >
                  <WifiOff className="w-2.5 h-2.5" />
                  Offline Stream
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Live corridor broadcasts & PWD directives</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchAlerts();
            }}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Read All</span>
            </button>
          )}
        </div>
      </header>

      {/* Emergency Broadcast Top Banner if active */}
      <EmergencyBroadcastBanner />

      <OfflineNotice />

      {/* Notification Permission Request Banner */}
      {notifPermission === "default" && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Enable browser push notifications for instant critical road hazard alerts.</span>
          </div>
          <button
            type="button"
            onClick={handleRequestPermission}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Enable
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="px-4 pt-3 max-w-2xl w-full mx-auto">
        <AlertFilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCount={unreadCount}
          criticalCount={criticalCount}
        />
      </div>

      {/* Alert Feed */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs">Fetching active notifications...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <Bell className="w-12 h-12 mx-auto text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-300">No Notifications in this Category</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Corridor is currently clear of directives under the selected filter.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              View All Alerts
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={(id) => handleAcknowledge(id)}
              onDismiss={(id) => handleDismiss(id)}
              onOpenDetail={(a) => setSelectedAlert(a)}
            />
          ))
        )}
      </main>

      {/* Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAcknowledge={(id, notes) => handleAcknowledge(id, notes)}
      />

      <DriverBottomNav />
    </div>
  );
};
