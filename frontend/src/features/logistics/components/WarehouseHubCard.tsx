"use client";

import React from "react";
import { WarehouseHub } from "../types/logisticsTypes";
import { Building, MapPin, Package, Users } from "lucide-react";

interface Props {
  hub: WarehouseHub;
}

export const WarehouseHubCard: React.FC<Props> = ({ hub }) => {
  const occupancyPct = Math.round((hub.current_occupancy_tonnes / hub.capacity_tonnes) * 100);

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {hub.district}, {hub.state}
            </span>
            <h3 className="text-xs font-bold text-slate-100">{hub.name}</h3>
          </div>
        </div>

        <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-mono">
          {hub.hub_type.replace("_", " ")}
        </span>
      </div>

      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
        <div className="flex justify-between text-slate-400">
          <span>Staging Occupancy</span>
          <span className="text-slate-200 font-bold">{hub.current_occupancy_tonnes} / {hub.capacity_tonnes} T ({occupancyPct}%)</span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};
