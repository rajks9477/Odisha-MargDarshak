"use client";

import React, { useState, useEffect } from "react";
import {
  AnalyticsOverview,
  TrendDataPoint,
  DecisionSupportItem,
  GeneratedReport,
} from "../types/analyticsTypes";
import { analyticsApi } from "../api/analyticsApi";
import { AnalyticsKPIGrid } from "./AnalyticsKPIGrid";
import { DecisionSupportPanel } from "./DecisionSupportPanel";
import {
  BarChart3,
  RefreshCw,
  FileText,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export const AnalyticsDashboardView: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [recommendations, setRecommendations] = useState<DecisionSupportItem[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [generating, setGenerating] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, trData, recData, repData] = await Promise.all([
        analyticsApi.getOverview(selectedState),
        analyticsApi.getTrends(),
        analyticsApi.getDecisionSupport(selectedState),
        analyticsApi.getReports(),
      ]);
      setOverview(ovData);
      setTrends(trData);
      setRecommendations(recData);
      setReports(repData);
    } catch (e) {
      console.warn("Failed to load analytics data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedState]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const newRep = await analyticsApi.generateReport(
        "Monthly Regional Highway Disruption & Resilience Audit",
        "CORRIDOR_DISRUPTION_SUMMARY",
        selectedState
      );
      setReportSuccess(`✓ Report ${newRep.id} generated and archived.`);
      setReports((prev) => [newRep, ...prev]);
      setTimeout(() => setReportSuccess(null), 4000);
    } catch (e) {
      console.warn("Report generation error", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCsv = (reportId: string) => {
    window.open(
      `http://127.0.0.1:8000/api/v1/analytics/reports/${reportId}/download-csv`,
      "_blank"
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Analytics, Reports & Government Decision Support
            </h2>
            <p className="text-xs text-slate-400">
              Multi-source intelligence consolidation across Incidents, Routing, Weather, Logistics & Resilience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
          >
            <option value="ALL">All 8 NE States</option>
            <option value="Khordha">Khordha</option>
            <option value="Cuttack">Cuttack</option>
            <option value="Bhadrak">Bhadrak</option>
            <option value="Balasore">Balasore</option>
            <option value="Kendujhar">Kendujhar</option>
            <option value="Sambalpur">Sambalpur</option>
            <option value="Ganjam">Ganjam</option>
            <option value="Koraput">Koraput</option>
          </select>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {reportSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl font-bold">
          {reportSuccess}
        </div>
      )}

      {/* Provenance Disclaimer */}
      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-[10px]">
        <span className="text-slate-400">
          Source Aggregation: PostGIS Spatial Telemetry, IMD Forecasts, Logistics Ledger & Resilience Engine
        </span>
        <span className="text-cyan-400 font-bold">[Demo Analytical Dashboard]</span>
      </div>

      {/* Overview KPI Cards */}
      <AnalyticsKPIGrid overview={overview} />

      {/* Temporal Trend Progression */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Monthly Incident Frequency & Transit Delay Trend</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">4-Week Rolling Window</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          {trends.map((t, idx) => (
            <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 block">{t.period}</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-red-400">{t.incidents_count} Incidents</span>
                <span className="text-xs font-bold text-amber-400">+{t.average_delay_hours}h Delay</span>
              </div>
              <span className="text-[9px] text-slate-500 block">
                {t.blocked_corridors_count} Corridors Blocked
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Decision Support Panel */}
      <DecisionSupportPanel items={recommendations} />

      {/* Generated Reports & CSV Download Catalog */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Generated Audit Reports Catalog ({reports.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Downloadable CSV / Audit Archive</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[9px] text-cyan-400 block font-bold">{rep.id}</span>
                <h4 className="text-xs font-bold text-slate-200">{rep.report_title}</h4>
                <span className="text-[9px] text-slate-500 block">
                  State: {rep.state_filter} | {new Date(rep.created_at).toLocaleDateString()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadCsv(rep.id)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-bold border border-slate-800 flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Download CSV</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
