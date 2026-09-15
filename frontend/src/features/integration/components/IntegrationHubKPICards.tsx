"use client";

import React from "react";
import { IntegrationHubSummary } from "../types/integrationTypes";
import { Cable, CheckCircle2, Database, Clock, Activity } from "lucide-react";

interface Props {
  summary: IntegrationHubSummary | null;
}

export const IntegrationHubKPICards: React.FC<Props> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Adapters Active</span>
          <Cable className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="text-xl font-extrabold text-slate-100 block">
          {summary.healthy_connectors} / {summary.total_connectors}
        </span>
        <span className="text-[10px] text-emerald-400 font-bold">100% Operational</span>
      </div>

      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Ingested Records</span>
          <Database className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-xl font-extrabold text-purple-400 block">
          {summary.total_ingested_records.toLocaleString()}
        </span>
        <span className="text-[10px] text-slate-500">Staged & Promoted</span>
      </div>

      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Telemetry Freshness</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-xl font-extrabold text-amber-400 block">
          {summary.data_freshness_pct}%
        </span>
        <span className="text-[10px] text-emerald-400 font-bold">&lt; 15 min latency</span>
      </div>

      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Ingestion Engine</span>
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <span className="text-xl font-extrabold text-emerald-400 block">HEALTHY</span>
        <span className="text-[10px] text-slate-500">PostGIS Staging</span>
      </div>
    </div>
  );
};
