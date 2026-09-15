"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import { AlertService } from "../services/alertService";
import { useAlertsWebSocket } from "../hooks/useAlertsWebSocket";
import { UnreadAlertCount } from "../types/alertTypes";

export const AlertBadge: React.FC = () => {
  const [counts, setCounts] = useState<UnreadAlertCount>({
    unread_count: 0,
    critical_count: 0,
    last_sync: "",
  });

  const fetchCounts = async () => {
    try {
      const data = await AlertService.getUnreadCount();
      setCounts(data);
    } catch {
      // Ignored in offline fallback
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync on new incoming WebSocket notification
  useAlertsWebSocket(() => {
    fetchCounts();
  });

  if (counts.unread_count === 0) {
    return (
      <Link
        href="/dashboard/driver/alerts"
        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all flex items-center justify-center relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
      </Link>
    );
  }

  const isCritical = counts.critical_count > 0;

  return (
    <Link
      href="/dashboard/driver/alerts"
      className={`p-2 rounded-xl border transition-all flex items-center justify-center relative ${
        isCritical
          ? "bg-red-950/50 border-red-500/50 text-red-300 shadow-lg shadow-red-950/40"
          : "bg-amber-950/40 border-amber-500/40 text-amber-300"
      }`}
      title={`${counts.unread_count} unread alerts`}
    >
      <Bell className={`w-5 h-5 ${isCritical ? "animate-bounce" : ""}`} />
      
      {/* Badge Pill */}
      <span
        className={`absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
          isCritical ? "bg-red-600 animate-pulse" : "bg-amber-600"
        }`}
      >
        {counts.unread_count > 99 ? "99+" : counts.unread_count}
      </span>
    </Link>
  );
};
