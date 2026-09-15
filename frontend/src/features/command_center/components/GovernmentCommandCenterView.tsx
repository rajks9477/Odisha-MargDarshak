"use client";

import React, { useState, useEffect } from "react";
import {
  CommandCenterSummary,
  CommandCenterIncident,
} from "../types/commandCenterTypes";
import { commandCenterApi } from "../api/commandCenterApi";
import { CommandSummaryCards } from "./CommandSummaryCards";
import { RegionalCorridorMatrix } from "./RegionalCorridorMatrix";
import { AICopilotPanel } from "@/features/copilot/components/AICopilotPanel";
import { 
  IncidentBroadcastService, 
  GeoTaggedIncident 
} from "@/services/incidentBroadcastService";
import {
  ShieldCheck,
  RefreshCw,
  Building,
  CheckCircle2,
  XCircle,
  Camera,
  MapPin,
  X,
  Maximize2,
  HardHat,
  Radio,
  Navigation
} from "lucide-react";

export const GovernmentCommandCenterView: React.FC = () => {
  const [summary, setSummary] = useState<CommandCenterSummary | null>(null);
  const [incidents, setIncidents] = useState<CommandCenterIncident[]>([]);
  const [broadcastedIncidents, setBroadcastedIncidents] = useState<GeoTaggedIncident[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<GeoTaggedIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, incData] = await Promise.all([
        commandCenterApi.getSummary(),
        commandCenterApi.getActiveIncidents(),
      ]);
      setSummary(sumData);
      setIncidents(incData);
    } catch (e) {
      console.warn("Failed to load command center data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setBroadcastedIncidents(IncidentBroadcastService.getIncidents());

    const unsubscribe = IncidentBroadcastService.subscribe((updated) => {
      setBroadcastedIncidents(updated);
    });

    return () => unsubscribe();
  }, []);

  const handleVerify = async (incidentId: string) => {
    setVerifyingId(incidentId);
    try {
      await commandCenterApi.verifyIncident(incidentId, "Verified by District Command Center Officer.");
      await loadData();
    } catch (e) {
      console.warn("Verification failed", e);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReject = async (incidentId: string) => {
    setVerifyingId(incidentId);
    try {
      await commandCenterApi.rejectIncident(incidentId, "Rejected due to unconfirmed field reports.");
      await loadData();
    } catch (e) {
      console.warn("Rejection failed", e);
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== "ALL" && inc.severity !== filterSeverity) return false;
    return true;
  });

  const filteredBroadcasted = broadcastedIncidents.filter((inc) => {
    if (filterSeverity !== "ALL" && inc.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E9F5ED] text-emerald-800 border border-[#C2E2CC]">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">NER Government Command Center</h2>
            <p className="text-xs text-stone-500">
              Unified multi-modal decision support dashboard for District, State & MDoNER Officers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            loadData();
            setBroadcastedIncidents(IncidentBroadcastService.getIncidents());
          }}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl border border-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Synchronize Ground Telemetry</span>
        </button>
      </div>

      {/* Grounded Disclaimer */}
      <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl flex items-center justify-between text-xs font-mono text-[10px]">
        <span className="text-stone-600">
          Command Hub: Ministry of Development of North Eastern Region (MDoNER) & State PWD
        </span>
        <span className="text-[#7F5539] font-bold">[Demo Simulated Command Intelligence]</span>
      </div>

      {/* Summary Cards */}
      {summary && <CommandSummaryCards summary={summary} />}

      {/* Regional Corridor Matrix */}
      {summary && <RegionalCorridorMatrix corridors={summary.regional_corridors} />}

      {/* Ground Incidents Verification & Review Table */}
      <div className="p-5 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EAE1] pb-3">
          <div>
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Ground Incident Review & Verification Stream ({filteredBroadcasted.length + filteredIncidents.length})</span>
            </h3>
            <p className="text-[11px] text-stone-500">Review driver and field officer reported hazards with geo-tagged photographic evidence</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-xs text-stone-900 font-mono outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700" />
            <span>Fetching ground verification queue...</span>
          </div>
        ) : (filteredBroadcasted.length === 0 && filteredIncidents.length === 0) ? (
          <div className="p-6 text-center text-xs text-stone-500">
            No incidents pending verification in current view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E8E2D8] text-stone-500 text-[10px] uppercase bg-[#FAF8F5]">
                  <th className="py-2.5 px-3">Incident ID</th>
                  <th className="py-2.5 px-3">Hazard Type</th>
                  <th className="py-2.5 px-3">Location / Road</th>
                  <th className="py-2.5 px-3">Geo-Photo Evidence</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {/* 1. Live Broadcasted Incidents with Photos */}
                {filteredBroadcasted.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#FAF8F5] transition-colors bg-amber-50/20">
                    <td className="py-3 px-3 font-bold text-stone-900">
                      <div className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-amber-600 animate-pulse" />
                        <span>{inc.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-900 font-semibold">
                      {inc.type.replace("_", " ")}
                    </td>
                    <td className="py-3 px-3 text-stone-700">
                      <div className="font-bold">{inc.road_name}</div>
                      <div className="text-[10px] text-stone-500">
                        Lat: {inc.latitude.toFixed(3)}, Lng: {inc.longitude.toFixed(3)} (±{inc.gps_accuracy}m)
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {inc.image_url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(inc)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-emerald-700" />
                          <span>View Photo</span>
                        </button>
                      ) : (
                        <span className="text-stone-400 text-[10px]">No Image</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        inc.severity === "CRITICAL"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : inc.severity === "HIGH"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC]"
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        VERIFIED ({inc.reporter_name})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[10px] text-emerald-700 font-sans font-bold">
                        Broadcasting Live
                      </span>
                    </td>
                  </tr>
                ))}

                {/* 2. Database Pending Incidents */}
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-3 font-bold text-stone-900">{inc.id}</td>
                    <td className="py-3 px-3 text-stone-900 font-semibold">{inc.incident_type.replace("_", " ")}</td>
                    <td className="py-3 px-3 text-stone-700">
                      <div className="font-bold">{inc.road_id || "NH-6 Sonapur Corridor"}</div>
                      <div className="text-[10px] text-stone-500">Lat: {inc.latitude.toFixed(3)}, Lng: {inc.longitude.toFixed(3)}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-stone-400 text-[10px]">Telemetry Log</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        inc.severity === "CRITICAL"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : inc.severity === "HIGH"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC]"
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-stone-700 bg-white px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {inc.status === "ACTIVE" || inc.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleVerify(inc.id)}
                            disabled={verifyingId === inc.id}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verify</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(inc.id)}
                            disabled={verifyingId === inc.id}
                            className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-sans">Decision Recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full-Screen Photo Lightbox Modal for Command Center */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold">Field Photographic Evidence</h4>
                  <p className="text-[11px] text-stone-400 font-mono">
                    {selectedPhoto.id} • {selectedPhoto.road_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-white">
              <div className="h-80 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <img src={selectedPhoto.image_url} alt="Evidence" className="w-full h-full object-contain" />
              </div>
              <div className="text-xs text-stone-300 font-mono grid grid-cols-2 gap-2 bg-stone-800/60 p-3 rounded-xl border border-stone-700">
                <div><strong>GPS:</strong> {selectedPhoto.latitude}°N, {selectedPhoto.longitude}°E (±{selectedPhoto.gps_accuracy}m)</div>
                <div><strong>Officer:</strong> {selectedPhoto.reporter_name}</div>
                <div><strong>Action:</strong> {selectedPhoto.action_taken || "Under Assessment"}</div>
                <div><strong>Detour:</strong> {selectedPhoto.recommended_detour || "None"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Floating AI Decision Support Copilot Drawer */}
      <AICopilotPanel />
    </div>
  );
};
