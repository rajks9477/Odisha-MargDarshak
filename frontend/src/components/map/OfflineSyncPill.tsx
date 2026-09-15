"use client";

import React, { useState, useEffect } from "react";
import { OfflineSyncService } from "@/services/offlineSync";
import { 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  Radio 
} from "lucide-react";

export const OfflineSyncPill: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  const updateCount = () => {
    setPendingCount(OfflineSyncService.getPendingCount());
  };

  useEffect(() => {
    updateCount();
    const interval = setInterval(updateCount, 4000);

    const cleanup = OfflineSyncService.initAutoSync((count) => {
      setJustSynced(true);
      updateCount();
      setTimeout(() => setJustSynced(false), 3000);
    });

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing || pendingCount === 0) return;
    setIsSyncing(true);

    try {
      const res = await OfflineSyncService.syncPendingRecords();
      if (res.success && res.syncedCount > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
      }
      updateCount();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (justSynced) {
    return (
      <div className="bg-emerald-950/90 backdrop-blur-md border border-emerald-700 px-3 py-1.5 rounded-xl text-xs text-emerald-200 flex items-center gap-1.5 shadow-lg animate-in fade-in">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-bold">Offline Queue Synced to Server</span>
      </div>
    );
  }

  if (pendingCount === 0) return null;

  return (
    <div className="bg-amber-950/95 backdrop-blur-md border border-amber-700 px-3 py-1.5 rounded-xl text-xs text-amber-200 flex items-center gap-2 shadow-lg animate-in fade-in">
      <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="font-mono font-bold">{pendingCount} GPS Pings Queued Offline</span>
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className="px-2 py-0.5 rounded bg-amber-800 hover:bg-amber-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
        <span>{isSyncing ? "Syncing..." : "Sync"}</span>
      </button>
    </div>
  );
};
