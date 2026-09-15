"use client";

import React from "react";
import { PlannedRoute } from "../types/routingTypes";
import { RiskIndicator } from "./RiskIndicator";
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
} from "lucide-react";

interface Props {
  route: PlannedRoute | null;
  onActivateTripRoute: (route: PlannedRoute) => void;
  activating: boolean;
}

export const RouteSummary: React.FC<Props> = ({
  route,
  onActivateTripRoute,
  activating,
}) => {
  if (!route) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
        Select a route candidate to view complete highway corridor breakdown & road segment analysis.
      </div>
    );
  }

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return hours > 0 ? `${hours}h ${m}m` : `${m} mins`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/50">
              {route.route_type}
            </span>
            <span className="text-xs font-bold text-slate-100">{route.corridor_title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{route.origin_name.split(",")[0]}</span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
            <span>{route.destination_name.split(",")[0]}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onActivateTripRoute(route)}
          disabled={activating || route.is_selected}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{route.is_selected ? "Active Route" : activating ? "Activating..." : "Set as Active Trip Route"}</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400">Total Distance</div>
          <div className="font-bold text-slate-200 font-mono mt-0.5">{route.distance_km} km</div>
        </div>
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400">Est. Transit Time</div>
          <div className="font-bold text-slate-200 font-mono mt-0.5">{formatDuration(route.estimated_time_minutes)}</div>
        </div>
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400">Safety Index</div>
          <div className="font-bold text-emerald-400 font-mono mt-0.5">{100 - Math.round(route.risk_score)}/100</div>
        </div>
      </div>

      {/* Risk Indicator */}
      <RiskIndicator riskScore={route.risk_score} riskLevel={route.risk_level} />

      {/* Hazard Warnings */}
      {route.risk_reasons && route.risk_reasons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Corridor Advisory & Mitigations</span>
          </h4>
          <div className="space-y-1.5">
            {route.risk_reasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Turn-by-Turn Road Segments if present */}
      {route.segments && route.segments.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Highway Segments Breakdown ({route.segments.length} Legs)</span>
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
            {route.segments.map((seg) => (
              <div
                key={seg.id}
                className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-300"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate">{seg.road_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Leg {seg.sequence_order} • {seg.distance_km} km • ~{Math.round(seg.estimated_time_minutes)} mins
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    seg.status === "GREEN"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : seg.status === "YELLOW"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-red-500/20 text-red-300 border-red-500/50"
                  }`}
                >
                  {seg.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
