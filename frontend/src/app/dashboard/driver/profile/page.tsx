"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { OfflineNotice } from "@/components/driver/OfflineNotice";
import { DriverService, DriverProfile } from "@/services/driverService";
import { useAuth } from "@/context/AuthContext";
import { 
  User as UserIcon, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Phone, 
  HeartPulse, 
  Award, 
  Truck, 
  MapPin, 
  LogOut,
  Calendar
} from "lucide-react";

export default function DriverProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    DriverService.getProfile()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      <OfflineNotice />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/driver"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <UserIcon className="w-4 h-4" /> Driver Credentials
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Official Driver Profile & Licensing
            </h1>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading driver credentials...</div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 p-0.5 shadow-lg shadow-blue-950 flex items-center justify-center font-black text-2xl text-blue-300">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile.name}</h2>
                <p className="text-xs text-emerald-400 font-medium">Verified Commercial Hill Transporter</p>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  {profile.email} • {profile.phone}
                </div>
              </div>
            </div>

            {/* Commercial Licensing Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-400" /> Commercial Driving License Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">License Number</div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono">{profile.license_number}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Experience (Mountain Routes)</div>
                  <div className="text-xs sm:text-sm font-bold text-white">{profile.experience_years} Years (Odisha Verified)</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">License Validity</div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-400">
                    {profile.license_expiry ? new Date(profile.license_expiry).toLocaleDateString() : "Valid (2028)"}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency & Medical Telemetry */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-400" /> Emergency & Medical Telemetry
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Emergency Helpline / Dispatcher
                  </div>
                  <div className="text-xs font-bold text-white font-mono">
                    {profile.emergency_contact || "+91 674 2534177 (Odisha Transport Control / 112)"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Blood Group
                  </div>
                  <div className="text-xs font-bold text-white">{profile.blood_group || "B+ Positive"}</div>
                </div>
              </div>
            </div>

            {/* Assigned Vehicle */}
            {profile.assigned_vehicle && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {profile.assigned_vehicle.vehicle_number}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {profile.assigned_vehicle.model} • {profile.assigned_vehicle.capacity_tonnes} Tonnes
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  {profile.assigned_vehicle.status}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <DriverBottomNav />
    </div>
  );
}
