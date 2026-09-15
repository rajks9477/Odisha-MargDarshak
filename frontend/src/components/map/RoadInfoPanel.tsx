"use client";

import React, { useState, useEffect } from "react";
import { RoadDetail } from "@/services/gisService";
import { RiskService, RiskPrediction, RiskLevel } from "@/services/riskService";
import { 
  Compass, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Gauge, 
  Truck, 
  X,
  Radio,
  Sparkles,
  RefreshCw,
  Sliders,
  Database,
  CloudRain,
  Mountain
} from "lucide-react";

interface RoadInfoPanelProps {
  road: RoadDetail | null;
  onClose: () => void;
}

export const RoadInfoPanel: React.FC<RoadInfoPanelProps> = ({ road, onClose }) => {
  const [riskPrediction, setRiskPrediction] = useState<RiskPrediction | null>(null);
  const [loadingRisk, setLoadingRisk] = useState<boolean>(false);
  const [rainfallOverride, setRainfallOverride] = useState<number | null>(null);
  const [showSim, setShowSim] = useState<boolean>(false);

  useEffect(() => {
    if (!road) return;
    setRainfallOverride(null);
    setShowSim(false);
    fetchRisk(road.id);
  }, [road]);

  const fetchRisk = async (roadId: string, rainOverride?: number) => {
    setLoadingRisk(true);
    try {
      const pred = await RiskService.predictRoadRisk(roadId, 6, rainOverride);
      setRiskPrediction(pred);
    } catch (err) {
      console.warn("Failed to fetch AI risk prediction", err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const handleRainfallChange = (val: number) => {
    setRainfallOverride(val);
    if (road) {
      fetchRisk(road.id, val);
    }
  };

  if (!road) return null;

  const statusConfig = {
    GREEN: {
      label: "ACCESSIBLE",
      badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-700",
      indicatorColor: "bg-emerald-400",
      description: "Road fully operational. Normal 2-way traffic flow.",
    },
    YELLOW: {
      label: "CAUTION / MINOR DISRUPTION",
      badgeColor: "bg-amber-950 text-amber-300 border-amber-700",
      indicatorColor: "bg-amber-400",
      description: "Wet surface, light mud or single-lane passing. Drive cautiously.",
    },
    ORANGE: {
      label: "MAJOR DISRUPTION / HIGH RISK",
      badgeColor: "bg-orange-950 text-orange-300 border-orange-700",
      indicatorColor: "bg-orange-500",
      description: "Active mud accumulation / hill slide watch. Heavy vehicle regulation.",
    },
    RED: {
      label: "BLOCKED / INACCESSIBLE",
      badgeColor: "bg-rose-950 text-rose-300 border-rose-700",
      indicatorColor: "bg-rose-500",
      description: "Road impassable. Rockfall or bridge disruption. Convoys stopped.",
    },
  }[road.status] || {
    label: "DATA UNAVAILABLE",
    badgeColor: "bg-slate-900 text-slate-300 border-slate-700",
    indicatorColor: "bg-slate-400",
    description: "Status information currently being verified by field engineer.",
  };

  const getRiskScoreBadge = (score: number, level: RiskLevel) => {
    let color = "bg-emerald-950 text-emerald-300 border-emerald-700";
    if (level === RiskLevel.CRITICAL) color = "bg-rose-950 text-rose-300 border-rose-700";
    else if (level === RiskLevel.HIGH) color = "bg-orange-950 text-orange-300 border-orange-700";
    else if (level === RiskLevel.MEDIUM) color = "bg-yellow-950 text-yellow-300 border-yellow-700";

    return (
      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${color}`}>
        {score} / 100 ({level})
      </span>
    );
  };

  return (
    <div className="absolute bottom-16 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-auto sm:w-[440px] z-[1000] bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl p-5 text-xs space-y-4 animate-in fade-in slide-in-from-bottom-4 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white">
              {road.road_number}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {road.road_type}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white leading-snug">{road.road_name}</h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* AI Road Risk Intelligence HUD */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-900/60 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> AI Disruption Risk Prediction
          </div>
          {riskPrediction && getRiskScoreBadge(riskPrediction.risk_score, riskPrediction.risk_level)}
        </div>

        {loadingRisk ? (
          <div className="flex items-center justify-center gap-2 py-2 text-slate-400 text-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>Evaluating ML environmental features...</span>
          </div>
        ) : riskPrediction ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Model: <strong className="text-purple-300">{riskPrediction.model_version}</strong></span>
              <span>Confidence: <strong className="text-emerald-400">{riskPrediction.confidence_pct}%</strong></span>
            </div>

            {/* Contributing Factors Breakdown */}
            {riskPrediction.contributing_factors && riskPrediction.contributing_factors.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                  <span>Main Contributing Factors (SHAP Analysis):</span>
                </div>
                <div className="space-y-1">
                  {riskPrediction.contributing_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[10.5px]"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200">{factor.name}</div>
                        <div className="text-[9.5px] text-slate-400">{factor.observed_value}</div>
                      </div>
                      <span className="font-mono font-bold text-purple-300 text-[10px] bg-purple-950 px-1.5 py-0.5 rounded border border-purple-900">
                        +{factor.contribution_pts} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Telemetry Sources */}
            <div className="text-[9.5px] text-slate-500 flex items-center gap-1 pt-1">
              <Database className="w-3 h-3 text-slate-500" />
              <span>Telemetry: IMD Automatic Weather Station • GSI Landslide Atlas • VIMS Telemetry</span>
            </div>
          </div>
        ) : null}

        {/* Interactive Simulation Toggle */}
        <div className="pt-1 border-t border-purple-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSim(!showSim)}
            className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
          >
            <Sliders className="w-3 h-3" />
            <span>{showSim ? "Hide Rainfall Simulation" : "Simulate Rainfall Surge"}</span>
          </button>
        </div>

        {showSim && (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[10px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1"><CloudRain className="w-3 h-3 text-blue-400" /> 24h Rainfall:</span>
              <strong className="text-blue-300 font-mono">{rainfallOverride ?? 115} mm</strong>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={rainfallOverride ?? 115}
              onChange={(e) => handleRainfallChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[8.5px] text-slate-500 font-mono">
              <span>0mm (Dry)</span>
              <span>80mm (Heavy)</span>
              <span>200mm (Cloudburst)</span>
            </div>
          </div>
        )}
      </div>

      {/* 4-Tier Accessibility Status */}
      <div className={`p-3 rounded-xl border ${statusConfig.badgeColor} space-y-1`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold tracking-wide">
            <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.indicatorColor} animate-pulse`} />
            <span>{statusConfig.label}</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">
            Updated {new Date(road.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[11px] opacity-90 leading-snug">
          {road.status_reason || statusConfig.description}
        </p>
      </div>

      {/* Corridor Specifications */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" /> Jurisdiction
          </div>
          <div className="font-bold text-slate-200">{road.district_name}, {road.state}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-blue-400" /> Avg Speed
          </div>
          <div className="font-bold text-slate-200">{road.average_speed_kmh} km/h (Mountain terrain)</div>
        </div>
      </div>

      {/* Nearby Active Incidents */}
      {road.nearby_incidents && road.nearby_incidents.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reported Hazards along this Corridor</span>
          </div>

          <div className="space-y-1.5">
            {road.nearby_incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/80 text-[11px] text-rose-200 space-y-1"
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{inc.type.replace("_", " ")}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-900 text-rose-300">
                    {inc.severity}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">{inc.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-emerald-300 text-[11px]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>No active blockage or hazard reports along this section.</span>
        </div>
      )}
    </div>
  );
};
