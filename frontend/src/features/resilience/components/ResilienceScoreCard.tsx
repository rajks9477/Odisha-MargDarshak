"use client";

import React from "react";
import Link from "next/link";
import { ResilienceAsset } from "../types/resilienceTypes";
import { ShieldAlert, AlertTriangle, CheckCircle2, Play, Building, ArrowRight } from "lucide-react";

interface Props {
  asset: ResilienceAsset;
}

export const ResilienceScoreCard: React.FC<Props> = ({ asset }) => {
  const isCritical = asset.criticality_level === "CRITICAL_SINGLE_POINT";

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-sans">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2.5 rounded-xl border ${
              isCritical
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {asset.district}, {asset.state}
            </span>
            <h3 className="text-sm font-bold text-slate-100">{asset.asset_name}</h3>
          </div>
        </div>

        {/* Resilience Score Badge */}
        <div className="text-right font-mono">
          <span className="text-[9px] text-slate-400 block uppercase">Resilience Index</span>
          <span
            className={`text-lg font-extrabold ${
              asset.resilience_score < 50 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {asset.resilience_score}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-500 block">Alternate Bypasses</span>
          <span className="text-slate-200 font-bold">
            {asset.alternate_routes_count === 0 ? "0 (Single Point)" : `${asset.alternate_routes_count} Bypasses`}
          </span>
        </div>

        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-500 block">Dependent Districts</span>
          <span className="text-cyan-400 font-bold">{asset.dependent_districts_count} Districts</span>
        </div>

        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-500 block">Daily Freight</span>
          <span className="text-purple-400 font-bold">{(asset.daily_freight_tonnage / 1000).toFixed(0)}k Tons/day</span>
        </div>
      </div>

      {/* Analytical Recommendation */}
      <div className="p-3 bg-amber-950/20 border border-amber-500/40 rounded-xl space-y-1">
        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">
          Analytical Engineering Recommendation
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">{asset.planning_recommendation}</p>
      </div>

      {/* One-Click Launch Simulation CTA */}
      <div className="pt-2 flex justify-end border-t border-slate-800">
        <Link
          href={`/dashboard/driver/simulation-engine?road_id=${asset.road_id}`}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-cyan-300" />
          <span>Launch What-If Simulation on this Asset</span>
        </Link>
      </div>
    </div>
  );
};
