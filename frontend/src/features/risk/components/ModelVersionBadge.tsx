"use client";

import React from "react";
import { Sparkles, Brain, Cpu, ShieldCheck } from "lucide-react";

interface Props {
  modelVersion?: string;
  rocAuc?: number;
}

export const ModelVersionBadge: React.FC<Props> = ({
  modelVersion = "v1.2.4",
  rocAuc = 0.912,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Brain className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-bold text-slate-200">NER Gradient Boosting Risk Engine</span>
          <span className="text-[10px] text-slate-400 font-mono ml-1.5">({modelVersion})</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800">
          ROC-AUC {rocAuc}
        </span>
        <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          [Demo Simulated Pipeline]
        </span>
      </div>
    </div>
  );
};
