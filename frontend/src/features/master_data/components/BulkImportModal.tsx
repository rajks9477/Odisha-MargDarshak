"use client";

import React, { useState } from "react";
import { masterDataApi } from "../api/masterDataApi";
import { BulkImportResult } from "../types/masterDataTypes";
import { UploadCloud, X, CheckCircle2, AlertCircle, FileCode } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_TEMPLATE = `[
  {
    "name": "Barak Valley Trauma Center",
    "facility_type": "HOSPITAL",
    "state": "Odisha",
    "district": "Khordha",
    "latitude": 24.833,
    "longitude": 92.778,
    "capacity_metric": "300 ICU Beds",
    "contact_phone": "+913842234567"
  },
  {
    "name": "Jowai Strategic Relief Depot",
    "facility_type": "RELIEF_CENTER",
    "state": "Odisha",
    "district": "West Jaintia Hills",
    "latitude": 25.450,
    "longitude": 92.200,
    "capacity_metric": "5000 MT Relief Storage",
    "contact_phone": "+913652220100"
  }
]`;

export const BulkImportModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [jsonText, setJsonText] = useState(SAMPLE_TEMPLATE);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const items = JSON.parse(jsonText);
      if (!Array.isArray(items)) {
        throw new Error("Input must be a JSON array of facility items.");
      }
      const res = await masterDataApi.bulkImport(items, overwrite);
      setResult(res);
      if (res.created_count > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Invalid JSON or network failure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 font-sans animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">Bulk Ingest Master Facilities</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl space-y-1 font-mono">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Bulk Ingestion Completed</span>
            </div>
            <p>
              Processed: {result.total_processed} | Ingested/Updated: {result.created_count} | Skipped Duplicates: {result.skipped_duplicates}
            </p>
          </div>
        )}

        <div className="flex-1 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-400 uppercase block">JSON Master Data Payload</label>
            <button
              type="button"
              onClick={() => setJsonText(SAMPLE_TEMPLATE)}
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              <FileCode className="w-3 h-3" />
              <span>Load Template</span>
            </button>
          </div>

          <textarea
            rows={10}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-purple-500 font-mono text-xs"
          />

          <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-purple-500 focus:ring-0"
            />
            <span>Overwrite existing facilities with matching names</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow disabled:opacity-50"
          >
            {loading ? "Validating & Ingesting..." : "Execute Bulk Ingestion"}
          </button>
        </div>
      </div>
    </div>
  );
};
