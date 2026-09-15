"use client";

import React, { useState } from "react";
import { DriverProfile, DriverAvailability, DriverService } from "@/services/driverService";
import { 
  Truck, 
  CheckCircle2, 
  Power, 
  MapPin,
} from "lucide-react";

interface DriverHeaderProps {
  profile: DriverProfile;
  onProfileUpdated?: (updated: DriverProfile) => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({ profile, onProfileUpdated }) => {
  const [currentStatus, setCurrentStatus] = useState<DriverAvailability>(profile.availability);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleStatusChange = async (newStatus: DriverAvailability) => {
    if (newStatus === currentStatus || isUpdating) return;
    
    setIsUpdating(true);
    const prev = currentStatus;
    setCurrentStatus(newStatus); // Optimistic UI update

    try {
      await DriverService.updateAvailability(newStatus);
      if (onProfileUpdated) {
        onProfileUpdated({ ...profile, availability: newStatus });
      }
    } catch (err: any) {
      setCurrentStatus(prev); // Revert on failure
      alert(err.detail || "Failed to update availability status");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusConfigs: Record<DriverAvailability, { label: string; color: string; desc: string }> = {
    AVAILABLE: {
      label: "Available",
      color: "bg-emerald-700 text-white font-bold",
      desc: "Ready for Dispatch & Transit",
    },
    ON_TRIP: {
      label: "On Trip",
      color: "bg-amber-600 text-white font-bold",
      desc: "In Transit on Active Corridor",
    },
    OFFLINE: {
      label: "Offline",
      color: "bg-stone-300 text-stone-700 font-medium",
      desc: "Off-duty / Rest Period",
    },
  };

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Driver identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-amber-700 p-0.5 shadow-sm shrink-0">
            <div className="w-full h-full bg-[#FAF8F5] rounded-[14px] flex items-center justify-center font-black text-xl text-emerald-800">
              <Truck className="w-7 h-7 text-emerald-700" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-tight">
                {profile.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Verified Commercial Driver
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mt-1 font-medium">
              <span className="font-mono text-stone-700">
                DL: <strong className="text-stone-900 font-bold">{profile.license_number}</strong>
              </span>
              <span>•</span>
              <span>{profile.experience_years} Yrs Mountain Driving</span>
              {profile.current_location_name && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {profile.current_location_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tactile Availability Switcher */}
        <div className="flex flex-col sm:items-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E2D8]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Power className="w-3 h-3 text-emerald-600" /> Current Availability:
          </span>

          <div className="inline-flex p-1 bg-[#F4EFEB] rounded-2xl border border-[#E0D8CB] shadow-inner gap-1">
            {(["AVAILABLE", "ON_TRIP", "OFFLINE"] as DriverAvailability[]).map((st) => {
              const isSelected = currentStatus === st;
              const cfg = statusConfigs[st];

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? `${cfg.color} shadow-xs`
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      st === "AVAILABLE"
                        ? "bg-emerald-300 animate-pulse"
                        : st === "ON_TRIP"
                        ? "bg-amber-300 animate-pulse"
                        : "bg-stone-400"
                    }`}
                  />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
