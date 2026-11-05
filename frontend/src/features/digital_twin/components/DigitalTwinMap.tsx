"use client";

import React from "react";
import { DigitalTwinState, DigitalTwinNode, DigitalTwinEdge } from "../types/digitalTwinTypes";
import { LayerState } from "./LayerControl";
import { Building2, Activity, ShieldAlert, Truck } from "lucide-react";

interface Props {
  state: DigitalTwinState | null;
  layers: LayerState;
  onSelectEntity: (entityId: string) => void;
}

export const DigitalTwinMap: React.FC<Props> = ({ state, layers, onSelectEntity }) => {
  if (!state) return null;

  return (
    <div className="relative w-full h-[380px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl p-4 flex flex-col justify-between select-none">
      {/* Map Header Overlay */}
      <div className="flex items-center justify-between z-10">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono flex items-center gap-2 backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold">LIVE DIGITAL TWIN STATE</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400">Health Index: {state.network_health_index}%</span>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
          WebSocket Fast Update (Simulated)
        </span>
      </div>

      {/* SVG Network Topology Model Visualization */}
      <svg className="absolute inset-0 w-full h-full p-8 pointer-events-auto">
        <defs>
          <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Road Corridor Edges */}
        {layers.showRoads && (
          <g>
            {/* Edge 1: Bhubaneswar to Baitarani Bridge */}
            <line
              x1="20%"
              y1="40%"
              x2="50%"
              y2="55%"
              stroke="#ef4444"
              strokeWidth="4"
              strokeDasharray="6,4"
              className="cursor-pointer hover:stroke-cyan-400 transition-colors"
              onClick={() => onSelectEntity("NH-16-BAITARANI-01")}
            />
            {/* Edge 2: Bhubaneswar to Sambalpur Corridor */}
            <line
              x1="20%"
              y1="40%"
              x2="75%"
              y2="25%"
              stroke="#10b981"
              strokeWidth="3"
              className="cursor-pointer hover:stroke-cyan-400 transition-colors"
              onClick={() => onSelectEntity("NH-55-ANGUL-SAM-01")}
            />
            {/* Edge 3: Baitarani Bridge to Balasore */}
            <line
              x1="50%"
              y1="55%"
              x2="80%"
              y2="70%"
              stroke="#f59e0b"
              strokeWidth="3.5"
              className="cursor-pointer hover:stroke-cyan-400 transition-colors"
              onClick={() => onSelectEntity("NH-16-BAITARANI-01")}
            />
          </g>
        )}

        {/* Critical Hub Nodes */}
        {layers.showNodes && (
          <g>
            {/* Bhubaneswar Warehouse Node */}
            <g
              transform="translate(140, 120)"
              className="cursor-pointer group"
              onClick={() => onSelectEntity("NODE-WH-BBI-01")}
            >
              <circle r="14" fill="#020617" stroke="#38bdf8" strokeWidth="2.5" />
              <text x="20" y="4" fill="#e2e8f0" fontSize="11" fontWeight="bold" fontFamily="monospace">
                Bhubaneswar Hub
              </text>
            </g>

            {/* Sonapur Bridge Node */}
            <g
              transform="translate(360, 185)"
              className="cursor-pointer group"
              onClick={() => onSelectEntity("NODE-BRG-BAI-01")}
            >
              <circle r="14" fill="#020617" stroke="#ef4444" strokeWidth="3" className="animate-pulse" />
              <text x="20" y="4" fill="#fca5a5" fontSize="11" fontWeight="bold" fontFamily="monospace">
                Baitarani River Bridge (FLOOD ALERT)
              </text>
            </g>

            {/* Balasore MCH Node */}
            <g
              transform="translate(560, 240)"
              className="cursor-pointer group"
              onClick={() => onSelectEntity("NODE-HOSP-BAL-01")}
            >
              <circle r="14" fill="#020617" stroke="#a855f7" strokeWidth="2.5" />
              <text x="20" y="4" fill="#e2e8f0" fontSize="11" fontWeight="bold" fontFamily="monospace">
                Balasore MCH
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Footer Instructions */}
      <div className="z-10 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Click any node or highway corridor to inspect connected dependency chain</span>
        <span className="text-cyan-400 font-bold">30 Odisha Districts Active</span>
      </div>
    </div>
  );
};
