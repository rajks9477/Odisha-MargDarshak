"use client";

import React from "react";
import { RegionalCorridorHealth } from "../types/commandCenterTypes";
import { Activity } from "lucide-react";

interface Props {
  corridors: RegionalCorridorHealth[];
}

export const RegionalCorridorMatrix: React.FC<Props> = ({ corridors }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CRITICAL_ALERT":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "WATCH":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "HEALTHY":
      default:
        return "bg-[#E9F5ED] text-[#1B4332] border-[#C2E2CC]";
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-700" />
          <span>Regional Passability Matrix Across North Eastern States (8 States)</span>
        </h3>
        <span className="text-[10px] font-mono text-stone-500">State Highway Command</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {corridors.map((c) => (
          <div
            key={c.state_code}
            className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-white border border-[#E8E2D8] flex items-center justify-center text-[10px] font-bold font-mono text-stone-700">
                  {c.state_code}
                </span>
                <h4 className="text-xs font-bold text-stone-900">{c.state}</h4>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border font-mono ${getStatusBadge(c.overall_health_status)}`}>
                {c.overall_health_status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
              <div className="p-1.5 rounded-lg bg-[#E9F5ED] border border-[#C2E2CC] text-[#1B4332]">
                <div className="font-extrabold">{c.open_corridors}</div>
                <div className="text-[8px] font-bold text-emerald-800">OPEN</div>
              </div>

              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <div className="font-extrabold">{c.restricted_corridors}</div>
                <div className="text-[8px] font-bold text-amber-800">RESTRICTED</div>
              </div>

              <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                <div className="font-extrabold">{c.critical_blocked_corridors}</div>
                <div className="text-[8px] font-bold text-rose-800">BLOCKED</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
