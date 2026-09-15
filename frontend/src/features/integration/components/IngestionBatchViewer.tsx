"use client";

import React from "react";
import { IngestionBatch } from "../types/integrationTypes";
import { History, CheckCircle2, Clock, Check } from "lucide-react";

interface Props {
  batches: IngestionBatch[];
}

export const IngestionBatchViewer: React.FC<Props> = ({ batches }) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Ingestion & Staging Validation Batch Log</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          Last 30 Automated / Manual Synchronization Runs
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto pr-1">
        {batches.map((b) => (
          <div
            key={b.id}
            className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400">{b.id}</span>
                <span className="font-bold text-slate-100 font-sans text-xs">{b.connector_name}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {b.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">{b.error_summary}</p>
              <div className="text-[10px] text-slate-500 flex gap-4">
                <span>Received: {b.records_received}</span>
                <span className="text-emerald-400 font-bold">Promoted: {b.records_promoted}</span>
                <span>Quarantined: {b.records_failed}</span>
                <span>Execution: {b.duration_ms}ms</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0">
              {new Date(b.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {batches.length === 0 && (
          <p className="text-center text-slate-500 py-6">No batch sync records found.</p>
        )}
      </div>
    </div>
  );
};
