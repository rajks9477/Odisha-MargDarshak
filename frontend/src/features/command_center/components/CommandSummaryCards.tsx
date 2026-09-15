"use client";

import React from "react";
import { CommandCenterSummary } from "../types/commandCenterTypes";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Truck,
  Building,
  CloudRain,
} from "lucide-react";

interface Props {
  summary: CommandCenterSummary;
}

export const CommandSummaryCards: React.FC<Props> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 font-sans">
      <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-2xl shadow-xs space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-rose-700 font-bold uppercase">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Active Incidents</span>
        </div>
        <div className="text-xl font-black text-rose-700 font-mono">
          {summary.total_active_incidents}
        </div>
        <div className="text-[10px] text-stone-500">Across NE Highways</div>
      </div>

      <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-2xl shadow-xs space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pending Verification</span>
        </div>
        <div className="text-xl font-black text-amber-700 font-mono">
          {summary.pending_verifications_count}
        </div>
        <div className="text-[10px] text-stone-500">Officer Action Required</div>
      </div>

      <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-2xl shadow-xs space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-rose-800 font-bold uppercase">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Critical Corridors</span>
        </div>
        <div className="text-xl font-black text-rose-800 font-mono">
          {summary.critical_risk_corridors}
        </div>
        <div className="text-[10px] text-stone-500">Sonapur NH-6 & Vairengte</div>
      </div>

      <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-2xl shadow-xs space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-blue-700 font-bold uppercase">
          <Truck className="w-3.5 h-3.5" />
          <span>Emergency Cargo</span>
        </div>
        <div className="text-xl font-black text-blue-800 font-mono">
          {summary.active_emergency_shipments}
        </div>
        <div className="text-[10px] text-stone-500">In-Transit Dispatches</div>
      </div>

      <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-2xl shadow-xs space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-purple-700 font-bold uppercase">
          <Building className="w-3.5 h-3.5" />
          <span>Affected Districts</span>
        </div>
        <div className="text-xl font-black text-purple-800 font-mono">
          {summary.affected_districts_count}
        </div>
        <div className="text-[10px] text-stone-500">Service Risk Exposure</div>
      </div>

      <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-2xl shadow-xs space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold uppercase">
          <CloudRain className="w-3.5 h-3.5" />
          <span>IMD Warnings</span>
        </div>
        <div className="text-xl font-black text-emerald-800 font-mono">
          {summary.active_imd_alerts_count}
        </div>
        <div className="text-[10px] text-stone-500">Red & Orange Alerts</div>
      </div>
    </div>
  );
};
