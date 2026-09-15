"use client";

import React, { useState, useEffect } from "react";
import { AuditLogItem } from "../types/adminTypes";
import { adminApi } from "../api/adminApi";
import { ShieldCheck, Clock, UserCheck, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogViewer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      adminApi.listAuditLogs().then((res) => {
        setLogs(res.logs);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 font-sans animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">Administrative Audit Trail</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-purple-400 block uppercase">
                  {log.action}
                </span>
                <p className="text-xs text-slate-200">{log.details}</p>
                <span className="text-[10px] text-slate-500 block">
                  Target User: {log.user_email || log.user_id || "System"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {logs.length === 0 && !loading && (
            <p className="text-center text-slate-500 py-8">No audit logs recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
