"use client";

import React from "react";
import { RiskLevel } from "../types/riskTypes";
import { ShieldCheck, AlertTriangle, ShieldAlert, Zap } from "lucide-react";

interface Props {
  riskScore: number;
  riskLevel: RiskLevel;
  confidencePct?: number;
  size?: "sm" | "md" | "lg";
}

export const RiskScoreBadge: React.FC<Props> = ({
  riskScore,
  riskLevel,
  confidencePct,
  size = "md",
}) => {
  const getStyle = () => {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          bar: "bg-emerald-500",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case RiskLevel.MEDIUM:
        return {
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          bar: "bg-amber-500",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case RiskLevel.HIGH:
        return {
          bg: "bg-orange-500/20 text-orange-300 border-orange-500/50",
          bar: "bg-orange-500",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
        };
      case RiskLevel.CRITICAL:
      default:
        return {
          bg: "bg-red-500/20 text-red-300 border-red-500/60 shadow-lg shadow-red-950/30",
          bar: "bg-red-500",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
        };
    }
  };

  const style = getStyle();

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${style.bg}`}>
        {style.icon}
        <span>{riskScore}/100</span>
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-extrabold ${style.bg}`}>
          {style.icon}
          <span>{riskLevel} RISK ({riskScore}/100)</span>
        </div>

        {confidencePct !== undefined && (
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>{confidencePct}% Confidence</span>
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${Math.min(Math.max(riskScore, 5), 100)}%` }}
        />
      </div>
    </div>
  );
};
