'use client';

import React from 'react';

interface OfflineTripBannerProps {
  pendingActionsCount?: number;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export default function OfflineTripBanner({
  pendingActionsCount = 0,
  onSyncNow,
  isSyncing = false,
}: OfflineTripBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-3.5 text-xs text-slate-300 shadow-lg">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-400">
          📡
        </span>
        <div>
          <span className="font-semibold text-white">Offline Mode Active</span>
          <p className="text-[11px] text-slate-400">
            Route data loaded from local cache. {pendingActionsCount > 0 ? `${pendingActionsCount} actions pending sync.` : 'GPS pings queuing locally.'}
          </p>
        </div>
      </div>

      {pendingActionsCount > 0 && onSyncNow && (
        <button
          onClick={onSyncNow}
          disabled={isSyncing}
          className="rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
}
