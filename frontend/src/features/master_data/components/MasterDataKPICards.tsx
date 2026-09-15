"use client";

import React from "react";
import { MasterEntitySummary } from "../types/masterDataTypes";
import { Database, Route, GitFork, Building, Truck, ShieldCheck } from "lucide-react";

interface Props {
  summary: MasterEntitySummary | null;
}

export const MasterDataKPICards: React.FC<Props> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Road Corridors</span>
          <Route className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <span className="text-xl font-extrabold text-slate-100 block">{summary.total_roads}</span>
        <span className="text-[10px] text-slate-500">PostGIS Segments</span>
      </div>

      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Bridges & Passes</span>
          <GitFork className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-xl font-extrabold text-amber-400 block">{summary.total_bridges}</span>
        <span className="text-[10px] text-slate-500">Critical Crossings</span>
      </div>

      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Critical Facilities</span>
          <Building className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="text-xl font-extrabold text-cyan-400 block">{summary.total_facilities}</span>
        <span className="text-[10px] text-emerald-400 font-bold">{summary.active_facilities_count} Active</span>
      </div>

      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Logistics Hubs</span>
          <Database className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-xl font-extrabold text-purple-400 block">{summary.total_warehouses}</span>
        <span className="text-[10px] text-slate-500">Regional Depots</span>
      </div>

      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase">Fleet Vehicles</span>
          <Truck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <span className="text-xl font-extrabold text-emerald-400 block">{summary.total_vehicles}</span>
        <span className="text-[10px] text-slate-500">Assigned Carriers</span>
      </div>
    </div>
  );
};
