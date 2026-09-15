"use client";

import React, { useState, useEffect } from "react";
import { RouteRiskPrediction } from "../types/riskTypes";
import { riskApi } from "../api/riskApi";
import { RiskScoreBadge } from "./RiskScoreBadge";
import { RiskFactorBreakdown } from "./RiskFactorBreakdown";
import { ModelVersionBadge } from "./ModelVersionBadge";
import {
  ShieldAlert,
  AlertTriangle,
  Layers,
  MapPin,
  RefreshCw,
  TrendingDown,
  Info,
} from "lucide-react";

interface Props {
  routeId: string;
}

export const RouteRiskSummaryCard: React.FC<Props> = ({ routeId }) => {
  const [prediction, setPrediction] = useState<RouteRiskPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (routeId) {
      setLoading(true);
      riskApi.predictRouteRisk(routeId)
        .then(setPrediction)
        .catch(console.warn)
        .finally(() => setLoading(false));
    }
  }, [routeId]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
        <span>Evaluating composite corridor hazard risk...</span>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">Composite Route Risk Intelligence</h3>
            <p className="text-[10px] text-slate-400">Integrated terrain, weather & incident model</p>
          </div>
        </div>

        <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          ML Pipeline
        </span>
      </div>

      {/* Score Badge */}
      <RiskScoreBadge
        riskScore={prediction.composite_risk_score}
        riskLevel={prediction.composite_risk_level}
        confidencePct={prediction.confidence_pct}
      />

      {/* Summary Narrative */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
        {prediction.explanation_summary}
      </div>

      {/* Top Bottleneck Hazard */}
      {prediction.max_hazard_segment_name !== "None" && (
        <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-900/50 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-amber-400 font-bold uppercase">Highest Risk Bottleneck</div>
              <div className="font-semibold truncate">{prediction.max_hazard_segment_name}</div>
            </div>
          </div>
          <span className="font-bold text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 font-mono">
            {prediction.max_hazard_risk_score}/100
          </span>
        </div>
      )}

      {/* Contributing Factors */}
      {prediction.top_contributing_factors && prediction.top_contributing_factors.length > 0 && (
        <RiskFactorBreakdown factors={prediction.top_contributing_factors} />
      )}

      {/* Model Version Tag */}
      <ModelVersionBadge modelVersion={prediction.model_version} />
    </div>
  );
};
