"use client";

import React, { useState, useEffect } from "react";
import { ImpactAnalysis } from "../types/impactTypes";
import { impactApi } from "../api/impactApi";
import { ImpactChainGraph } from "./ImpactChainGraph";
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Truck,
  Package,
  HeartPulse,
  Clock,
  Layers,
  MapPin,
} from "lucide-react";

export const ImpactDashboardView: React.FC = () => {
  const [impactData, setImpactData] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [blockageHours, setBlockageHours] = useState<number>(6.0);
  const [selectedHazard, setSelectedHazard] = useState<string>("LANDSLIDE_MUDFLOW");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("CRITICAL");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchImpact = async (hours?: number) => {
    if (hours !== undefined) setIsSimulating(true);
    else setLoading(true);

    try {
      const data = await impactApi.calculateCustomImpact(
        "NH-6-SONAPUR-01",
        selectedHazard,
        selectedSeverity,
        hours !== undefined ? hours : blockageHours
      );
      setImpactData(data);
    } catch (e) {
      console.warn("Failed to load impact analysis", e);
    } finally {
      setLoading(false);
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    fetchImpact();
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Impact & Cascading Impact Engine</h2>
            <p className="text-xs text-slate-400">
              Trace wider regional consequences across vehicles, emergency relief shipments & district supply lines
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchImpact()}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          <span>Recalculate Cascading Graph</span>
        </button>
      </div>

      {/* Grounded Disclaimer */}
      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-[10px]">
        <span className="text-slate-400">
          Engine: Graph Dependency Pipeline (NH-6 • NH-306 • NH-13)
        </span>
        <span className="text-emerald-400 font-bold">[Demo Simulated Graph Engine]</span>
      </div>

      {/* What-If Scenario Simulator */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Sliders className="w-4 h-4" />
            <span>Interactive Disruption Simulator (What-If Blockage Hours)</span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-100">
            {blockageHours} Hours Blockage
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="24"
          step="0.5"
          value={blockageHours}
          onChange={(e) => setBlockageHours(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Minor Clearance (1h)</span>
          <button
            type="button"
            onClick={() => fetchImpact(blockageHours)}
            disabled={isSimulating}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>Simulate Graph Impact</span>
          </button>
          <span className="text-[10px] text-slate-400">Major Highway Collapse (24h)</span>
        </div>
      </div>

      {/* Main Content & Graph */}
      {loading ? (
        <div className="py-16 text-center space-y-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-400" />
          <span>Tracing cascading dependencies across North Eastern corridors...</span>
        </div>
      ) : impactData ? (
        <>
          {/* Key Cascading Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Affected Vehicles</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-mono">
                {impactData.total_affected_vehicles}
              </div>
              <div className="text-[10px] text-slate-500">Commercial & Fleet Units</div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold uppercase">
                <Package className="w-3.5 h-3.5" />
                <span>Delayed Shipments</span>
              </div>
              <div className="text-xl font-extrabold text-purple-300 font-mono">
                {impactData.total_affected_shipments}
              </div>
              <div className="text-[10px] text-slate-500">Active Supply Dispatches</div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Critical Supply Exposure</span>
              </div>
              <div className="text-xl font-extrabold text-red-400 font-mono">
                {impactData.critical_supplies_exposed}
              </div>
              <div className="text-[10px] text-slate-500">ICU Medicines & Oxygen</div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Estimated Delay</span>
              </div>
              <div className="text-xl font-extrabold text-amber-300 font-mono">
                {impactData.total_estimated_delay_hours} <span className="text-xs font-normal">Hours</span>
              </div>
              <div className="text-[10px] text-slate-500">Per Disrupted Consignment</div>
            </div>
          </div>

          {/* Graph Visualization */}
          <ImpactChainGraph
            nodes={impactData.nodes}
            edges={impactData.edges}
            summaryChain={impactData.summary_chain}
          />
        </>
      ) : (
        <div className="p-8 text-center text-xs text-red-400">
          Failed to load cascading impact evaluation.
        </div>
      )}
    </div>
  );
};
