"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  IncidentBroadcastService, 
  GeoTaggedIncident 
} from "@/services/incidentBroadcastService";
import { 
  Camera, 
  MapPin, 
  UploadCloud, 
  ShieldAlert, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Compass, 
  HardHat, 
  Layers,
  Clock,
  Radio,
  RefreshCw,
  Video,
  VideoOff,
  Crosshair,
  Maximize2,
  FolderOpen,
  Check
} from "lucide-react";

interface FieldOfficerIncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated?: (incident: GeoTaggedIncident) => void;
  officerName?: string;
  department?: string;
}

const ROAD_PRESETS = [
  {
    corridor_name: "NH-6 Guwahati-Shillong-Silchar Mountain Corridor",
    road_id: "NH-6-SONAPUR-01",
    road_name: "NH-6 Sonapur Tunnel Mountain Pass KM-142",
    default_lat: 25.105,
    default_lng: 92.361,
    default_detour: "Haflong-Umrangso All-Weather Green Bypass (Safe for all HCVs & Medical Reefers)",
    default_action: "2x Heavy JCB Excavators & Dozers deployed on north face. Clearance ETA: 4.5 hrs.",
    preset_title: "Sonapur Mountain Slope Landslide & Mudflow (NH-6)",
    preset_desc: "Major slope failure & 200m mudflow debris completely blocking both lanes near Sonapur Tunnel mouth KM-142.",
    preset_photo: "/images/incidents/sonapur_landslide.jpg",
    preset_type: "LANDSLIDE",
    preset_severity: "CRITICAL" as const,
  },
  {
    corridor_name: "NH-10 Sikkim Mountain Corridor (Siliguri - Gangtok)",
    road_id: "NH-10-SEVOKE-01",
    road_name: "NH-10 Teesta Valley Lifeline (Likuvir 29th Mile)",
    default_lat: 27.170,
    default_lng: 88.530,
    default_detour: "Lava-Algarah-Gorubathan Mountain Detour",
    default_action: "Traffic police regulating alternating convoy movement. Heavy freight diverted via Lava.",
    preset_title: "Teesta River Embankment Scour & Road Crack (NH-10)",
    preset_desc: "Teesta river violent water scouring road foundation at 29th Mile Likuvir. Single-lane alternating movement.",
    preset_photo: "/images/incidents/teesta_scour.jpg",
    preset_type: "ROAD_DAMAGE",
    preset_severity: "HIGH" as const,
  },
  {
    corridor_name: "NH-13 Trans-Arunachal Highway (Bhalukpong - Tawang)",
    road_id: "NH-13-SELA-01",
    road_name: "NH-13 Sela Pass High Altitude Tunnel Approach",
    default_lat: 27.502,
    default_lng: 92.105,
    default_detour: "Mandala Top Alternative High-Altitude Pass",
    default_action: "BRO Project Vartak Snow Blowers & Dozers operating at 13,700 ft.",
    preset_title: "Sela Pass Heavy Snow Blizzard & Rockfall Blockade (NH-13)",
    preset_desc: "Sub-zero blizzard and 4-foot snowdrifts with boulder slides blocking eastern tunnel access.",
    preset_photo: "/images/incidents/sela_snow.jpg",
    preset_type: "SNOW_FALL",
    preset_severity: "CRITICAL" as const,
  },
  {
    corridor_name: "NH-53 Jiribam - Imphal Lifeline",
    road_id: "NH-53-NONEY-01",
    road_name: "NH-53 Noney Hill Bridge Approach",
    default_lat: 24.780,
    default_lng: 93.600,
    default_detour: "Old Cachar Mountain Highway Convoy Route",
    default_action: "SDRF rapid response unit & bridge stabilization team deployed.",
    preset_title: "Noney River Mudflow & Bridge Approach Cutoff (NH-53)",
    preset_desc: "Continuous downpour triggered massive mud slurry over Noney bridge western abutment.",
    preset_photo: "/images/incidents/noney_mudflow.jpg",
    preset_type: "MUDSLIDE",
    preset_severity: "CRITICAL" as const,
  },
];

export const FieldOfficerIncidentReportModal: React.FC<FieldOfficerIncidentReportModalProps> = ({
  isOpen,
  onClose,
  onIncidentCreated,
  officerName = "Er. Tashi Norbu",
  department = "PWD Border Roads & Disaster Response",
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const currentPreset = ROAD_PRESETS[selectedPresetIndex];

  // Form State
  const [corridorName, setCorridorName] = useState<string>(currentPreset.corridor_name);
  const [roadId, setRoadId] = useState<string>(currentPreset.road_id);
  const [roadName, setRoadName] = useState<string>(currentPreset.road_name);
  const [hazardType, setHazardType] = useState<string>(currentPreset.preset_type);
  const [severity, setSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">(currentPreset.preset_severity);
  const [description, setDescription] = useState<string>(currentPreset.preset_desc);
  const [latitude, setLatitude] = useState<number>(currentPreset.default_lat);
  const [longitude, setLongitude] = useState<number>(currentPreset.default_lng);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3.2);
  const [actionTaken, setActionTaken] = useState<string>(currentPreset.default_action);
  const [recommendedDetour, setRecommendedDetour] = useState<string>(currentPreset.default_detour);
  const [imageUrl, setImageUrl] = useState<string>(currentPreset.preset_photo);
  const [imageName, setImageName] = useState<string>("sonapur_mudslide_km142.jpg");

  // Camera & Upload Modes
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [geoTagStampSuccess, setGeoTagStampSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputFallbackRef = useRef<HTMLInputElement | null>(null);

  // Helper: Stop camera stream (declared before any effects)
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  }, []);

  // Helper: Live GPS Grab
  const acquireLiveGps = useCallback((onSuccess?: (lat: number, lng: number) => void) => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          const acc = Math.round(pos.coords.accuracy * 10) / 10 || 2.8;
          setLatitude(lat);
          setLongitude(lng);
          setGpsAccuracy(acc);
          if (onSuccess) onSuccess(lat, lng);
        },
        () => {
          // Keep current/preset coords
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    }
  }, []);

  // Effects
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
  }, [isOpen, stopCameraStream]);

  // 1. Start Device Live Camera Stream
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    // Auto-acquire high accuracy GPS immediately when opening camera
    acquireLiveGps();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebRTC camera stream not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn("Video play interrupted", e));
        }
      }, 100);
    } catch (err: any) {
      console.warn("Camera stream failed", err);
      setCameraError(err.message || "Camera permission denied or camera unavailable.");
      setIsCameraActive(false);
      // Fallback: trigger native camera file input
      if (cameraInputFallbackRef.current) {
        cameraInputFallbackRef.current.click();
      }
    } finally {
      setCameraLoading(false);
    }
  };

  // 2. Snap Live Photo from Video Stream & Stamp Official Geo-Tag Watermark
  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Draw camera frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stamped Geo-Tag Tactical Watermark at Bottom
    const barHeight = 80;
    ctx.fillStyle = "rgba(10, 15, 29, 0.85)";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    // Accent line
    ctx.fillStyle = "#F59E0B"; // Amber gold
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, 3);

    // Watermark text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`📍 GPS: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (Acc: ±${gpsAccuracy}m)`, 20, canvas.height - 48);

    ctx.fillStyle = "#10B981"; // Emerald
    ctx.font = "bold 13px monospace";
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    ctx.fillText(`SECTOR: ${roadName || corridorName} • TIME: ${nowStr}`, 20, canvas.height - 24);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "12px sans-serif";
    ctx.fillText(`OFFICER: ${officerName.toUpperCase()} [${department}]`, canvas.width - 340, canvas.height - 24);

    // Convert canvas to image URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageUrl(dataUrl);
    const stampedFilename = `geotag_${roadId.toLowerCase()}_${Date.now().toString().slice(-6)}.jpg`;
    setImageName(stampedFilename);

    stopCameraStream();
    setGeoTagStampSuccess(`Live Photo Captured & Geo-Tagged at ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
    setTimeout(() => setGeoTagStampSuccess(null), 4500);
  };

  // 3. Handle File Upload from Gallery / Storage
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageName(file.name);

      // Acquire current live GPS immediately to tag onto this uploaded photo
      acquireLiveGps((lat, lng) => {
        setGeoTagStampSuccess(`Photo uploaded & Geo-Tagged with live location: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        setTimeout(() => setGeoTagStampSuccess(null), 4000);
      });

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setImageUrl(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = ROAD_PRESETS[index];
    setCorridorName(p.corridor_name);
    setRoadId(p.road_id);
    setRoadName(p.road_name);
    setHazardType(p.preset_type);
    setSeverity(p.preset_severity);
    setDescription(p.preset_desc);
    setLatitude(p.default_lat);
    setLongitude(p.default_lng);
    setActionTaken(p.default_action);
    setRecommendedDetour(p.default_detour);
    setImageUrl(p.preset_photo);
    setImageName(p.road_id.toLowerCase() + "_evidence.jpg");
    stopCameraStream();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newIncident: GeoTaggedIncident = {
      id: `INC-NER-${Date.now().toString().slice(-6)}`,
      road_id: roadId,
      road_name: roadName,
      corridor_name: corridorName,
      type: hazardType,
      severity: severity,
      description: description,
      latitude: latitude,
      longitude: longitude,
      gps_accuracy: gpsAccuracy,
      reporter_name: officerName,
      reporter_role: "FIELD_OFFICER",
      reporter_department: department,
      image_url: imageUrl,
      image_name: imageName,
      action_taken: actionTaken,
      recommended_detour: recommendedDetour,
      created_at: new Date().toISOString(),
      status: "VERIFIED",
    };

    // Broadcast across all connected portals (Driver, Gov Command Center, Citizen Live Map)
    IncidentBroadcastService.addIncident(newIncident);

    if (onIncidentCreated) {
      onIncidentCreated(newIncident);
    }

    setIsSubmitting(false);
    setShowSuccessBadge(true);

    setTimeout(() => {
      setShowSuccessBadge(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-[#E8E2D8] rounded-3xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Field Official Telemetry
                </span>
                <span className="text-stone-500 text-xs font-mono">
                  SIH Multi-Portal Broadcast
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 mt-0.5">
                Submit Geo-Tagged Hazard Report & Ground Photo Evidence
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Splash Banner */}
        {showSuccessBadge && (
          <div className="p-4 bg-emerald-600 text-white text-center font-bold text-sm flex items-center justify-center gap-2 animate-in slide-in-from-top">
            <CheckCircle2 className="w-5 h-5" />
            <span>Hazard Broadcasted in Real-Time! Transmitted to Driver Corridor HUD & Gov Command Centers.</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Dual Photo Capture / Upload Selection Controls */}
          <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-3xl border border-[#E8E2D8]">
            <div className="flex items-center justify-between">
              <label className="text-stone-900 font-black flex items-center gap-2 text-sm">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Field Image Capture & Geo-Tag Source:</span>
              </label>

              <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto GPS Locking Active</span>
              </span>
            </div>

            {/* 2 Big Action Buttons: Direct Camera vs Upload from File */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Live Camera Button */}
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraLoading}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black">Option 1: Open Live Camera</div>
                  <div className="text-[10px] text-amber-100 font-normal">Direct Capture & Instant Geo-Tag</div>
                </div>
              </button>

              {/* Option 2: Upload File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl bg-white hover:bg-stone-50 border-2 border-[#E4D5C5] text-stone-800 font-bold flex items-center justify-center gap-3 shadow-xs hover:border-amber-600 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-stone-900">Option 2: Browse File / Gallery</div>
                  <div className="text-[10px] text-stone-500 font-normal">Select image from device storage</div>
                </div>
              </button>

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputFallbackRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Geo-Tag Status Notification Toast */}
            {geoTagStampSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{geoTagStampSuccess}</span>
              </div>
            )}

            {/* Active Live Camera Viewfinder Overlay */}
            {isCameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-500 shadow-2xl space-y-2 p-2">
                <div className="relative h-64 sm:h-80 w-full bg-black flex items-center justify-center rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Tactical Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-amber-400 bg-black/60 px-2.5 py-1 rounded-lg self-start">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        <span>LIVE CAMERA VIEW • GPS LOCKED</span>
                      </div>
                    </div>

                    <div className="self-center text-white/40">
                      <Crosshair className="w-16 h-16 stroke-[1]" />
                    </div>

                    <div className="bg-black/80 backdrop-blur-xs p-2 rounded-xl text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                      <div>📍 {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E (Acc: ±{gpsAccuracy}m)</div>
                      <div className="text-stone-300 text-[9px]">{roadName} • {officerName}</div>
                    </div>
                  </div>
                </div>

                {/* Shutter Capture Button */}
                <div className="flex items-center justify-between gap-3 pt-1 px-2">
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>Cancel Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={capturePhotoFromStream}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap & Apply Geo-Tag</span>
                  </button>
                </div>
              </div>
            )}

            {/* Image Preview & Active File Details */}
            {!isCameraActive && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
                <div className="relative h-36 rounded-2xl overflow-hidden border border-[#E8E2D8] bg-stone-100 flex items-center justify-center group shadow-xs">
                  {imageUrl ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt="Hazard Ground Evidence" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white font-mono text-[9px] text-center">
                        <span>GPS: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</span>
                        <span>±{gpsAccuracy}m accuracy</span>
                      </div>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-emerald-300">
                        📸 Geo-Tagged
                      </div>
                    </>
                  ) : (
                    <div className="text-stone-400 space-y-1 text-center">
                      <Camera className="w-6 h-6 mx-auto opacity-50" />
                      <span>No image selected</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-2">
                    <span className="truncate">Active File: <strong>{imageName}</strong></span>
                    {imageUrl && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                        Ready to Broadcast
                      </span>
                    )}
                  </div>
                  <p className="text-stone-500 text-[11px] leading-relaxed">
                    The image is embedded with verified GPS telemetry, timestamp, and your officer signature. This evidence will be immediately rendered on driver in-cabin navigation screens and central command dashboards.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Real World Ground Hazard Presets */}
          <div className="space-y-2">
            <label className="text-stone-800 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#7F5539]">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>⚡ 1-Click Real-World Mountain Corridor Hazard Presets:</span>
              </span>
              <span className="text-stone-400 font-normal text-[11px]">(Instant demo presets)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROAD_PRESETS.map((p, idx) => (
                <button
                  type="button"
                  key={p.road_id}
                  onClick={() => handleApplyPreset(idx)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                    selectedPresetIndex === idx
                      ? "bg-amber-50/80 border-amber-600 text-amber-950 shadow-xs ring-2 ring-amber-500/20"
                      : "bg-[#FAF8F5] border-[#E8E2D8] hover:bg-stone-100 text-stone-800"
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5">
                    {p.preset_type === "LANDSLIDE" ? "⛰️" : p.preset_type === "SNOW_FALL" ? "❄️" : p.preset_type === "MUDSLIDE" ? "🌊" : "🚧"}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold truncate text-[11px]">{p.preset_title}</div>
                    <div className="text-[10px] text-stone-500 truncate">{p.road_name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Highway Corridor & Road Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-stone-700 font-bold">Highway Corridor:</label>
              <input
                type="text"
                value={corridorName}
                onChange={(e) => setCorridorName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 focus:border-amber-600 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-stone-700 font-bold">Specific Road Segment / Kilometre Post:</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 focus:border-amber-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Hazard Type & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-stone-700 font-bold">Hazard Type:</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 focus:border-amber-600 focus:outline-none"
              >
                <option value="LANDSLIDE">Mountain Slope Landslide</option>
                <option value="MUDSLIDE">Debris Flow / Mudslide</option>
                <option value="ROAD_DAMAGE">Road Embankment Scour / Cave-in</option>
                <option value="FLOOD">Flash Flood Submersion</option>
                <option value="SNOW_FALL">Heavy Snow Blizzard Blockade</option>
                <option value="BRIDGE_DAMAGE">Bridge Approach Damage</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-stone-700 font-bold">Corridor Severity Level:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 font-bold focus:border-amber-600 focus:outline-none"
              >
                <option value="CRITICAL">🔴 CRITICAL (Complete Blockage / Red Alert)</option>
                <option value="HIGH">🟠 HIGH (Single-Lane Passing / Major Hazard)</option>
                <option value="MEDIUM">🟡 MEDIUM (Slow Convoy / Caution)</option>
                <option value="LOW">🟢 LOW (Advisory)</option>
              </select>
            </div>
          </div>

          {/* GPS Coordinates & Accuracy */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-700 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified GPS Telemetry Coordinates</span>
              </span>

              <button
                type="button"
                onClick={() => acquireLiveGps()}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 text-[#7F5539] border border-[#E4D5C5] rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Compass className="w-3 h-3 text-amber-700" />
                <span>Acquire Device GPS</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-stone-400 font-mono">Latitude:</span>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg bg-white border border-[#E8E2D8] text-stone-900 font-mono text-[11px]"
                />
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-mono">Longitude:</span>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg bg-white border border-[#E8E2D8] text-stone-900 font-mono text-[11px]"
                />
              </div>

              <div>
                <span className="text-[10px] text-stone-400 font-mono">Accuracy:</span>
                <input
                  type="number"
                  step="any"
                  value={gpsAccuracy}
                  onChange={(e) => setGpsAccuracy(parseFloat(e.target.value) || 3.0)}
                  className="w-full p-2 rounded-lg bg-white border border-[#E8E2D8] text-stone-900 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Ground Description & Detailed Observations */}
          <div className="space-y-1">
            <label className="text-stone-700 font-bold">Officer Field Observations & Ground Summary:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          {/* Action Taken & Recommended Detour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-stone-700 font-bold flex items-center gap-1 text-amber-800">
                <HardHat className="w-3.5 h-3.5" />
                <span>Field Team Deployment Action:</span>
              </label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="e.g. 2x Heavy JCB Excavators deployed"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-stone-700 font-bold flex items-center gap-1 text-emerald-800">
                <Navigation className="w-3.5 h-3.5" />
                <span>Recommended Detour for Drivers:</span>
              </label>
              <input
                type="text"
                value={recommendedDetour}
                onChange={(e) => setRecommendedDetour(e.target.value)}
                placeholder="e.g. Haflong-Umrangso All-Weather Green Bypass"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Officer Credentials Footer Info */}
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-between text-[11px] text-stone-500">
            <span>Signing Officer: <strong className="text-stone-800">{officerName}</strong></span>
            <span>Department: <strong className="text-stone-800">{department}</strong></span>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-black bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl shadow-lg flex items-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className="w-4 h-4 text-amber-200 animate-pulse" />
              )}
              <span>Publish & Broadcast to All Portals</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
