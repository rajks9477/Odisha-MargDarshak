"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ShieldAlert, ArrowRight, RotateCcw, MapPin, Clock, FileText } from "lucide-react";
import { IncidentType, IncidentSeverity } from "../types/incidentTypes";

interface Props {
  incidentId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  roadName?: string;
  timestamp: string;
  isOfflineQueued?: boolean;
  onReportAnother: () => void;
}

export const IncidentSuccessCard: React.FC<Props> = ({
  incidentId,
  incidentType,
  severity,
  roadName,
  timestamp,
  isOfflineQueued,
  onReportAnother,
}) => {
  return (
    <div className="p-6 bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl space-y-5 text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100">
          {isOfflineQueued ? "Incident Saved for Sync" : "Incident Reported Successfully"}
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {isOfflineQueued
            ? "No active internet in this canyon. Your report is stored locally and will sync automatically when network returns."
            : "Your report has been received and forwarded to the Regional Incident Verification desk."}
        </p>
      </div>

      {/* Incident details box */}
      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-left space-y-2.5 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Incident Reference ID</span>
          <span className="font-mono font-bold text-emerald-400">{incidentId}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Hazard Type</span>
          <span className="font-semibold text-slate-200">{incidentType}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Driver Severity</span>
          <span className="font-semibold text-amber-400">{severity}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Status</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
            Pending Verification
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Road Corridor</span>
          <span className="text-slate-300 truncate max-w-[180px]">{roadName || "NH-6 Mountain Corridor"}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Reported At</span>
          <span className="text-slate-300 font-mono">{new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Governance Notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-left text-[11px] text-blue-300">
        <ShieldAlert className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-200">Government Safety Rule: </span>
          Driver reports remain marked as &quot;Pending Verification&quot; until reviewed by authorized PWD / SDRF field officers.
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={onReportAnother}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Report Another Issue
        </button>
        <Link
          href="/dashboard/driver/incidents"
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all"
        >
          <span>View My Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
