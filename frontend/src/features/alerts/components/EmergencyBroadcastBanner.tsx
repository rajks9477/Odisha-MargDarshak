"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DriverAlert, AlertSeverity } from "../types/alertTypes";
import { alertsApi } from "../api/alertsApi";
import { AlertService } from "../services/alertService";
import { AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, X } from "lucide-react";

export const EmergencyBroadcastBanner: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<DriverAlert | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [acknowledging, setAcknowledging] = useState<boolean>(false);

  useEffect(() => {
    alertsApi.getActiveBannerAlert()
      .then((alert) => {
        if (alert && !alert.is_acknowledged) {
          setActiveAlert(alert);
        }
      })
      .catch(() => {});
  }, []);

  if (!activeAlert || dismissed || activeAlert.is_acknowledged) {
    return null;
  }

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await AlertService.acknowledge(activeAlert.id);
      setActiveAlert(null);
    } catch {
      setActiveAlert(null);
    } finally {
      setAcknowledging(false);
    }
  };

  const isCritical = activeAlert.severity === AlertSeverity.CRITICAL;

  return (
    <aside
      aria-label="Emergency warning notification"
      className={`border-b px-4 py-2.5 transition-all ${
      isCritical
        ? "bg-red-950/90 border-red-500/60 text-red-100"
        : "bg-amber-950/90 border-amber-500/60 text-amber-100"
    }`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-300 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-600 text-white">
                {activeAlert.severity}
              </span>
              <span className="text-xs font-bold truncate">{activeAlert.title}</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {activeAlert.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Acknowledge</span>
          </button>
          <Link
            href="/dashboard/driver/alerts"
            className="p-1 text-slate-400 hover:text-white"
            title="View Details"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white"
            title="Dismiss from top"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
