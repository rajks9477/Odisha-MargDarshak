"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  IncidentService, 
  IncidentReport, 
  IncidentSeverity, 
} from "@/services/incidentService";
import { 
  IncidentBroadcastService, 
  GeoTaggedIncident 
} from "@/services/incidentBroadcastService";
import { 
  HardHat, 
  MapPin, 
  CheckCircle2, 
  FileCheck,
  RefreshCw,
  XCircle,
  HelpCircle,
  Check,
  X,
  Volume2,
  Camera,
  Radio,
  Plus,
  Maximize2,
  Navigation,
  Clock,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import { GovernmentCommandCenterView } from "@/features/command_center/components/GovernmentCommandCenterView";
import { FieldOfficerIncidentReportModal } from "@/components/officer/FieldOfficerIncidentReportModal";

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [broadcastedIncidents, setBroadcastedIncidents] = useState<GeoTaggedIncident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GeoTaggedIncident | null>(null);
  const [actionType, setActionType] = useState<"VERIFY" | "REJECT" | "REQUEST_INFO" | "RESOLVE" | null>(null);
  const [actionNote, setActionNote] = useState<string>("");
  const [actionTaken, setActionTaken] = useState<string>("PWD_EARTHMOVERS_DEPLOYED");
  const [actionProcessing, setActionProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadPendingIncidents();
    loadBroadcastedIncidents();

    // Subscribe to live broadcasts
    const unsubscribe = IncidentBroadcastService.subscribe((updated) => {
      setBroadcastedIncidents(updated);
    });

    return () => unsubscribe();
  }, []);

  const loadBroadcastedIncidents = () => {
    setBroadcastedIncidents(IncidentBroadcastService.getIncidents());
  };

  const loadPendingIncidents = async () => {
    setLoading(true);
    try {
      const data = await IncidentService.getPendingIncidents();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load pending officer incidents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedIncident || !actionType) return;
    setActionProcessing(true);
    try {
      if (actionType === "VERIFY") {
        await IncidentService.verifyIncident(selectedIncident.id, actionNote || "Hazard confirmed on site by inspection team.", actionTaken);
        setSuccessMessage(`Incident ${selectedIncident.id} verified. Downstream road and alert triggers updated.`);
      } else if (actionType === "REJECT") {
        await IncidentService.rejectIncident(selectedIncident.id, actionNote || "Report verified as duplicate or cleared.");
        setSuccessMessage(`Incident ${selectedIncident.id} marked rejected.`);
      } else if (actionType === "REQUEST_INFO") {
        await IncidentService.requestInfo(selectedIncident.id, actionNote || "Please supply additional photos from checkpoint.");
        setSuccessMessage(`Inquiry sent for ${selectedIncident.id}.`);
      } else if (actionType === "RESOLVE") {
        await IncidentService.resolveIncident(selectedIncident.id, actionNote || "Road debris cleared. Normal traffic restored.", "GREEN");
        setSuccessMessage(`Incident ${selectedIncident.id} resolved. Road reopened to GREEN.`);
      }

      setSelectedIncident(null);
      setActionType(null);
      setActionNote("");
      loadPendingIncidents();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert("Action failed: " + (err.detail || err.message || "Unknown error"));
    } finally {
      setActionProcessing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "HIGH":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-[#E9F5ED] text-[#1B4332] border-[#C2E2CC]";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Unified Government Command Center */}
      <GovernmentCommandCenterView />

      {/* Field Officer Ground Reporting Action Banner */}
      <div className="bg-gradient-to-r from-[#FAF8F5] via-white to-amber-50/60 border-2 border-amber-500/40 rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-lg shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Ground Telemetry & Geo-Tagged Reporting
              </span>
              <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Live Multi-Portal Sync
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900">
              Submit Live Geo-Tagged Ground Hazard & Photo Evidence
            </h2>
            <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
              Upload ground photos with auto-stamped GPS coordinates. Reports immediately update <strong>Driver In-Cabin Navigation Alerts</strong>, <strong>Gov Command Centers</strong>, and <strong>Public Citizen 360° Safety Maps</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl font-black text-xs shadow-xl flex items-center gap-2.5 transition-all transform hover:scale-[1.02] cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Report New Geo-Tagged Hazard</span>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2 text-[#7F5539] text-xs font-bold uppercase tracking-wider mb-1">
            <HardHat className="w-4 h-4 text-amber-700" /> Field Official & Ground Engineering Desk
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            Geo-Tagged Incident Verification & Clearance Console
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Jurisdiction: <strong>{user?.district || "East Jaintia Hills / Tawang Sector"}</strong> • Department: <strong>{user?.department || "PWD Border Roads & Disaster Response"}</strong>
          </p>
        </div>

        <button
          onClick={() => {
            loadPendingIncidents();
            loadBroadcastedIncidents();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-[#7F5539] border border-[#E4D5C5] text-xs font-bold shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh All Telemetry</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#E9F5ED] border border-[#C2E2CC] text-[#1B4332] text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. Live Active Broadcasted Incidents with Geo-Tagged Image Evidence */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-600 animate-pulse" /> 
            <span>Live Broadcasted Field Incidents ({broadcastedIncidents.length})</span>
            <span className="text-[11px] font-normal text-stone-500 font-mono">
              [Visible on Driver HUD, Gov Command & Citizen Portal]
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {broadcastedIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-5 rounded-3xl bg-white border border-[#E8E2D8] space-y-4 shadow-sm hover:border-amber-500/80 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-stone-800 bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E8E2D8]">
                  {inc.id}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${getSeverityBadge(inc.severity)}`}>
                    {inc.severity}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    BROADCASTED
                  </span>
                </div>
              </div>

              {/* Image Preview & Details Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {inc.image_url ? (
                  <div
                    onClick={() => setSelectedPhoto(inc)}
                    className="relative w-full sm:w-36 h-28 rounded-2xl overflow-hidden border border-[#E8E2D8] bg-stone-100 shrink-0 cursor-pointer group-hover:shadow-md transition-shadow"
                  >
                    <img 
                      src={inc.image_url} 
                      alt="Geo-Tagged Hazard" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </div>
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-emerald-300">
                      📸 Geo-Photo
                    </div>
                  </div>
                ) : (
                  <div className="w-full sm:w-36 h-28 rounded-2xl bg-stone-100 border border-[#E8E2D8] flex flex-col items-center justify-center text-stone-400 shrink-0">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">No Photo</span>
                  </div>
                )}

                <div className="min-w-0 space-y-1.5 flex-1">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">{inc.road_name}</span>
                  </h4>
                  <div className="text-[11px] font-mono text-[#7F5539] font-bold">
                    Corridor: {inc.corridor_name}
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>
                </div>
              </div>

              {/* Action & Detour Info */}
              <div className="space-y-1.5 text-xs bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8]">
                {inc.action_taken && (
                  <div className="flex items-start gap-1.5 text-stone-700">
                    <HardHat className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span><strong>Ground Action:</strong> {inc.action_taken}</span>
                  </div>
                )}
                {inc.recommended_detour && (
                  <div className="flex items-start gap-1.5 text-emerald-800">
                    <Navigation className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Detour:</strong> {inc.recommended_detour}</span>
                  </div>
                )}
              </div>

              {/* Metadata Footer */}
              <div className="pt-2 border-t border-[#F0EAE1] flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span>{inc.latitude.toFixed(3)}°N, {inc.longitude.toFixed(3)}°E (±{inc.gps_accuracy}m)</span>
                </span>
                <span>By: <strong>{inc.reporter_name}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Pending Ground Verification Tasks Queue from Remote Drivers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-700" /> Pending Citizen/Driver Reports Awaiting Verification ({incidents.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500 text-xs flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-emerald-700 animate-spin" />
            <span>Loading pending field reports from regional highway telemetry...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#E8E2D8] text-stone-500 text-xs space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <p className="font-bold text-stone-900">Zero Pending Hazards in Verification Queue</p>
            <p className="text-stone-500">All regional highway corridors in your sector are verified or active clearance is completed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-5 rounded-2xl bg-white border border-[#E8E2D8] space-y-4 shadow-xs hover:border-[#D4A373] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-stone-800 bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                    {inc.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {inc.is_possible_duplicate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                        POSSIBLE DUPLICATE
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSeverityBadge(inc.severity)}`}>
                      {inc.severity} SEVERITY
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{inc.road_name || "Highway Corridor"}</span>
                  </h4>
                  <p className="text-xs text-stone-800 mt-1 font-semibold">
                    Type: <span className="text-[#7F5539]">{inc.type.replace("_", " ")}</span>
                  </p>
                  <p className="text-xs text-stone-600 mt-1">{inc.description}</p>

                  {inc.voice_transcript && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-[11px] text-stone-700 flex items-start gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                      <span>"{inc.voice_transcript}"</span>
                    </div>
                  )}

                  <div className="text-[11px] text-stone-500 mt-2 flex flex-wrap items-center gap-3 font-medium">
                    <span>Reporter: <strong className="text-stone-800">{inc.reporter_name || "Field Driver"}</strong></span>
                    <span>GPS Acc: <strong>±{inc.gps_accuracy}m</strong></span>
                    <span>Score: <strong className="text-emerald-800 font-bold">{inc.evidence_quality_score}/100</strong></span>
                    <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Verification Action Bar */}
                <div className="pt-3 border-t border-[#F0EAE1] flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => {
                      setSelectedIncident(inc);
                      setActionType("REQUEST_INFO");
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Inquire</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedIncident(inc);
                      setActionType("REJECT");
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedIncident(inc);
                      setActionType("VERIFY");
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Verify & Broadcast</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Officer Incident Submission Modal */}
      <FieldOfficerIncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        officerName={user?.name || "Er. Tashi Norbu"}
        department={user?.department || "PWD Border Roads & Disaster Response"}
        onIncidentCreated={(newInc) => {
          loadBroadcastedIncidents();
          setSuccessMessage(`Hazard ${newInc.id} on ${newInc.road_name} broadcasted across all portals!`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

      {/* Full-Screen Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold">Field Photographic Evidence ({selectedPhoto.road_name})</h4>
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
              <div className="text-xs text-stone-300 font-mono flex justify-between">
                <span>GPS: {selectedPhoto.latitude}°N, {selectedPhoto.longitude}°E</span>
                <span>Officer: {selectedPhoto.reporter_name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog / Modal */}
      {selectedIncident && actionType && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-700" />
                <span>
                  {actionType === "VERIFY" && "Verify Highway Incident"}
                  {actionType === "REJECT" && "Reject Incident Report"}
                  {actionType === "REQUEST_INFO" && "Request Additional Information"}
                  {actionType === "RESOLVE" && "Mark Incident Resolved & Road Cleared"}
                </span>
              </h3>
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  setActionType(null);
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-1 text-xs">
              <div className="flex justify-between font-mono text-[11px] text-stone-500">
                <span>{selectedIncident.id}</span>
                <span className="text-[#7F5539] font-bold">{selectedIncident.type.replace("_", " ")}</span>
              </div>
              <div className="text-stone-900 font-bold">{selectedIncident.road_name}</div>
              <div className="text-stone-600 text-[11px]">{selectedIncident.description}</div>
            </div>

            {actionType === "VERIFY" && (
              <div className="space-y-1.5 text-xs">
                <label className="text-stone-700 font-bold">Deployment Action Taken:</label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 text-xs focus:border-amber-700 focus:outline-none"
                >
                  <option value="PWD_EARTHMOVERS_DEPLOYED">PWD Earthmovers & Heavy Cranes Deployed</option>
                  <option value="TRAFFIC_POLICE_SINGLE_LANE">Traffic Police Single-Lane Passing Regulated</option>
                  <option value="SDRF_RESCUE_CONVOY_DISPATCHED">SDRF Emergency Response Convoy Dispatched</option>
                  <option value="BRO_DOZER_DEBRIS_REMOVAL">BRO Heavy Dozer Debris Removal In Progress</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <label className="text-stone-700 font-bold">
                {actionType === "VERIFY" && "Official Verification Note (Dispatched to Drivers):"}
                {actionType === "REJECT" && "Reason for Rejection:"}
                {actionType === "REQUEST_INFO" && "Inquiry Message for Reporter:"}
                {actionType === "RESOLVE" && "Resolution Notes:"}
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === "VERIFY"
                    ? "e.g. Ground inspection confirmed river overflow 500m before Baitarani bridge. Emergency team on site."
                    : "Enter remarks..."
                }
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 text-xs focus:border-amber-700 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-[#F0EAE1]">
              <button
                type="button"
                onClick={() => {
                  setSelectedIncident(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={actionProcessing}
                className="px-4 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {actionProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
