"use client";

import React from "react";
import { RiskFactor } from "../types/riskTypes";
import {
  CloudRain,
  Mountain,
  History,
  AlertTriangle,
  Car,
  TrendingUp,
  Info,
} from "lucide-react";

interface Props {
  factors: RiskFactor[];
}

export const RiskFactorBreakdown: React.FC<Props> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
        No significant hazard anomalies detected along this corridor.
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "WEATHER":
        return <CloudRain className="w-3.5 h-3.5 text-cyan-400" />;
      case "TERRAIN":
        return <Mountain className="w-3.5 h-3.5 text-amber-400" />;
      case "HISTORICAL":
        return <History className="w-3.5 h-3.5 text-purple-400" />;
      case "FIELD_REPORT":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case "TRAFFIC":
      default:
        return <Car className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const maxContribution = Math.max(...factors.map((f) => f.contribution_pts), 1);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Explainable Risk Drivers (SHAP Attribution)</span>
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">
          Top {factors.length} Drivers
        </span>
      </div>

      <div className="space-y-2">
        {factors.map((factor, idx) => {
          const isHighImpact = factor.contribution_pts >= 20.0;
          const barWidth = Math.min(100, Math.round((factor.contribution_pts / maxContribution) * 100));

          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getCategoryIcon(factor.category)}
                  </div>
                  <span className="font-semibold text-slate-200 truncate">{factor.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-[11px] text-slate-400">{factor.observed_value}</span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                      isHighImpact
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    +{factor.contribution_pts} pts
                  </span>
                </div>
              </div>

              {/* Contributing attribution bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isHighImpact ? "bg-red-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
