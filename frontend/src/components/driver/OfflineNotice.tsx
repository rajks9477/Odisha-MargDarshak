"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Radio, CheckCircle2 } from "lucide-react";

export const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showBackOnlineNotice, setShowBackOnlineNotice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineNotice(true);
      const timer = setTimeout(() => setShowBackOnlineNotice(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-amber-950 border border-amber-600/80 text-amber-200 px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Low-Connectivity Mountain Zone Active — Offline Local Cache Engaged</span>
        </div>
        <span className="text-[10px] font-mono bg-amber-900/80 px-2 py-0.5 rounded border border-amber-700">
          OFFLINE CACHE
        </span>
      </div>
    );
  }

  if (showBackOnlineNotice) {
    return (
      <div className="bg-emerald-950 border border-emerald-600/80 text-emerald-200 px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Network Re-established — Cloud Synchronized</span>
        </div>
        <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700">
          ONLINE
        </span>
      </div>
    );
  }

  return null;
};
