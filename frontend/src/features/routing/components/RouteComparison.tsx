"use client";

import React from "react";
import { PlannedRoute, RouteType } from "../types/routingTypes";
import { CheckCircle2, ShieldCheck, Zap, Split, AlertTriangle } from "lucide-react";

interface Props {
  routes: PlannedRoute[];
  selectedRouteId: string | null;
  onSelectRoute: (route: PlannedRoute) => void;
}

export const RouteComparison: React.FC<Props> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  if (routes.length === 0) return null;

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return hours > 0 ? `${hours}h ${m}m` : `${m}m`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Candidate Route Comparison</h3>
          <p className="text-[11px] text-slate-400">Side-by-side terrain, speed, and safety matrix</p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          {routes.length} Options Generated
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="py-2 px-2.5">Corridor Option</th>
              <th className="py-2 px-2.5">Distance</th>
              <th className="py-2 px-2.5">Est. Time</th>
              <th className="py-2 px-2.5">Simulated Risk</th>
              <th className="py-2 px-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {routes.map((route) => {
              const isSelected = route.id === selectedRouteId;
              const isRec = route.route_type === RouteType.RECOMMENDED;
              const isFast = route.route_type === RouteType.FASTEST;

              return (
                <tr
                  key={route.id}
                  className={`transition-colors ${
                    isSelected ? "bg-emerald-950/30 text-slate-100" : "hover:bg-slate-800/40 text-slate-300"
                  }`}
                >
                  <td className="py-3 px-2.5">
                    <div className="flex items-center gap-1.5">
                      {isRec ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isFast ? (
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Split className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{route.route_type}</span>
                          {isRec && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px]">
                              Safest
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                          {route.corridor_title}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-2.5 font-semibold font-mono">
                    {route.distance_km} km
                  </td>

                  <td className="py-3 px-2.5 font-semibold font-mono">
                    {formatDuration(route.estimated_time_minutes)}
                  </td>

                  <td className="py-3 px-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                        route.risk_level === "LOW"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : route.risk_level === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-red-500/20 text-red-300 border-red-500/50"
                      }`}
                    >
                      {route.risk_score}/100 ({route.risk_level})
                    </span>
                  </td>

                  <td className="py-3 px-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectRoute(route)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {isSelected ? "Active" : "Select"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
