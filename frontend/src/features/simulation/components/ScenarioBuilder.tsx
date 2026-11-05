"use client";

import React, { useState } from "react";
import { CreateSimulationRequest } from "../types/simulationTypes";
import { Play, Sliders, ShieldAlert, Clock, AlertTriangle } from "lucide-react";

interface Props {
  onRunSimulation: (req: CreateSimulationRequest) => void;
  loading: boolean;
}

export const ScenarioBuilder: React.FC<Props> = ({ onRunSimulation, loading }) => {
  const [roadId, setRoadId] = useState<string>("NH-16-BAITARANI-01");
  const [disasterType, setDisasterType] = useState<string>("FLASH_FLOOD");
  const [durationHours, setDurationHours] = useState<number>(24);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation({
      title: `What-If Simulation on ${roadId}`,
      target_road_id: roadId,
      disaster_type: disasterType,
      severity_level: "HIGH",
      duration_hours: durationHours,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Sliders className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-slate-100">Disaster Simulation Builder</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">Target Corridor / Asset</label>
          <select
            value={roadId}
            onChange={(e) => setRoadId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none"
          >
            <option value="NH-16-BAITARANI-01">NH-16 Baitarani River Bridge (Bhadrak-Jajpur)</option>
            <option value="NH-55-ANGUL-SAM-01">NH-55 Cuttack-Angul-Sambalpur Corridor</option>
            <option value="NH-20-KANJIPANI-01">NH-20 Kanjipani Ghat Corridor (Kendujhar)</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Disaster Event Type</label>
          <select
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none"
          >
            <option value="FLASH_FLOOD">Flash Inundation / River Breach</option>
            <option value="LANDSLIDE_BLOCKAGE">Landslide Scarp / Mudflow</option>
            <option value="BRIDGE_FAILURE">Bridge Structural Failure</option>
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
