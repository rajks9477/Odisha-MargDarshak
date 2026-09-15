"use client";

import React from "react";
import { IncidentReportRecord, IncidentStatus, IncidentSeverity } from "../types/incidentTypes";
import { MapPin, Clock, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileImage, Volume2 } from "lucide-react";

interface Props {
  incident: IncidentReportRecord;
}

export const IncidentStatusCard: React.FC<Props> = ({ incident }) => {
  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.VERIFIED:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Verified by PWD / Officer
          </span>
        );
      case IncidentStatus.REJECTED:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case IncidentStatus.RESOLVED:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Resolved & Cleared
          </span>
        );
      case IncidentStatus.UNDER_REVIEW:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Clock className="w-3 h-3" />
            Under Field Review
          </span>
        );
      case IncidentStatus.PENDING_VERIFICATION:
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending Verification
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.CRITICAL:
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case IncidentSeverity.HIGH:
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case IncidentSeverity.MEDIUM:
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case IncidentSeverity.LOW:
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100">{incident.type}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(incident.severity)}`}>
              {incident.severity}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            ID: <span className="font-mono text-slate-300">{incident.id}</span>
          </div>
        </div>

        <div>{getStatusBadge(incident.status)}</div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        {incident.description}
      </p>

      {/* Voice transcript if available */}
      {incident.voice_transcript && (
        <div className="flex items-start gap-1.5 text-xs text-cyan-300/90 bg-cyan-950/20 border border-cyan-800/30 p-2 rounded-lg italic">
          <Volume2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
          <span>&quot;{incident.voice_transcript}&quot;</span>
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[200px]">
            {incident.road_name || `${incident.latitude.toFixed(4)}°N, ${incident.longitude.toFixed(4)}°E`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {incident.evidence && incident.evidence.length > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-400">
              <FileImage className="w-3 h-3" />
              {incident.evidence.length} {incident.evidence.length === 1 ? "photo" : "photos"}
            </span>
          )}
          <span className="font-mono text-slate-500">
            {new Date(incident.created_at).toLocaleDateString()} {new Date(incident.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Review or Rejection notes */}
      {incident.review_notes && (
        <div className="p-2.5 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-300">
          <span className="font-semibold text-blue-200">Officer Verification Note: </span>
          {incident.review_notes}
        </div>
      )}

      {incident.rejection_reason && (
        <div className="p-2.5 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-300">
          <span className="font-semibold text-red-200">Rejection Reason: </span>
          {incident.rejection_reason}
        </div>
      )}

      {incident.resolution_notes && (
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
          <span className="font-semibold text-emerald-200">Resolution & Clearance: </span>
          {incident.resolution_notes}
        </div>
      )}
    </div>
  );
};
