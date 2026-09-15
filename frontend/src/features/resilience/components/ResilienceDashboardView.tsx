"use client";

import React, { useState, useEffect } from "react";
import { ResilienceAsset, ResilienceSummary } from "../types/resilienceTypes";
import { resilienceApi } from "../api/resilienceApi";
import { ResilienceScoreCard } from "./ResilienceScoreCard";
import {
  ShieldAlert,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from "lucide-react";

export const ResilienceDashboardView: React.FC = () => {
  const [summary, setSummary] = useState<ResilienceSummary | null>(null);
  const [assets, setAssets] = useState<ResilienceAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedState, setSelectedState] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, rankData] = await Promise.all([
        resilienceApi.getSummary(),
        resilienceApi.getRankings(selectedState),
      ]);
      setSummary(sumData);
      setAssets(rankData);
    } catch (e) {
      console.warn("Failed to load resilience data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedState]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Resilience & Infrastructure Planning</h2>
            <p className="text-xs text-slate-400">
              Multi-factorial vulnerability scoring & priority strengthening recommendations across NER corridors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
          >
            <option value="ALL">All 8 NE States</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Assam">Assam</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Mizoram">Mizoram</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Provenance Disclaimer */}
      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-[10px]">
        <span className="text-slate-400">
          Analytical Decision Support: Scores provide recommendations for human engineering officers
        </span>
        <span className="text-amber-400 font-bold">[Demo Analytical Model]</span>
      </div>

      {/* Executive KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 block">Evaluated Infrastructure</span>
          <span className="text-lg font-extrabold text-slate-100">
            {summary?.total_assets_evaluated || 3} Assets
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 block">Critical Single Points</span>
          <span className="text-lg font-extrabold text-red-400">
            {summary?.critical_single_points_count || 1} Single Points
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 block">High Dependency Corridors</span>
          <span className="text-lg font-extrabold text-amber-400">
            {summary?.high_dependency_count || 1} Corridors
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 block">Average Network Resilience</span>
          <span className="text-lg font-extrabold text-emerald-400">
            {summary?.average_network_resilience_score || 50.7}%
          </span>
        </div>
      </div>

      {/* Ranked Infrastructure Assets */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>Priority Ranked Vulnerable Assets ({assets.length})</span>
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400" />
            <span>Computing multi-factorial resilience scores...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {assets.map((asset) => (
              <ResilienceScoreCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
