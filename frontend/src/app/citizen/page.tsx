"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import map component with SSR disabled for Leaflet compatibility
const CitizenLiveMapPortal = dynamic(
  () => import("@/components/citizen/CitizenLiveMapPortal").then((mod) => mod.CitizenLiveMapPortal),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-stone-900 text-white font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
          Initializing Live Satellite &amp; Road Telemetry...
        </p>
      </div>
    ),
  }
);

export default function CitizenPublicPortalPage() {
  return (
    <main className="w-full h-full flex-1 flex flex-col bg-stone-900">
      <CitizenLiveMapPortal />
    </main>
  );
}
