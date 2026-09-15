"use client";

import React, { useState } from "react";
import { ExternalConnector } from "../types/integrationTypes";
import {
  Cable,
  CloudSun,
  Satellite,
  Map,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface Props {
  connectors: ExternalConnector[];
  onSync: (connectorId: string) => Promise<void>;
}

export const ConnectorTable: React.FC<Props> = ({ connectors, onSync }) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const getConnectorIcon = (type: string) => {
    switch (type) {
      case "WEATHER_API":
        return <CloudSun className="w-4 h-4 text-amber-400" />;
      case "SATELLITE_CATALOG":
        return <Satellite className="w-4 h-4 text-cyan-400" />;
      case "GIS_VECTOR":
        return <Map className="w-4 h-4 text-blue-400" />;
      case "DISASTER_FEED":
        return <Radio className="w-4 h-4 text-red-400" />;
      default:
        return <Cable className="w-4 h-4 text-purple-400" />;
    }
  };

  const handleTriggerSync = async (id: string) => {
    setSyncingId(id);
    try {
      await onSync(id);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl font-sans">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
          <tr>
            <th className="p-3.5">Connector / Data Source</th>
            <th className="p-3.5">Protocol & Type</th>
            <th className="p-3.5">Coverage / Scope</th>
            <th className="p-3.5">Refresh Cycle</th>
            <th className="p-3.5">Ingested Records</th>
            <th className="p-3.5">Pipeline Status</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
          {connectors.map((c) => (
            <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="p-3.5 font-sans">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {getConnectorIcon(c.connector_type)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 block text-xs">{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{c.license_type}</span>
                  </div>
                </div>
              </td>
              <td className="p-3.5">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">
                  {c.connector_type}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">{c.auth_type}</span>
              </td>
              <td className="p-3.5 text-slate-300 font-sans text-[11px]">
                {c.geographic_coverage}
              </td>
              <td className="p-3.5 text-slate-300">
                Every {c.refresh_interval_minutes}m
              </td>
              <td className="p-3.5 text-slate-100 font-bold">
                {c.total_records_ingested.toLocaleString()}
              </td>
              <td className="p-3.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{c.status}</span>
                </span>
              </td>
              <td className="p-3.5 text-right">
                <button
                  type="button"
                  disabled={syncingId === c.id}
                  onClick={() => handleTriggerSync(c.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-cyan-500/30 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingId === c.id ? "animate-spin" : ""}`} />
                  <span>{syncingId === c.id ? "Syncing..." : "Sync Now"}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
