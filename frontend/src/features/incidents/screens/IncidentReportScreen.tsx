"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Send, Loader2, Save, WifiOff } from "lucide-react";
import {
  IncidentType,
  IncidentSeverity,
  LocationSource,
  VoiceRecordingResult,
  IncidentReportPayload,
} from "../types/incidentTypes";
import { IncidentTypeSelector } from "../components/IncidentTypeSelector";
import { SeveritySelector } from "../components/SeveritySelector";
import { IncidentDescription } from "../components/IncidentDescription";
import { PhotoCapture } from "../components/PhotoCapture";
import { VoiceRecorder } from "../components/VoiceRecorder";
import { LocationPreview } from "../components/LocationPreview";
import { IncidentSuccessCard } from "../components/IncidentSuccessCard";
import { IncidentService } from "../services/incidentService";
import { IncidentLocalStore } from "../storage/incidentLocalStore";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { OfflineNotice } from "@/components/driver/OfflineNotice";
import { tripsApi } from "@/features/trips/api/tripsApi";

export const IncidentReportScreen: React.FC = () => {
  const router = useRouter();

  // Core Form State
  const [selectedType, setSelectedType] = useState<IncidentType>(IncidentType.LANDSLIDE);
  const [severity, setSeverity] = useState<IncidentSeverity>(IncidentSeverity.HIGH);
  const [description, setDescription] = useState<string>("");

  // Location State
  const [latitude, setLatitude] = useState<number>(25.185);
  const [longitude, setLongitude] = useState<number>(92.285);
  const [accuracy, setAccuracy] = useState<number>(5.0);
  const [locationSource, setLocationSource] = useState<LocationSource>("GPS");
  const [roadName, setRoadName] = useState<string>("NH-6 Guwahati-Shillong Highway");
  const [districtName, setDistrictName] = useState<string>("East Jaintia Hills, Meghalaya");

  // Media & Voice State
  const [photos, setPhotos] = useState<{ file: File; dataUrl: string; originalSize: number; compressedSize: number }[]>([]);
  const [voiceResult, setVoiceResult] = useState<VoiceRecordingResult | null>(null);

  // Context & Operational State
  const [activeTripId, setActiveTripId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);
  const [isOfflineQueued, setIsOfflineQueued] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // 1. Check Network & Acquire Device GPS + Active Trip
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Fetch active trip to auto-attach
    tripsApi.getCurrentTrip().then((trip) => {
      if (trip && trip.id) {
        setActiveTripId(trip.id);
        if (trip.corridor_name) setRoadName(trip.corridor_name);
      }
    }).catch(() => {});

    // Acquire GPS
    refreshGps();

    // Auto-load draft if available
    const draft = IncidentLocalStore.getDraft();
    if (draft) {
      if (draft.type) setSelectedType(draft.type);
      if (draft.severity) setSeverity(draft.severity);
      if (draft.description) setDescription(draft.description);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshGps = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
          setAccuracy(Math.round(pos.coords.accuracy));
          setLocationSource("GPS");
        },
        (err) => {
          console.warn("GPS fallback used", err);
          setLocationSource("GPS");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleLocationChange = (lat: number, lon: number, source: LocationSource) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationSource(source);
  };

  // 2. Form Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim() && !voiceResult) {
      setErrorMessage("Please describe the incident or record a short voice report.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: IncidentReportPayload = {
        client_idempotency_key: `client_rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: selectedType,
        severity,
        description: description.trim() || voiceResult?.transcript || "Road hazard reported from field.",
        voice_transcript: voiceResult?.transcript,
        latitude,
        longitude,
        gps_accuracy: accuracy,
        location_source: locationSource,
        trip_id: activeTripId,
      };

      const result = await IncidentService.submitIncident(
        payload,
        photos,
        voiceResult ? { blob: voiceResult.audioBlob, transcript: voiceResult.transcript } : undefined
      );

      if (result.queuedLocally) {
        setIsOfflineQueued(true);
        setSubmittedIncidentId(result.localId || "OFFLINE-QUEUED");
      } else if (result.record) {
        setIsOfflineQueued(false);
        setSubmittedIncidentId(result.record.id);
      }
    } catch (err: any) {
      console.error("Submission failed", err);
      setErrorMessage(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportAnother = () => {
    setSubmittedIncidentId(null);
    setDescription("");
    setPhotos([]);
    setVoiceResult(null);
    setSelectedType(IncidentType.LANDSLIDE);
    setSeverity(IncidentSeverity.HIGH);
    refreshGps();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/driver"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-100">Report Road Incident</h1>
            <p className="text-[11px] text-slate-400">Direct evidence for regional disaster desks</p>
          </div>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-800/60">
            <WifiOff className="w-3 h-3" />
            <span>Offline Mode</span>
          </div>
        )}
      </header>

      <OfflineNotice />

      <main className="flex-1 max-w-xl w-full mx-auto p-4">
        {submittedIncidentId ? (
          <IncidentSuccessCard
            incidentId={submittedIncidentId}
            incidentType={selectedType}
            severity={severity}
            roadName={roadName}
            timestamp={new Date().toISOString()}
            isOfflineQueued={isOfflineQueued}
            onReportAnother={handleReportAnother}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Incident Type */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <IncidentTypeSelector
                selectedType={selectedType}
                onSelect={(type) => {
                  setSelectedType(type);
                  IncidentLocalStore.saveDraft({ type, severity, description });
                }}
              />
            </div>

            {/* 2. Severity */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <SeveritySelector
                selectedSeverity={severity}
                onSelect={(sev) => {
                  setSeverity(sev);
                  IncidentLocalStore.saveDraft({ type: selectedType, severity: sev, description });
                }}
              />
            </div>

            {/* 3. Description */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <IncidentDescription
                description={description}
                onChange={(desc) => {
                  setDescription(desc);
                  IncidentLocalStore.saveDraft({ type: selectedType, severity, description: desc });
                }}
              />
            </div>

            {/* 4. Photo Evidence */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <PhotoCapture
                photos={photos}
                onPhotosChange={(newPhotos) => setPhotos(newPhotos)}
              />
            </div>

            {/* 5. Voice Report */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <VoiceRecorder
                voiceResult={voiceResult}
                onRecordingComplete={(res) => setVoiceResult(res)}
              />
            </div>

            {/* 6. Location Preview */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <LocationPreview
                latitude={latitude}
                longitude={longitude}
                accuracy={accuracy}
                locationSource={locationSource}
                roadName={roadName}
                districtName={districtName}
                onLocationChange={handleLocationChange}
                onRefreshGps={refreshGps}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Transmitting Incident Report...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>

      <DriverBottomNav />
    </div>
  );
};
