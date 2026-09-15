"use client";

import React, { useState, useEffect } from "react";
import { RiskPrediction } from "../types/riskTypes";
import { riskApi } from "../api/riskApi";
import { RiskScoreBadge } from "./RiskScoreBadge";
import { RiskFactorBreakdown } from "./RiskFactorBreakdown";
import { ModelVersionBadge } from "./ModelVersionBadge";
import {
  X,
  Sliders,
  RefreshCw,
  CloudRain,
  ShieldAlert,
  Database,
  Building,
  Activity,
} from "lucide-react";

interface Props {
  roadId: string | null;
  onClose: () => void;
}

export const RoadRiskModal: React.FC<Props> = ({ roadId, onClose }) => {
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rainfallOverride, setRainfallOverride] = useState<number>(50);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchRisk = async (override?: number) => {
    if (!roadId) return;
    if (override !== undefined) setIsSimulating(true);
    else setLoading(true);

    try {
      if (override !== undefined) {
        const data = await riskApi.predictCustomRisk(roadId, override);
        setPrediction(data);
      } else {
        const data = await riskApi.getRoadRisk(roadId);
        setPrediction(data);
      }
    } catch (e) {
      console.warn("Failed to load road risk", e);
    } finally {
      setLoading(false);
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (roadId) {
      fetchRisk();
    }
  }, [roadId]);

  if (!roadId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden space-y-4 p-5 text-left max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Corridor Risk Intelligence
              </span>
              <span className="text-xs font-mono text-slate-400">{roadId}</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-1">
              {prediction ? prediction.road_name : "Evaluating Highway Corridor..."}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
            <p className="text-xs">Extracting spatial GIS & weather features...</p>
          </div>
        ) : prediction ? (
          <>
            {/* Risk Score & Progress */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <RiskScoreBadge
                riskScore={prediction.risk_score}
                riskLevel={prediction.risk_level}
                confidencePct={prediction.confidence_pct}
                size="lg"
              />
              <p className="text-xs text-slate-300 leading-relaxed">
                {prediction.explanation_summary}
              </p>
            </div>

            {/* Contributing Factor Breakdown */}
            <RiskFactorBreakdown factors={prediction.contributing_factors} />

            {/* What-If Weather Simulator */}
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Interactive Monsoon Rainfall Simulator (What-If)</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {rainfallOverride} mm / 24h
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={rainfallOverride}
                onChange={(e) => setRainfallOverride(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Dry (0mm)</span>
                <button
                  type="button"
                  onClick={() => fetchRisk(rainfallOverride)}
                  disabled={isSimulating}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulating ? "animate-spin" : ""}`} />
                  <span>Simulate Risk</span>
                </button>
                <span className="text-[10px] text-slate-400">Extreme Monsoon (250mm)</span>
              </div>
            </div>

            {/* Data Source & Model Attribution */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>Feature Feeds: {prediction.data_sources.join(" • ")}</span>
              </div>
              <ModelVersionBadge modelVersion={prediction.model_version} />
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-xs text-red-400">
            Failed to load risk prediction profile.
          </div>
        )}
      </div>
    </div>
  );
};
