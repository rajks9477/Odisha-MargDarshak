"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { ApiClient } from "@/lib/api";
import { 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Radio, 
  Camera, 
  Compass,
  MapPin,
  ListFilter
} from "lucide-react";

// Dynamically import full GIS map with SSR disabled
const CitizenLiveMapPortal = dynamic(
  () => import("@/components/citizen/CitizenLiveMapPortal").then((mod) => mod.CitizenLiveMapPortal),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[70vh] rounded-3xl flex flex-col items-center justify-center bg-stone-900 text-white">
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-2" />
        <p className="text-xs text-stone-300 font-bold">Loading Live Surrounding Road Risk Telemetry...</p>
      </div>
    ),
  }
);

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"LIVE_MAP" | "DISRUPTIONS_FEED">("LIVE_MAP");
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [apiTesting, setApiTesting] = useState(false);

  // Form mock report
  const [reportRoad, setReportRoad] = useState("NH-10 Siliguri - Gangtok Highway");
  const [reportSeverity, setReportSeverity] = useState("MEDIUM_DELAY");
  const [reportDetails, setReportDetails] = useState("Mud accumulation near 29th Mile due to heavy overnight rain. Single-lane movement.");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleTestApi = async () => {
    setApiTesting(true);
    try {
      const data = await ApiClient.get("/rbac-test/citizen-zone");
      setApiTestResult({ success: true, data });
    } catch (err: any) {
      setApiTestResult({ success: false, error: err.detail });
    } finally {
      setApiTesting(false);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
    }, 4000);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Module Overview Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-0.5">
            <Compass className="w-4 h-4 text-emerald-700" /> Citizen &amp; Commuter Safety Portal
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            360° Surrounding Road Risk &amp; Safe Navigation
          </h2>
          <p className="text-xs text-stone-600">
            Live AI-monitored highway accessibility, landslide avoidance routing, and emergency beacon.
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-stone-100 p-1 rounded-2xl border border-stone-200 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setViewMode("LIVE_MAP")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "LIVE_MAP"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Live Safe Map &amp; Routing</span>
            </button>
            <button
              onClick={() => setViewMode("DISRUPTIONS_FEED")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "DISRUPTIONS_FEED"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Advisory &amp; Reports</span>
            </button>
          </div>

          <button
            onClick={handleTestApi}
            disabled={apiTesting}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-emerald-900 border border-stone-200 text-xs font-bold shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{apiTesting ? "Testing..." : "RBAC Token"}</span>
          </button>
        </div>
      </div>

      {/* Backend RBAC Proof Box */}
      {apiTestResult && (
        <div className={`p-3.5 rounded-2xl border text-xs font-mono animate-in fade-in ${
          apiTestResult.success 
            ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <div className="flex items-center justify-between mb-1 font-bold">
            <span>FastAPI Authorization Response:</span>
            <span>{apiTestResult.success ? "200 OK — CITIZEN_ACCESS_GRANTED" : "Access Blocked"}</span>
          </div>
          <pre className="overflow-x-auto text-[11px] pt-1">
            {JSON.stringify(apiTestResult.data || apiTestResult.error, null, 2)}
          </pre>
        </div>
      )}

      {/* 1. PRIMARY VIEW: FULL-SCREEN INTERACTIVE GOOGLE MAPS STYLE CITIZEN PORTAL */}
      {viewMode === "LIVE_MAP" && (
        <div className="rounded-3xl overflow-hidden border border-stone-300 shadow-xl min-h-[75vh]">
          <CitizenLiveMapPortal />
        </div>
      )}

      {/* 2. SECONDARY VIEW: DISRUPTION FEED & INCIDENT SUBMISSION */}
      {viewMode === "DISRUPTIONS_FEED" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Left 2 Cols: Public Disruption Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-700" /> Active Regional Disruption Advisory
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> NH-6 Sonapur Tunnel Corridor (Shillong ➔ Silchar)
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">8 mins ago</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Major rockfall and mud debris near Sonapur Tunnel mouth. Road closed for heavy transit. Light vehicles advised detour via Umrangso-Haflong green corridor.
                </p>
                <div className="text-[11px] text-stone-500 font-medium flex gap-4 pt-1 border-t border-stone-100">
                  <span>District: East Jaintia Hills</span>
                  <span className="text-rose-700 font-bold">Severity: Road Blocked</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> NH-10 Teesta Valley Pass (Gangtok ➔ Siliguri)
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">24 mins ago</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Single-lane traffic movement near Likuvir / 29th Mile due to fresh mud debris. Light passenger vehicles permitted with extreme caution.
                </p>
                <div className="text-[11px] text-stone-500 font-medium flex gap-4 pt-1 border-t border-stone-100">
                  <span>District: Kalimpong / Gangtok</span>
                  <span>Severity: Moderate Delay</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> NH-27 East-West 4-Lane Corridor (Guwahati ➔ Nagaon)
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">1 hour ago</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Four-lane expressway is fully clear with 2-way seamless flow. Dry pavement conditions reported across all checkpoints.
                </p>
                <div className="text-[11px] text-stone-500 font-medium flex gap-4 pt-1 border-t border-stone-100">
                  <span>District: Kamrup / Nagaon</span>
                  <span className="text-emerald-800 font-bold">Status: Safe Highway</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Citizen Incident Reporting Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700" /> Report Ground Disruption
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Submit crowd-sourced blockage info for field officer verification
              </p>
            </div>

            {reportSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <div className="text-xs font-bold text-emerald-950">Incident Reported Successfully!</div>
                <p className="text-[11px] text-stone-600">
                  Routed to the local District Disaster Management desk &amp; Field Officer queue.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Highway / Road Location</label>
                  <input
                    type="text"
                    value={reportRoad}
                    onChange={(e) => setReportRoad(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 outline-none focus:border-emerald-700"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Severity</label>
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 outline-none"
                  >
                    <option value="LOW_HAZARD">Low (Potholes / Minor Debris)</option>
                    <option value="MEDIUM_DELAY">Medium (Single Lane / Slowdown)</option>
                    <option value="CRITICAL_BLOCKED">Critical (Road Fully Blocked)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Incident Details</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 outline-none focus:border-emerald-700 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Geo-Report</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
