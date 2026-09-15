"use client";

import React, { useState, useEffect } from "react";
import { RoadRiskSummary, RiskLevel } from "../types/riskTypes";
import { riskApi } from "../api/riskApi";
import { RiskScoreBadge } from "./RiskScoreBadge";
import { RoadRiskModal } from "./RoadRiskModal";
import { ModelVersionBadge } from "./ModelVersionBadge";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Filter,
  Brain,
  AlertTriangle,
} from "lucide-react";

export const RiskIntelligenceView: React.FC = () => {
  const [summaries, setSummaries] = useState<RoadRiskSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [inspectRoadId, setInspectRoadId] = useState<string | null>(null);

  const fetchSummaries = () => {
    setLoading(true);
    riskApi.getCorridorSummary()
      .then(setSummaries)
      .catch(console.warn)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const filtered = summaries.filter((item) => {
    if (selectedLevel !== "ALL" && item.risk_level !== selectedLevel) return false;
    if (searchQuery.trim() && !item.road_name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.road_id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Model Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Regional Road Risk Intelligence</h2>
            <p className="text-xs text-slate-400">
              AI gradient boosting classification across North East highway corridors
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSummaries}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          <span>Refresh AI Predictions</span>
        </button>
      </div>

      <ModelVersionBadge />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search corridor by name (e.g. NH-6, Sonapur, Shillong)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLevel === lvl
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Corridor Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
          <p>Analyzing weather stations and elevation models...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-500">
          No corridors matched the selected search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div
              key={item.road_id}
              onClick={() => setInspectRoadId(item.road_id)}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer space-y-3 group shadow-lg hover:shadow-emerald-950/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-slate-400">{item.road_id}</span>
                  <h3 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                    {item.road_name}
                  </h3>
                </div>
                <RiskScoreBadge riskScore={item.risk_score} riskLevel={item.risk_level} size="sm" />
              </div>

              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Primary Contributing Hazard:</div>
                <p className="truncate text-amber-300/90">{item.primary_hazard}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>{item.confidence_pct}% Confidence</span>
                <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  <span>Inspect Explainability</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Road Segment Detail & What-If Simulation Modal */}
      <RoadRiskModal
        roadId={inspectRoadId}
        onClose={() => setInspectRoadId(null)}
      />
    </div>
  );
};
