"use client";

import React from "react";
import { AnalyticsOverview } from "../types/analyticsTypes";
import {
  AlertTriangle,
  Clock,
  Truck,
  ShieldAlert,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Props {
  overview: AnalyticsOverview | null;
}

export const AnalyticsKPIGrid: React.FC<Props> = ({ overview }) => {
  if (!overview) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
      {/* KPI 1: Total Incidents */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <span className="text-[10px] text-slate-400 block uppercase">Verified Incidents</span>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-slate-100">{overview.total_verified_incidents}</span>
          <span className="text-[10px] text-red-400 font-bold flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" />+{overview.incident_change_pct}%
          </span>
        </div>
      </div>

      {/* KPI 2: Critical Disruptions */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <span className="text-[10px] text-slate-400 block uppercase">Critical Disruptions</span>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-red-400">{overview.critical_disruptions_count}</span>
          <span className="text-[10px] text-slate-500">Active</span>
        </div>
      </div>

      {/* KPI 3: Average Delay */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <span className="text-[10px] text-slate-400 block uppercase">Average Delay</span>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-amber-400">{overview.average_corridor_delay_hours}h</span>
          <span className="text-[10px] text-amber-400 font-bold flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" />+{overview.delay_change_pct}%
          </span>
        </div>
      </div>

      {/* KPI 4: Critical Medicine Consignments */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <span className="text-[10px] text-slate-400 block uppercase">ICU Relief Cargo</span>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-cyan-400">{overview.active_critical_shipments}</span>
          <span className="text-[10px] text-cyan-400 font-bold">Tracked</span>
        </div>
      </div>

      {/* KPI 5: Single Point Vulnerabilities */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <span className="text-[10px] text-slate-400 block uppercase">Single Points</span>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-purple-400">
            {overview.critical_infrastructure_vulnerabilities}
          </span>
          <span className="text-[10px] text-slate-500">Corridors</span>
        </div>
      </div>

      {/* KPI 6: Passability Health % */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <span className="text-[10px] text-slate-400 block uppercase">Network Health</span>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-emerald-400">{overview.network_health_index_pct}%</span>
          <span className="text-[10px] text-emerald-400 font-bold">Optimal</span>
        </div>
      </div>
    </div>
  );
};
