"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Edit2, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { LocationSource } from "../types/incidentTypes";

interface Props {
  latitude: number;
  longitude: number;
  accuracy: number;
  locationSource: LocationSource;
  roadName?: string;
  districtName?: string;
  onLocationChange: (lat: number, lon: number, source: LocationSource) => void;
  onRefreshGps: () => void;
}

export const LocationPreview: React.FC<Props> = ({
  latitude,
  longitude,
  accuracy,
  locationSource,
  roadName,
  districtName,
  onLocationChange,
  onRefreshGps,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [manualLat, setManualLat] = useState(latitude.toString());
  const [manualLon, setManualLon] = useState(longitude.toString());

  const handleApplyManual = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      onLocationChange(lat, lon, "MANUAL");
      setIsEditing(false);
    }
  };

  const handleResetToGps = () => {
    setIsEditing(false);
    onRefreshGps();
  };

  const isAccuracyPoor = accuracy > 25;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          6. Incident Location <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            locationSource === "GPS"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            {locationSource === "GPS" ? "GPS Auto-Captured" : "Manual Adjustment"}
          </span>
        </div>
      </div>

      {isAccuracyPoor && locationSource === "GPS" && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>GPS accuracy is low (±{accuracy}m). You can adjust the pin manually.</span>
        </div>
      )}

      {/* Main Location Box */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              {roadName || "NH-16 Bhubaneswar-Cuttack-Balasore Highway"}
            </div>
            <div className="text-[11px] text-slate-400">
              {districtName || "Bhadrak / Balasore Coastal Sector"}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
              title="Adjust location"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetToGps}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs flex items-center gap-1"
              title="Refresh GPS"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Coordinates line */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div>
            Lat: <span className="text-slate-200">{latitude.toFixed(5)}° N</span>
          </div>
          <div>
            Lon: <span className="text-slate-200">{longitude.toFixed(5)}° E</span>
          </div>
          <div className="text-[11px] text-emerald-400">
            ±{accuracy}m
          </div>
        </div>

        {/* Manual coordinate editor */}
        {isEditing && (
          <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-700 space-y-2">
            <div className="text-[11px] text-amber-300 font-medium">
              Fine-tune Coordinates (if GPS is blocked by mountain canyon):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyManual}
                className="px-3 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded"
              >
                Save Manual Location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
