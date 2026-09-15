"use client";

import React from "react";
import { CargoPriority, CargoCategory } from "../types/logisticsTypes";
import {
  ShieldAlert,
  AlertTriangle,
  Package,
  Activity,
  HeartPulse,
  Apple,
  Truck,
  Fuel,
} from "lucide-react";

interface Props {
  priority: CargoPriority;
  category?: CargoCategory;
  size?: "sm" | "md";
}

export const CargoPriorityBadge: React.FC<Props> = ({
  priority,
  category,
  size = "md",
}) => {
  const getPriorityStyle = () => {
    switch (priority) {
      case CargoPriority.CRITICAL:
        return "bg-red-500/20 text-red-300 border-red-500/50 shadow-lg shadow-red-950/40";
      case CargoPriority.IMPORTANT:
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case CargoPriority.NORMAL:
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getCategoryIcon = (cat?: CargoCategory) => {
    switch (cat) {
      case CargoCategory.MEDICINES_MEDICAL:
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      case CargoCategory.EMERGENCY_FOOD_RATIONS:
        return <Apple className="w-3.5 h-3.5 text-emerald-400" />;
      case CargoCategory.DISASTER_RECOVERY_EQUIPMENT:
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      case CargoCategory.PETROLEUM_FUEL:
        return <Fuel className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Package className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {category && (
        <span className="p-1 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
          {getCategoryIcon(category)}
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold font-mono uppercase ${getPriorityStyle()}`}
      >
        {priority === CargoPriority.CRITICAL && <ShieldAlert className="w-3 h-3 text-red-400" />}
        {priority === CargoPriority.IMPORTANT && <AlertTriangle className="w-3 h-3 text-amber-400" />}
        <span>{priority} PRIORITY</span>
      </span>
    </div>
  );
};
