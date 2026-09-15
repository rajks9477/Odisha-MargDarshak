"use client";

import React, { useState, useEffect } from "react";
import { SimulationResult, SimulationScenario, CreateSimulationRequest } from "../types/simulationTypes";
import { simulationApi } from "../api/simulationApi";
import { ScenarioBuilder } from "./ScenarioBuilder";
import { RouteComparisonCard } from "./RouteComparisonCard";
import {
  Sliders,
  RefreshCw,
  History,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export const SimulationDashboardView: React.FC = () => {
  const [activeResult, setActiveResult] = useState<SimulationResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadScenarios = async () => {
    try {
      const data = await simulationApi.getScenarios();
      setSavedScenarios(data);
    } catch (e) {
      console.warn("Failed to fetch scenarios", e);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const handleRunSimulation = async (req: CreateSimulationRequest) => {
    setLoading(true);
    try {
      const res = await simulationApi.runSimulation(req);
      setActiveResult(res);
      loadScenarios();
    } catch (e) {
      console.warn("Simulation failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Simulation / What-If Engine</h2>
            <p className="text-xs text-slate-400">
              Test hypothetical road blockages, landslides & bridge failures without modifying live production state
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadScenarios}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Provenance Disclaimer */}
      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-[10px]">
        <span className="text-slate-400">
          Sandbox Engine: Clones Digital Twin state snapshot for zero-impact hypothetical analysis
        </span>
        <span className="text-amber-400 font-bold">[Demo Simulated What-If Engine]</span>
      </div>

      {/* Scenario Builder Form */}
      <ScenarioBuilder onRunSimulation={handleRunSimulation} loading={loading} />

      {/* Active Simulation Result */}
      {activeResult && <RouteComparisonCard result={activeResult} />}

      {/* Saved Scenarios Catalog */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Saved What-If Scenario History ({savedScenarios.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Audit Trail Ready</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
          {savedScenarios.map((sc) => (
            <div key={sc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400">{sc.disaster_type}</span>
                <span className="text-[9px] text-slate-500">{sc.duration_hours}h Duration</span>
              </div>
              <div className="text-xs font-bold text-slate-100">{sc.title}</div>
              <div className="text-[10px] text-slate-400">{new Date(sc.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
