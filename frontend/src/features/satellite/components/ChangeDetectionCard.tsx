"use client";

import React from "react";
import { SatelliteChangeDetection } from "../types/satelliteTypes";
import { ShieldAlert, AlertTriangle, Layers, Calendar, CheckCircle2, Cpu } from "lucide-react";

interface Props {
  anomaly: SatelliteChangeDetection;
}

export const ChangeDetectionCard: React.FC<Props> = ({ anomaly }) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {anomaly.road_name}
            </span>
            <h3 className="text-xs font-bold text-slate-100">{anomaly.anomaly_type.replace(/_/g, " ")}</h3>
          </div>
        </div>

        <span className="text-[10px] font-extrabold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800 font-mono">
          {anomaly.confidence_score}% Confidence
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-mono">
        {anomaly.summary}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px]">
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-500 block">Affected Area</span>
          <span className="text-slate-200 font-bold">{(anomaly.affected_area_sqm / 1000.0).toFixed(1)}k sq.m</span>
        </div>

        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-slate-500 block">Sensor Platform</span>
          <span className="text-cyan-400 font-bold">Sentinel-2B MSI</span>
        </div>

        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-slate-500 block">Computer Vision ML</span>
          <span className="text-purple-400 font-bold">CV Engine V2.1</span>
        </div>
      </div>
    </div>
  );
};
