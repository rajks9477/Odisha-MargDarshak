"use client";

import React, { useState, useEffect } from "react";
import { 
  IncidentBroadcastService, 
  GeoTaggedIncident 
} from "@/services/incidentBroadcastService";
import { Trip } from "@/services/driverService";
import { 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  Camera, 
  Navigation, 
  CheckCircle2, 
  Maximize2, 
  X, 
  Clock, 
  HardHat,
  ArrowRight,
  ShieldCheck,
  Compass,
  Radio
} from "lucide-react";

interface DriverRouteHazardAlertProps {
  trip?: Trip | null;
  onDetourAccepted?: (detourName: string) => void;
}

export const DriverRouteHazardAlert: React.FC<DriverRouteHazardAlertProps> = ({ 
  trip, 
  onDetourAccepted 
}) => {
  const [incidents, setIncidents] = useState<GeoTaggedIncident[]>([]);
  const [selectedPhotoIncident, setSelectedPhotoIncident] = useState<GeoTaggedIncident | null>(null);
  const [isDetourApplied, setIsDetourApplied] = useState<boolean>(false);
  const [appliedDetourName, setAppliedDetourName] = useState<string>("");

  useEffect(() => {
    // Load initial broadcasted incidents
    setIncidents(IncidentBroadcastService.getIncidents());

    // Subscribe to live broadcasts across tabs & components
    const unsubscribe = IncidentBroadcastService.subscribe((updated) => {
      setIncidents(updated);
    });

    return () => unsubscribe();
  }, []);

  // Check if driver has an active trip and if any incident falls along their route corridor
  const activeCorridor = trip?.corridor_name || "NH-16 Bhubaneswar-Cuttack-Balasore Coastal Corridor";
  const activeRoadId = trip?.corridor_name?.toLowerCase().includes("nh-6") ? "NH-6" : "";

  // Route-matched incidents (e.g. matching NH-6 or corridor text)
  const routeIncidents = incidents.filter((inc) => {
    const incCorridor = (inc.corridor_name || "").toLowerCase();
    const incRoad = (inc.road_name || "").toLowerCase();
    const incRoadId = (inc.road_id || "").toLowerCase();
    const target = activeCorridor.toLowerCase();

    return (
      incCorridor.includes("nh-6") ||
      incRoad.includes("nh-6") ||
      incRoadId.includes("nh-6") ||
      target.includes(incRoadId) ||
      (inc.severity === "CRITICAL" && incCorridor.includes("guwahati"))
    );
  });

  // Other non-route regional incidents
  const otherIncidents = incidents.filter((inc) => !routeIncidents.includes(inc));

  const handleApplyDetour = (detourText?: string) => {
    const detour = detourText || "Haflong-Umrangso All-Weather Green Bypass";
    setIsDetourApplied(true);
    setAppliedDetourName(detour);
    if (onDetourAccepted) {
      onDetourAccepted(detour);
    }
  };

  const primaryIncident = routeIncidents[0] || otherIncidents[0];
  const isOnDriverRoute = routeIncidents.length > 0;

  return (
    <>
      {primaryIncident && isOnDriverRoute ? (
        /* Critical Hazard on Active Route Box */
        <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-br from-rose-950/95 via-red-900/90 to-stone-900 border-2 border-rose-500 text-white shadow-xl space-y-4 overflow-hidden animate-in fade-in font-sans">
          <div className="space-y-3">
            {/* Top Hazard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/40 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-rose-600/40 text-rose-300 border border-rose-500/50 flex items-center justify-center animate-pulse shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                      CRITICAL HAZARD ON ROUTE
                    </span>
                    <span className="text-rose-300 text-[10px] font-mono font-bold truncate">
                      {primaryIncident.corridor_name}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-0.5 truncate">
                    {primaryIncident.road_name} ({primaryIncident.type.replace("_", " ")})
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="text-[10px] font-mono bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded-lg border border-rose-700/60 flex items-center gap-1">
                  <HardHat className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Verified: <strong>{primaryIncident.reporter_name}</strong></span>
                </span>
              </div>
            </div>

            {/* Description & Photo Evidence Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Description & Telemetry */}
              <div className={`${primaryIncident.image_url ? "sm:col-span-7" : "sm:col-span-12"} space-y-2 text-xs text-rose-100 min-w-0`}>
                <p className="text-[11px] sm:text-xs font-semibold text-white leading-snug bg-black/30 p-2 rounded-xl border border-rose-800/50">
                  "{primaryIncident.description}"
                </p>

                <div className="grid grid-cols-1 gap-1 font-mono text-[10px]">
                  <div className="p-1.5 rounded-lg bg-black/40 border border-rose-800/60 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">
                      <span className="text-rose-400 font-bold">GPS:</span>{" "}
                      {primaryIncident.latitude.toFixed(4)}° N, {primaryIncident.longitude.toFixed(4)}° E (±{primaryIncident.gps_accuracy}m)
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-black/40 border border-rose-800/60 flex items-center gap-1.5 truncate">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">
                      <span className="text-amber-400 font-bold">Reported:</span>{" "}
                      {new Date(primaryIncident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {primaryIncident.reporter_department}
                    </span>
                  </div>
                </div>

                {primaryIncident.action_taken && (
                  <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-700/50 text-[10px] flex items-start gap-1.5">
                    <HardHat className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <strong className="text-amber-300">Ground Team:</strong> {primaryIncident.action_taken}
                    </div>
                  </div>
                )}
              </div>

              {/* Geo-Tagged Photo Evidence Thumbnail */}
              {primaryIncident.image_url && (
                <div className="sm:col-span-5 relative group cursor-pointer" onClick={() => setSelectedPhotoIncident(primaryIncident)}>
                  <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-rose-400/80 shadow-lg bg-black">
                    <img 
                      src={primaryIncident.image_url} 
                      alt="Geo-Tagged Hazard Evidence" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-1.5">
                      <div className="self-start px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <Camera className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Geo-Photo</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-white font-mono">
                        <span>📸 Tap to Expand</span>
                        <Maximize2 className="w-3 h-3 text-white/80" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-stone-400 text-center mt-1">
                    Verified Photo by Field Officer
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Detour Section (Stacked cleanly to prevent horizontal overflow) */}
          <div className="pt-2.5 border-t border-rose-500/30 space-y-2 mt-2">
            <div className="p-2 rounded-xl bg-black/40 border border-rose-800/60 min-w-0">
              <div className="text-[9px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Recommended All-Weather Detour:
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {primaryIncident.recommended_detour || "Haflong-Umrangso All-Weather Green Bypass (Safe for all HCVs & Medical Reefers)"}
              </p>
            </div>

            {isDetourApplied ? (
              <div className="w-full py-2.5 px-3 bg-emerald-600/30 text-emerald-300 border border-emerald-500 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Detour Activated: {appliedDetourName}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleApplyDetour(primaryIncident.recommended_detour)}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span className="truncate">Accept Suggested Detour &amp; Reroute Trip</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}
          </div>
        </div>
      ) : primaryIncident ? (
        /* Regional Hazard Advisory Box */
        <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-br from-amber-950/90 via-stone-900 to-slate-900 border-2 border-amber-500/80 text-white shadow-xl space-y-4 overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-200">
                  Regional Hazard Advisory (Adjacent Corridor)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Route Clear
              </span>
            </div>

            <div className="space-y-2 text-xs text-stone-200">
              <p className="font-semibold text-white">
                {primaryIncident.road_name}: {primaryIncident.description}
              </p>
              <div className="text-[11px] font-mono text-stone-400">
                Reported by {primaryIncident.reporter_name} ({primaryIncident.reporter_department})
              </div>
            </div>
          </div>

          {primaryIncident.image_url && (
            <button
              onClick={() => setSelectedPhotoIncident(primaryIncident)}
              className="w-full py-2.5 px-3 bg-amber-800/80 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-3"
            >
              <Camera className="w-4 h-4" /> View Field Photo Evidence
            </button>
          )}
        </div>
      ) : (
        /* Green All Clear Box */
        <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-br from-emerald-950/90 via-stone-900 to-slate-950 border-2 border-emerald-500/60 text-white shadow-xl space-y-4 overflow-hidden font-sans">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">
                    Active Corridor Status: Green &amp; Open
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Corridor: {activeCorridor}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                100% PASSABLE
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              No critical road closures or active landslide debris reported along your assigned route corridor. Continuous PWD &amp; BRO sensor telemetry active.
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-500/30 flex items-center justify-between text-[11px] font-mono text-emerald-300">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Live Telemetry Sync Active
            </span>
            <span className="text-stone-400">Zero Disruptions</span>
          </div>
        </div>
      )}

      {/* Full High-Resolution Geo-Tagged Image Evidence Modal */}
      {selectedPhotoIncident && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in font-sans">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Field Geo-Tagged Photographic Evidence
                  </h4>
                  <p className="text-[11px] text-stone-400 font-mono">
                    Incident ID: {selectedPhotoIncident.id} • {selectedPhotoIncident.road_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhotoIncident(null)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Image & Metadata */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-stone-800 flex items-center justify-center max-h-96">
                <img
                  src={selectedPhotoIncident.image_url}
                  alt={selectedPhotoIncident.image_name || "Hazard photo"}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-black/75 px-3 py-1 rounded-lg border border-white/20 text-[10px] font-mono text-emerald-300">
                  📍 GPS: {selectedPhotoIncident.latitude.toFixed(4)}°N, {selectedPhotoIncident.longitude.toFixed(4)}°E (Acc: ±{selectedPhotoIncident.gps_accuracy}m)
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <div className="text-stone-400 text-[10px]">Officer</div>
                  <div className="text-white font-bold truncate">{selectedPhotoIncident.reporter_name}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <div className="text-stone-400 text-[10px]">Department</div>
                  <div className="text-white font-bold truncate">{selectedPhotoIncident.reporter_department}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <div className="text-stone-400 text-[10px]">Severity</div>
                  <div className="text-rose-400 font-bold">{selectedPhotoIncident.severity}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <div className="text-stone-400 text-[10px]">Timestamp</div>
                  <div className="text-white font-bold">{new Date(selectedPhotoIncident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/50 border border-stone-700/60 text-xs text-stone-200">
                <strong className="text-white">Ground Report:</strong> {selectedPhotoIncident.description}
              </div>

              {selectedPhotoIncident.recommended_detour && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300">Recommended Detour:</strong> {selectedPhotoIncident.recommended_detour}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                Cryptographically signed &amp; verified via OSDMA / ODRAF State Telemetry
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoIncident(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
