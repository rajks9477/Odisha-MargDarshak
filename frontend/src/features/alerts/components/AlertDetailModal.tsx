"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DriverAlert, AlertSeverity } from "../types/alertTypes";
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Building,
  AlertTriangle,
} from "lucide-react";

interface Props {
  alert: DriverAlert | null;
  onClose: () => void;
  onAcknowledge: (alertId: string, notes?: string) => void;
}

export const AlertDetailModal: React.FC<Props> = ({
  alert,
  onClose,
  onAcknowledge,
}) => {
  const [notes, setNotes] = useState<string>("");

  if (!alert) return null;

  const isCritical = alert.severity === AlertSeverity.CRITICAL;

  const handleConfirmAcknowledge = () => {
    onAcknowledge(alert.id, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden space-y-4 p-5 text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                isCritical
                  ? "bg-red-500/20 text-red-300 border-red-500/50"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}>
                {alert.severity}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {alert.type.replace(/_/g, " ")}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100">{alert.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
          <p>{alert.message}</p>
        </div>

        {/* Authority & Spatial Context */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>Issuing Authority</span>
            </div>
            <div className="font-semibold text-slate-200 truncate">{alert.source || "Regional Logistics Desk"}</div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Issued Time</span>
            </div>
            <div className="font-mono text-slate-200">
              {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Road Corridor */}
        {(alert.road_name || alert.location_name) && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{alert.road_name || alert.location_name}</span>
          </div>
        )}

        {/* Acknowledgement Status / Input */}
        {alert.is_acknowledged ? (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Formally acknowledged on {new Date(alert.acknowledged_at || alert.created_at).toLocaleTimeString()}</span>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <label className="text-[11px] text-slate-400">Driver Acknowledgement Note (Optional):</label>
            <input
              type="text"
              placeholder="e.g. Received. Slowing down convoy near Sonapur..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Modal Footer Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/driver/map"
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>GIS Map</span>
            </Link>
            <Link
              href="/dashboard/driver/route"
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>My Route</span>
            </Link>
          </div>

          {!alert.is_acknowledged && (
            <button
              type="button"
              onClick={handleConfirmAcknowledge}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge Directive</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
