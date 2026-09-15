"use client";

import React, { useState } from "react";
import { ProposedAction } from "../types/copilotTypes";
import { copilotApi } from "../api/copilotApi";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface Props {
  action: ProposedAction;
}

export const ProposedActionCard: React.FC<Props> = ({ action }) => {
  const [status, setStatus] = useState<string>(action.status);
  const [loading, setLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    setLoading(true);
    try {
      await copilotApi.approveAction(
        action.action_type,
        action.target_resource_id,
        decision,
        notes || "Decision authorized via Command Center AI Copilot."
      );
      setStatus(decision === "APPROVED" ? "OFFICIALLY_AUTHORIZED" : "ACTION_REJECTED");
    } catch (e) {
      console.warn("Decision failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              AI Proposed Operational Recommendation
            </span>
            <h4 className="text-xs font-bold text-slate-100">{action.title}</h4>
          </div>
        </div>

        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
          {status.replace(/_/g, " ")}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{action.description}</p>

      {/* Human In The Loop Notice */}
      <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Human-in-the-Loop Safeguard: Explicit authorized officer confirmation required.</span>
      </div>

      {status === "PENDING_OFFICER_CONFIRMATION" ? (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => handleDecision("REJECTED")}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => handleDecision("APPROVED")}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Authorize & Execute</span>
          </button>
        </div>
      ) : (
        <div className="p-2 rounded-xl bg-slate-950 text-center font-mono text-xs font-bold text-emerald-300 border border-emerald-900/40">
          ✓ Officer Decision Officially Recorded
        </div>
      )}
    </div>
  );
};
