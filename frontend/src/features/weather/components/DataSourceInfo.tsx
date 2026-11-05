"use client";

import React from "react";
import { Database, ShieldCheck, Info } from "lucide-react";

export const DataSourceInfo: React.FC = () => {
  return (
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-purple-400 shrink-0" />
        <span className="font-semibold text-slate-300">
          Feeds: IMD Meteorological Centre Bhubaneswar • CWC Mahanadi Basin • OSDMA State Emergency Operations Centre
        </span>
      </div>

      <div className="flex items-center gap-2 font-mono text-[10px]">
        <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
          [Grounded Telemetry]
        </span>
        <span className="text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          [Demo Simulated Feed]
        </span>
      </div>
    </div>
  );
};
