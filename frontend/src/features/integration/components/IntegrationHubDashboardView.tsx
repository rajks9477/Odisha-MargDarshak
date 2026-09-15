"use client";

import React, { useState, useEffect } from "react";
import {
  IntegrationHubSummary,
  ExternalConnector,
  IngestionBatch,
} from "../types/integrationTypes";
import { integrationApi } from "../api/integrationApi";
import { IntegrationHubKPICards } from "./IntegrationHubKPICards";
import { ConnectorTable } from "./ConnectorTable";
import { IngestionBatchViewer } from "./IngestionBatchViewer";
import { Cable, RefreshCw, CheckCircle2 } from "lucide-react";

export const IntegrationHubDashboardView: React.FC = () => {
  const [summary, setSummary] = useState<IntegrationHubSummary | null>(null);
  const [connectors, setConnectors] = useState<ExternalConnector[]>([]);
  const [batches, setBatches] = useState<IngestionBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, connRes, batchRes] = await Promise.all([
        integrationApi.getSummary(),
        integrationApi.getConnectors(),
        integrationApi.getBatches(),
      ]);
      setSummary(sumRes);
      setConnectors(connRes);
      setBatches(batchRes);
    } catch (e) {
      console.warn("Failed to load integration hub data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncConnector = async (connectorId: string) => {
    try {
      const res = await integrationApi.syncConnector(connectorId);
      setNotification(`✓ ${res.message}`);
      setTimeout(() => setNotification(null), 4000);
      loadData();
    } catch (e: any) {
      alert(e.message || "Sync execution failed");
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Cable className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Data Ingestion & External Integration Hub
            </h2>
            <p className="text-xs text-slate-400">
              Real-time pipeline orchestration for IMD weather radars, ISRO Bhuvan satellite imagery & MoRTH GIS layers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh Hub</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Provenance Disclaimer */}
      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-[10px]">
        <span className="text-slate-400">
          Staging Pipeline: Schema Validation, PostGIS Coordinate Normalization, Deduplication & Auto-Promotion
        </span>
        <span className="text-cyan-400 font-bold">[Demo Ingestion Pipeline]</span>
      </div>

      {/* Summary KPI Cards */}
      <IntegrationHubKPICards summary={summary} />

      {/* Connectors Table */}
      <ConnectorTable
        connectors={connectors}
        onSync={handleSyncConnector}
      />

      {/* Batch Logs Viewer */}
      <IngestionBatchViewer batches={batches} />
    </div>
  );
};
