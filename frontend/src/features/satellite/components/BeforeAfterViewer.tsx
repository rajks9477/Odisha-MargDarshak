"use client";

import React, { useState } from "react";
import { Layers, Eye, Sliders, Calendar } from "lucide-react";

interface Props {
  preDate: string;
  postDate: string;
  roadName: string;
}

export const BeforeAfterViewer: React.FC<Props> = ({ preDate, postDate, roadName }) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Before / After Remote-Sensing Imagery Comparison</span>
        </h3>
        <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Sentinel-2B MSI (10m Resolution)
        </span>
      </div>

      {/* Before / After Slider Container */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 select-none group">
        {/* Pre-event Imagery Layer (Left side baseline) */}
        <div
          className="absolute inset-0 bg-cover bg-center flex items-start p-3"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(2, 6, 23, 0.95) 100%), linear-gradient(to right, #020617, #0f172a)`,
          }}
        >
          <div className="px-2.5 py-1 rounded bg-slate-950/90 text-[10px] font-mono text-emerald-400 border border-emerald-500/40 flex items-center gap-1 font-bold">
            <Calendar className="w-3 h-3" />
            <span>BASELINE: {new Date(preDate).toLocaleDateString()} (NDVI 0.74 Green)</span>
          </div>
        </div>

        {/* Post-event Imagery Layer (Right side anomaly layer clipped by slider) */}
        <div
          className="absolute inset-0 bg-cover bg-center flex items-start justify-end p-3"
          style={{
            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
            backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(2, 6, 23, 0.95) 100%), linear-gradient(to right, #1e1b4b, #450a0a)`,
          }}
        >
          <div className="px-2.5 py-1 rounded bg-slate-950/90 text-[10px] font-mono text-red-400 border border-red-500/40 flex items-center gap-1 font-bold">
            <Calendar className="w-3 h-3" />
            <span>POST-DISASTER: {new Date(postDate).toLocaleDateString()} (Mudflow Scarp)</span>
          </div>
        </div>

        {/* Vertical Divider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-lg cursor-ew-resize flex items-center justify-center"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shadow-lg border border-white">
            ↔
          </div>
        </div>

        {/* Hidden Range Input over image */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>← Drag slider to compare pre & post landslide surface vegetation</span>
        <span className="text-cyan-400 font-bold">Location: {roadName}</span>
      </div>
    </div>
  );
};
