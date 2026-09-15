"use client";

import React from "react";
import { PlannedRoute, RouteType } from "../types/routingTypes";
import { RiskIndicator } from "./RiskIndicator";
import {
  ShieldCheck,
  Zap,
  RotateCcw,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Play
} from "lucide-react";

interface Props {
  route: PlannedRoute;
  isSelected: boolean;
  onSelect: (route: PlannedRoute) => void;
  onStartNavigation?: (route: PlannedRoute) => void;
  onViewDetails?: (route: PlannedRoute) => void;
}

export const RouteCard: React.FC<Props> = ({
  route,
  isSelected,
  onSelect,
  onStartNavigation,
  onViewDetails,
}) => {
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return hours > 0 ? `${hours}h ${m}m` : `${m} mins`;
  };

  const getRouteTypeMeta = () => {
    switch (route.route_type) {
      case RouteType.RECOMMENDED:
        return {
          label: "SAFEST AI ROUTE",
          bg: "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />,
        };
      case RouteType.FASTEST:
        return {
          label: "SHORTEST / FASTEST",
          bg: "bg-blue-50 text-blue-900 border-blue-200 font-bold",
          icon: <Zap className="w-3.5 h-3.5 text-blue-700" />,
        };
      case RouteType.ALTERNATE:
      default:
        return {
          label: "VALLEY BYPASS",
          bg: "bg-amber-50 text-amber-900 border-amber-200 font-bold",
          icon: <RotateCcw className="w-3.5 h-3.5 text-amber-700" />,
        };
    }
  };

  const meta = getRouteTypeMeta();

  return (
    <div
      className={`p-4 rounded-2xl border transition-all space-y-3 font-sans text-stone-900 ${
        isSelected
          ? "bg-white border-emerald-700 shadow-sm ring-1 ring-emerald-700"
          : "bg-white border-stone-200 hover:border-stone-300 shadow-2xs"
      }`}
    >
      {/* Top Header: Badge & Active Tag */}
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] flex items-center gap-1.5 ${meta.bg}`}>
          {meta.icon}
          <span>{meta.label}</span>
        </span>

        {isSelected && (
          <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Active Target</span>
          </span>
        )}
      </div>

      {/* Corridor Title */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-1">{route.corridor_title}</h3>
        <p className="text-[11px] text-stone-500 font-medium">
          {route.origin_name.split(",")[0]} ➔ {route.destination_name.split(",")[0]}
        </p>
      </div>

      {/* Metrics Row: Distance, Travel Time */}
      <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-800 shrink-0" />
          <div>
            <div className="text-[10px] text-stone-500 font-medium">Total Distance</div>
            <div className="font-bold text-stone-900">{route.distance_km} km</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-stone-600 shrink-0" />
          <div>
            <div className="text-[10px] text-stone-500 font-medium">Est. Drive Time</div>
            <div className="font-bold text-stone-900">{formatDuration(route.estimated_time_minutes)}</div>
          </div>
        </div>
      </div>

      {/* Risk Indicator */}
      <RiskIndicator riskScore={route.risk_score} riskLevel={route.risk_level} />

      {/* Warnings / Hazard Preview */}
      {route.risk_reasons && route.risk_reasons.length > 0 && (
        <div className="space-y-1">
          {route.risk_reasons.slice(0, 2).map((reason, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-950 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span className="line-clamp-1 font-medium">{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onSelect(route)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isSelected
              ? "bg-emerald-800 text-white shadow-2xs"
              : "bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isSelected ? "Selected Route" : "Select Route"}</span>
        </button>

        {onStartNavigation && (
          <button
            type="button"
            onClick={() => onStartNavigation(route)}
            className="py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Start Turn-by-Turn GPS Navigation"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Navigate</span>
          </button>
        )}

        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(route)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 cursor-pointer"
            title="View Route Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
