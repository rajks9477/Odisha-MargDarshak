"use client";

import React, { useState } from "react";
import { CreateSimulationRequest } from "../types/simulationTypes";
import { Play, Sliders, ShieldAlert, Clock, AlertTriangle } from "lucide-react";

interface Props {
  onRunSimulation: (req: CreateSimulationRequest) => void;
  loading: boolean;
}

export const ScenarioBuilder: React.FC<Props> = ({ onRunSimulation, loading }) => {
  const [roadId, setRoadId] = useState<string>("NH-6-SONAPUR-01");
  const [disasterType, setDisasterType] = useState<string>("LANDSLIDE_BLOCKAGE");
  const [severity, setSeverity] = useState<string>("CRITICAL");
  const [durationHours, setDurationHours] = useState<number>(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation({
      title: `Hypothetical ${disasterType.replace(/_/g, " ")} (${durationHours}h)`,
      target_road_id: roadId,
      disaster_type: disasterType,
      severity_level: severity,
      duration_hours: durationHours,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>What-If Scenario Configuration</span>
        </h3>
        <span className="text-[9px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
          Isolated Sandbox Simulation
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div>
          <label className="text-slate-400 block mb-1">Target Highway Corridor</label>
          <select
            value={roadId}
            onChange={(e) => setRoadId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none"
          >
            <option value="NH-6-SONAPUR-01">NH-6 Sonapur Highway (Meghalaya-Assam)</option>
            <option value="NH-27-GUW-NAG-01">NH-27 Guwahati-Nagaon Corridor</option>
            <option value="NH-13-TAW-BOM-01">NH-13 Tawang-Dirang Passage</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Disaster Event Type</label>
          <select
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none"
          >
            <option value="LANDSLIDE_BLOCKAGE">Landslide Scarp / Mudflow</option>
            <option value="BRIDGE_FAILURE">Bridge Structural Failure</option>
            <option value="FLASH_FLOOD">Flash Inundation / River Breach</option>
          </select>
        </div>
      </div>

      {/* Severity & Duration Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Hypothetical Disruption Duration:</span>
          <span className="text-amber-400 font-bold">{durationHours} Hours</span>
        </div>
        <input
          type="range"
          min="1"
          max="72"
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Play className="w-4 h-4 fill-white" />
        <span>Run What-If Simulation Engine</span>
      </button>
    </form>
  );
};
