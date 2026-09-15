"use client";

import React from "react";
import { DecisionSupportItem } from "../types/analyticsTypes";
import { ShieldAlert, Lightbulb, CheckCircle2, ArrowRight } from "lucide-react";

interface Props {
  items: DecisionSupportItem[];
}

export const DecisionSupportPanel: React.FC<Props> = ({ items }) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Government Strategic Decision Support Findings</span>
        </h3>
        <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Analytical Engineering Recommendations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2.5"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase">
                  {item.category}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border ${
                    item.urgency === "CRITICAL"
                      ? "bg-red-950 text-red-300 border-red-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  {item.urgency}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {item.analytical_recommendation}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
              <span className="text-slate-500 block">Justification:</span>
              <span className="text-slate-300">{item.justification}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
