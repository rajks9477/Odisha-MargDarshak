"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, AlertTriangle, ShieldCheck, Wifi, Loader2 } from "lucide-react";
import { IncidentReportRecord, IncidentStatus } from "../types/incidentTypes";
import { IncidentService } from "../services/incidentService";
import { IncidentLocalStore } from "../storage/incidentLocalStore";
import { IncidentStatusCard } from "../components/IncidentStatusCard";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";

export const MyIncidentsScreen: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentReportRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "VERIFIED" | "RESOLVED">("ALL");
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchIncidents = async () => {
    try {
      const data = await IncidentService.getMyIncidents();
      setIncidents(data);
    } catch (e) {
      console.warn("Failed to load driver incidents", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      checkSyncQueue();
    }
  };

  const checkSyncQueue = () => {
    const queue = IncidentLocalStore.getSyncQueue();
    setPendingSyncCount(queue.filter((q) => q.sync_status !== "SYNCED").length);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await IncidentService.syncOfflineReports();
      await fetchIncidents();
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredIncidents = incidents.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return item.status === IncidentStatus.PENDING_VERIFICATION || item.status === IncidentStatus.UNDER_REVIEW;
    if (activeTab === "VERIFIED") return item.status === IncidentStatus.VERIFIED;
    if (activeTab === "RESOLVED") return item.status === IncidentStatus.RESOLVED;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/driver"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-100">My Incident Reports</h1>
            <p className="text-[11px] text-slate-400">Track verification status of reported hazards</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchIncidents();
            }}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          <Link
            href="/dashboard/driver/report-incident"
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </Link>
        </div>
      </header>

      {/* Offline Sync Banner if pending */}
      {pendingSyncCount > 0 && (
        <div className="bg-amber-950/60 border-b border-amber-800/60 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{pendingSyncCount} offline report{pendingSyncCount > 1 ? "s" : ""} waiting for sync</span>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sync Now"}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: "ALL", label: "All Reports" },
          { key: "PENDING", label: "Pending Verification" },
          { key: "VERIFIED", label: "Verified Hazards" },
          { key: "RESOLVED", label: "Resolved" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs">Loading incident reports...</span>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-300">No Incidents Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You have not submitted any reports under this category.
              </p>
            </div>
            <Link
              href="/dashboard/driver/report-incident"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold hover:bg-emerald-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Report Road Incident</span>
            </Link>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <IncidentStatusCard key={incident.id} incident={incident} />
          ))
        )}
      </main>

      <DriverBottomNav />
    </div>
  );
};
