"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Map, 
  Navigation, 
  AlertTriangle, 
  Bell, 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  Camera, 
  X, 
  Radio, 
  Brain, 
  CloudRain, 
  ShieldAlert, 
  Globe, 
  Activity, 
  Sliders, 
  BarChart3, 
  Database, 
  Cable, 
  ShieldCheck 
} from "lucide-react";

interface QuickActionGridProps {
  unreadAlertCount?: number;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({ unreadAlertCount = 0 }) => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState("LANDSLIDE_DEBRIS");
  const [roadLocation, setRoadLocation] = useState("NH-6 Sonapur Tunnel Approach");
  const [notes, setNotes] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportModalOpen(false);
      setNotes("");
    }, 2500);
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-700" /> Core Driver Operations &amp; Quick Dispatch Tiles
        </h2>
        <span className="text-xs text-stone-400 hidden sm:inline">Tactile Touch Targets</span>
      </div>

      {/* 4 Core Quick Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Live Map */}
        <Link
          href="/dashboard/driver/map"
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-emerald-700 shadow-xs hover:shadow-md transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#E9F5ED] text-emerald-700 flex items-center justify-center border border-[#C2E2CC] group-hover:scale-110 transition-transform">
              <Map className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-[#E9F5ED] px-2 py-0.5 rounded-md border border-[#C2E2CC]">
              GPS
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
              Live GIS Map
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
              Terrain layers, landslides, relief centers & bridge limits
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-800">
            <span>Open Map</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 2. Fast Report Incident */}
        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-rose-500 shadow-xs hover:shadow-md text-left transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              FAST SOS
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-rose-700 transition-colors">
              Report Incident
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
              Instant GPS tag, voice note & road blockage upload
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-rose-700">
            <span>Report Now</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* 3. Safety Alerts */}
        <Link
          href="/dashboard/driver/alerts"
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-amber-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            {unreadAlertCount > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 animate-bounce">
                {unreadAlertCount} NEW
              </span>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
              Safety Alerts
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
              IMD flood warnings, curfew notifications & hill detours
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-800">
            <span>View Alerts</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 4. Active Route & Navigator */}
        <Link
          href="/dashboard/driver/route-planning"
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-emerald-700 shadow-xs hover:shadow-md transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 group-hover:scale-110 transition-transform">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              NAVIGATOR
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
              Route & GPS Navigator
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
              Google Maps style turn-by-turn navigation & risk-color routes
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-800">
            <span>Start Route</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Intelligence & Analytics Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* AI Corridor Risk Intelligence */}
        <Link
          href="/dashboard/driver/risk-intelligence"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-amber-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 group-hover:scale-110 transition-transform">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                    AI Corridor Risk Intelligence
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    ML Engine
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Gradient boosting model scores & SHAP hazard explainability
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Weather & Disaster Intelligence */}
        <Link
          href="/dashboard/driver/weather-disasters"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-blue-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 group-hover:scale-110 transition-transform">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-blue-800 transition-colors">
                    Weather & Disaster Radar
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300">
                    IMD Radar
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Rainfall telemetry, cloudburst alerts & flood bulletins
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-blue-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Logistics Operations */}
        <Link
          href="/dashboard/driver/logistics"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-purple-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-purple-800 transition-colors">
                    Logistics & Essential Supplies
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300">
                    Warehouses
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Emergency medical dispatches, cold-chain trucks & inventory
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-purple-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Cascading Impact Analysis */}
        <Link
          href="/dashboard/driver/impact-analysis"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-rose-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 group-hover:scale-110 transition-transform">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-rose-800 transition-colors">
                    Cascading Impact Engine
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                    Network Graphs
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Graph traversal predicting downstream vehicle bottlenecks
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-rose-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Digital Twin Network */}
        <Link
          href="/dashboard/driver/digital-twin"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-emerald-700 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E9F5ED] text-emerald-700 flex items-center justify-center border border-[#C2E2CC] group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    Digital Twin Network
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC]">
                    Live State
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Interactive GIS network representation & dependency graphs
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Simulation Engine */}
        <Link
          href="/dashboard/driver/simulation-engine"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-purple-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 group-hover:scale-110 transition-transform">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-purple-800 transition-colors">
                    Simulation / What-If Engine
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300">
                    What-If Scenarios
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Simulate bridge collapse, monsoonal washouts & detours
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-purple-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Resilience & Infrastructure Planning */}
        <Link
          href="/dashboard/driver/resilience-planning"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-amber-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                    Resilience & Planning
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Criticality Score
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Critical roads, bridges & single-point-of-failure ranking
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Analytics & Reports */}
        <Link
          href="/dashboard/driver/analytics"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-teal-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-teal-800 transition-colors">
                    Analytics & Audit Reports
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-300">
                    Audit CSVs
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Incident trends, average delays & downloadable audit reports
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-teal-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Master Data Management */}
        <Link
          href="/dashboard/driver/master-data"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-emerald-700 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E9F5ED] text-emerald-700 flex items-center justify-center border border-[#C2E2CC] group-hover:scale-110 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    Master Data Management
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC]">
                    Core Registry
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Manage hospitals, disaster camps, supply warehouses & fuel depots
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Data Ingestion & Integration Hub */}
        <Link
          href="/dashboard/driver/integration-hub"
          className="block p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-blue-600 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 group-hover:scale-110 transition-transform">
                <Cable className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-blue-800 transition-colors">
                    Data Ingestion Hub
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300">
                    Adapters & Sync
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  IMD radar telemetry, ISRO Bhuvan satellite metadata & MoRTH GIS
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-blue-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* System Diagnostics & Stakeholder Demo */}
        <Link
          href="/dashboard/driver/system-status"
          className="block p-3.5 rounded-2xl bg-gradient-to-r from-white via-[#F8F4EE] to-white border border-[#E4D5C5] hover:border-[#8C6D46] shadow-xs hover:shadow-md transition-all hover:scale-[1.01] group col-span-1 md:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F8F4EE] text-[#7F5539] flex items-center justify-center border border-[#E4D5C5] group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#7F5539] transition-colors">
                    System Diagnostics & Stakeholder Demo
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC] font-bold">
                    Production Ready
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Live subsystem status, 22 online modules & guided persona login switcher
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#7F5539] group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Fast Incident Reporting Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D8] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Fast Driver Incident Upload</span>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="p-4 bg-[#E9F5ED] border border-[#C2E2CC] rounded-xl text-[#1B4332] text-xs font-mono space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Incident Logged with Live GPS Metadata</span>
                </div>
                <p className="text-stone-600">Dispatched to District SDRF / PWD Verification Queue.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3 font-sans text-xs">
                <div>
                  <label className="text-[11px] text-stone-600 font-bold block mb-1">Disruption Type</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-stone-900 font-medium outline-none focus:border-emerald-700"
                  >
                    <option value="LANDSLIDE_DEBRIS">Landslide / Mud & Boulders</option>
                    <option value="FLASH_FLOOD_OVERFLOW">Flash Flood / Road Submerged</option>
                    <option value="BRIDGE_STRUCTURAL_HAZARD">Bridge Structural Disruption</option>
                    <option value="VEHICLE_BREAKDOWN">Heavy Commercial Vehicle Breakdown</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-stone-600 font-bold block mb-1">Road / Corridor Location</label>
                  <input
                    type="text"
                    value={roadLocation}
                    onChange={(e) => setRoadLocation(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-stone-900 font-medium outline-none focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-600 font-bold block mb-1">Driver Field Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe road blockage extent and weather conditions..."
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-stone-900 font-medium outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EAE1]">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Fast Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
