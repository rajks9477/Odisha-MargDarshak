"use client";

import React from "react";
import Link from "next/link";
import { WeatherDisasterDashboard } from "@/features/weather/components/WeatherDisasterDashboard";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { OfflineNotice } from "@/components/driver/OfflineNotice";
import { ArrowLeft, CloudRain, ShieldAlert } from "lucide-react";

export default function DriverWeatherDisastersPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/driver"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">Weather & Disaster Intelligence</h1>
              <span className="text-[10px] text-cyan-400 font-medium px-2 py-0.2 bg-cyan-500/10 rounded-full border border-cyan-500/30">
                IMD & CWC Feeds
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Real-time precipitation, wind, visibility & SDMA bulletins</p>
          </div>
        </div>
      </header>

      <OfflineNotice />

      <main className="max-w-6xl w-full mx-auto p-4 flex-1">
        <WeatherDisasterDashboard />
      </main>

      <DriverBottomNav />
    </div>
  );
}
