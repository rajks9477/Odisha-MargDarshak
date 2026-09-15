"use client";

import React from "react";
import { RouteRiskLevel } from "../types/routingTypes";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

interface Props {
  riskScore: number;
  riskLevel: RouteRiskLevel;
  showDisclaimer?: boolean;
}

export const RiskIndicator: React.FC<Props> = ({
  riskScore,
  riskLevel,
  showDisclaimer = true,
}) => {
  const getBadgeStyle = () => {
    switch (riskLevel) {
      case RouteRiskLevel.LOW:
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          bar: "bg-emerald-500",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case RouteRiskLevel.MEDIUM:
        return {
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          bar: "bg-amber-500",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case RouteRiskLevel.HIGH:
      case RouteRiskLevel.CRITICAL:
      default:
        return {
          bg: "bg-red-500/20 text-red-300 border-red-500/50",
          bar: "bg-red-500",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${style.bg}`}>
          {style.icon}
          <span>{riskLevel} RISK INDEX ({riskScore}/100)</span>
        </div>

        {showDisclaimer && (
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">
            [Demo Simulation Data]
          </span>
        )}
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${Math.min(Math.max(riskScore, 5), 100)}%` }}
        />
      </div>
    </div>
  );
};
