"use client";

import React from "react";
import { FullScreenLiveMapHero } from "@/components/home/FullScreenLiveMapHero";

export default function HomePage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-stone-900">
      <FullScreenLiveMapHero />
    </main>
  );
}
