"use client";

import React from "react";
import { Shipment, ShipmentStatus } from "../types/logisticsTypes";
import { CargoPriorityBadge } from "./CargoPriorityBadge";
import {
  Package,
  MapPin,
  ArrowRight,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Truck,
} from "lucide-react";

interface Props {
  shipment: Shipment;
  onSelect?: (shipment: Shipment) => void;
  onStatusUpdate?: (shipmentId: string, newStatus: ShipmentStatus) => void;
}

export const ShipmentCard: React.FC<Props> = ({
  shipment,
  onSelect,
  onStatusUpdate,
}) => {
  const getStatusStyle = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case ShipmentStatus.CORRIDOR_DELAYED:
        return "bg-red-500/20 text-red-300 border-red-500/50 shadow-lg shadow-red-950/30";
      case ShipmentStatus.REROUTED_SAFETY:
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case ShipmentStatus.IN_TRANSIT:
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(shipment)}
      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-xl space-y-3 cursor-pointer group"
    >
      {/* Header & Priority Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {shipment.id}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {(shipment.weight_kg / 1000.0).toFixed(1)} Tonnes
            </span>
          </div>
          <h3 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
            {shipment.title}
          </h3>
        </div>

        <CargoPriorityBadge priority={shipment.priority} category={shipment.cargo_category} />
      </div>

      {/* Corridor Route Corridor Origin -> Destination */}
      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-200 font-semibold truncate">{shipment.origin_name}</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 mx-1" />

        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="text-slate-200 font-semibold truncate text-right">{shipment.destination_name}</span>
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-bold px-2 py-0.5 rounded border font-mono ${getStatusStyle(shipment.status)}`}>
            {shipment.status.replace("_", " ")}
          </span>
          <span className="font-mono text-slate-300 font-bold">{shipment.progress_pct}% Transit Complete</span>
        </div>

        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              shipment.status === ShipmentStatus.CORRIDOR_DELAYED
                ? "bg-red-500"
                : shipment.status === ShipmentStatus.DELIVERED
                ? "bg-emerald-500"
                : "bg-cyan-500"
            }`}
            style={{ width: `${Math.min(Math.max(shipment.progress_pct, 5), 100)}%` }}
          />
        </div>
      </div>

      {/* Risk Impact Warning */}
      {shipment.risk_impact_summary && (
        <div className="p-2 bg-amber-950/30 rounded-xl border border-amber-900/40 flex items-start gap-1.5 text-[11px] text-amber-200/90">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="line-clamp-2">{shipment.risk_impact_summary}</p>
        </div>
      )}
    </div>
  );
};
