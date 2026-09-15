"use client";

import React from "react";
import { EntityDependency } from "../types/digitalTwinTypes";
import { ShieldAlert, ArrowRight, Activity, Building, Truck, X } from "lucide-react";

interface Props {
  dependency: EntityDependency | null;
  onClose: () => void;
}

export const EntityDetailsDrawer: React.FC<Props> = ({ dependency, onClose }) => {
  if (!dependency) return null;

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              {dependency.entity_type}
            </span>
            <h3 className="text-xs font-bold text-slate-100">{dependency.entity_name}</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
        <span className="text-slate-400">Current Health Status:</span>
        <span className="text-red-400 font-bold px-2 py-0.5 rounded bg-red-950 border border-red-800">
          {dependency.current_status}
        </span>
      </div>

      {/* Unified Network Dependency Chain Graph */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-200">Unified Network Dependency Chain</h4>

        <div className="space-y-1.5 font-mono text-xs">
          {dependency.dependency_chain.map((step, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center text-[10px] font-bold border border-slate-800">
                  {idx + 1}
                </span>
                <div>
                  <span className="text-[9px] text-cyan-400 block">{step.layer}</span>
                  <span className="text-xs font-bold text-slate-200">{step.name}</span>
                </div>
              </div>

              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
