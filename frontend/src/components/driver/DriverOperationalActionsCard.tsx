"use client";

import React from "react";
import Link from "next/link";
import { 
  Navigation, 
  Radio, 
  ArrowRight, 
  Compass, 
  Route, 
  ShieldCheck, 
  Sparkles,
  MapPin
} from "lucide-react";

export const DriverOperationalActionsCard: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-br from-white via-emerald-50/40 to-stone-50 border-2 border-emerald-300 hover:border-emerald-600 shadow-md transition-all font-sans text-stone-900 overflow-hidden group">
      <div className="space-y-3">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5 truncate">
                <Radio className="w-3.5 h-3.5 text-emerald-700 animate-pulse shrink-0" /> Driver Operational Actions
              </h2>
              <span className="text-[10px] text-stone-500 font-medium truncate block">Tactile Touch Targets &amp; Route Guidance</span>
            </div>
          </div>
          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs font-mono shrink-0">
            Live GPS Active
          </span>
        </div>

        {/* Feature Title & Summary */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm sm:text-base font-black text-stone-900 group-hover:text-emerald-900 transition-colors">
              Google Map Route Navigator &amp; Live GPS
            </h3>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
              Shortest • Safest • Color-Coded Risk
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 leading-snug">
            Select your Origin &amp; Destination anywhere across 30 Odisha Districts to view shortest road routes, landslide risk color-coding &amp; turn-by-turn voice navigation.
          </p>
        </div>

        {/* Popular Hill Corridors Quick Launchers */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-stone-400 uppercase tracking-wider">
            <span>Fast Corridor Navigators</span>
            <span className="text-emerald-800 font-mono">8 States Connected</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
            <Link
              href="/dashboard/driver/route-planning?from=Bhubaneswar&to=Balasore"
              className="p-2 rounded-xl bg-white/90 border border-emerald-200/80 hover:border-emerald-600 hover:bg-emerald-50/50 text-stone-800 hover:text-emerald-950 transition-all flex items-center justify-between shadow-2xs min-w-0 group/link"
            >
              <span className="truncate">🛣️ Bhubaneswar ➔ Balasore</span>
              <ArrowRight className="w-3 h-3 text-emerald-700 group-hover/link:translate-x-0.5 transition-transform shrink-0 ml-1" />
            </Link>
            <Link
              href="/dashboard/driver/route-planning?from=Siliguri&to=Gangtok"
              className="p-2 rounded-xl bg-white/90 border border-emerald-200/80 hover:border-emerald-600 hover:bg-emerald-50/50 text-stone-800 hover:text-emerald-950 transition-all flex items-center justify-between shadow-2xs min-w-0 group/link"
            >
              <span className="truncate">🏔️ Siliguri ➔ Gangtok</span>
              <ArrowRight className="w-3 h-3 text-emerald-700 group-hover/link:translate-x-0.5 transition-transform shrink-0 ml-1" />
            </Link>
            <Link
              href="/dashboard/driver/route-planning?from=Bhubaneswar&to=Sambalpur"
              className="p-2 rounded-xl bg-white/90 border border-emerald-200/80 hover:border-emerald-600 hover:bg-emerald-50/50 text-stone-800 hover:text-emerald-950 transition-all flex items-center justify-between shadow-2xs min-w-0 group/link"
            >
              <span className="truncate">🌲 Bhubaneswar ➔ Sambalpur</span>
              <ArrowRight className="w-3 h-3 text-emerald-700 group-hover/link:translate-x-0.5 transition-transform shrink-0 ml-1" />
            </Link>
            <Link
              href="/dashboard/driver/route-planning?from=Cuttack&to=Berhampur"
              className="p-2 rounded-xl bg-white/90 border border-emerald-200/80 hover:border-emerald-600 hover:bg-emerald-50/50 text-stone-800 hover:text-emerald-950 transition-all flex items-center justify-between shadow-2xs min-w-0 group/link"
            >
              <span className="truncate">❄️ Tezpur ➔ Tawang</span>
              <ArrowRight className="w-3 h-3 text-emerald-700 group-hover/link:translate-x-0.5 transition-transform shrink-0 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Prominent Action Button Bar */}
      <div className="pt-2.5 border-t border-emerald-200/70 mt-2">
        <Link
          href="/dashboard/driver/route-planning"
          className="w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer group/btn"
        >
          <Navigation className="w-4 h-4 shrink-0" />
          <span className="truncate">Open Google Map Route Navigator</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform shrink-0" />
        </Link>
      </div>
    </div>
  );
};
