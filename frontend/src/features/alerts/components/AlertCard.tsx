"use client";

import React from "react";
import Link from "next/link";
import {
  DriverAlert,
  AlertSeverity,
  AlertType,
  AlertStatus,
} from "../types/alertTypes";
import {
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Trash2,
  ShieldAlert,
  Radio,
  FileText,
  CloudRain,
} from "lucide-react";

interface Props {
  alert: DriverAlert;
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onOpenDetail?: (alert: DriverAlert) => void;
}

export const AlertCard: React.FC<Props> = ({
  alert,
  onAcknowledge,
  onDismiss,
  onOpenDetail,
}) => {
  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case AlertSeverity.CRITICAL:
        return "bg-red-500/20 text-red-300 border-red-500/50 shadow-sm";
      case AlertSeverity.HIGH:
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case AlertSeverity.MEDIUM:
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case AlertSeverity.LOW:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case AlertSeverity.INFO:
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.LANDSLIDE_WARNING:
      case AlertType.ROAD_BLOCKAGE:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case AlertType.FLOOD_WARNING:
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case AlertType.BRIDGE_CLOSURE:
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case AlertType.EMERGENCY_INSTRUCTION:
      case AlertType.GOVERNMENT_DIRECTIVE:
        return <Radio className="w-4 h-4 text-red-400" />;
      case AlertType.TRIP_UPDATE:
      case AlertType.ROUTE_DISRUPTION:
        return <Navigation className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const isCritical = alert.severity === AlertSeverity.CRITICAL;
  const isHigh = alert.severity === AlertSeverity.HIGH;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
        !alert.is_read
          ? isCritical
            ? "bg-red-950/30 border-red-500/60 shadow-lg shadow-red-950/30 ring-1 ring-red-500/30"
            : isHigh
            ? "bg-orange-950/20 border-orange-500/50 shadow-md shadow-orange-950/20"
            : "bg-slate-900 border-slate-700/80"
          : "bg-slate-900/60 border-slate-800 text-slate-400"
      }`}
    >
      {/* Top Header: Badge, Type, Unread Dot, Timestamp */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getSeverityBadge(alert.severity)}`}>
            {alert.severity}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            {getTypeIcon(alert.type)}
            <span>{alert.type.replace(/_/g, " ")}</span>
          </div>
          {!alert.is_read && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Unread notification" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <Clock className="w-3 h-3" />
          <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Main Title & Message */}
      <div
        onClick={() => onOpenDetail && onOpenDetail(alert)}
        className="space-y-1 cursor-pointer group"
      >
        <h3 className={`text-sm font-bold transition-colors ${
          !alert.is_read ? "text-slate-100 group-hover:text-emerald-400" : "text-slate-300"
        }`}>
          {alert.title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
          {alert.message}
        </p>
      </div>

      {/* Location / Corridor Tag */}
      {(alert.road_name || alert.location_name) && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{alert.road_name || alert.location_name}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/driver/map"
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
          >
            <Navigation className="w-3 h-3" />
            <span>View Map</span>
          </Link>
          <Link
            href="/dashboard/driver/route"
            className="text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            <span>My Route</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!alert.is_acknowledged && (isCritical || isHigh) ? (
            <button
              type="button"
              onClick={() => onAcknowledge(alert.id)}
              className="text-[11px] font-bold text-white px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-all flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              Acknowledge
            </button>
          ) : alert.is_acknowledged ? (
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Acknowledged
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
              title="Dismiss alert"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
