"use client";

import React from "react";
import { SimulationResult } from "../types/simulationTypes";
import { ArrowRight, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface Props {
  result: SimulationResult;
}

export const RouteComparisonCard: React.FC<Props> = ({ result }) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Before vs. After Route Comparison</span>
        </h3>
        <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Smart Routing Engine V2.4
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
        {/* Primary Baseline Route (Disrupted) */}
        <div className="p-3 bg-red-950/20 border border-red-500/40 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-red-400 font-bold uppercase">Primary Trunk Corridor</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 font-bold border border-red-800">
              DISRUPTED
            </span>
          </div>
          <div className="text-xs font-bold text-slate-100">{result.scenario.target_road_name}</div>
          <div className="text-[10px] text-slate-400">Baseline Distance: 285 km | Normal Transit: 6.5h</div>
        </div>

        {/* Recommended Emergency Alternate Bypass */}
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Emergency Bypass Route</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
              CLEAR (ACCESSIBLE)
            </span>
          </div>
          <div className="text-xs font-bold text-slate-100">{result.alternate_route_name}</div>
          <div className="text-[10px] text-slate-400">
            Alternate Distance: 340 km | Extra Delay: +{result.extra_delay_hours}h
          </div>
        </div>
      </div>

      {/* Summary Markdown text */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
        {result.summary_markdown}
      </div>
    </div>
  );
};
