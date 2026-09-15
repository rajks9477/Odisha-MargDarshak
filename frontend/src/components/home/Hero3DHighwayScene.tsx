"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mountain, CloudRain, ShieldCheck, Activity, Compass, Navigation } from "lucide-react";

export const Hero3DHighwayScene: React.FC = () => {
  const [truckPos, setTruckPos] = useState<number>(0);
  const [truckPos2, setTruckPos2] = useState<number>(35);
  const [truckPos3, setTruckPos3] = useState<number>(70);

  useEffect(() => {
    const interval = setInterval(() => {
      setTruckPos((prev) => (prev + 0.4) % 100);
      setTruckPos2((prev) => (prev + 0.35) % 100);
      setTruckPos3((prev) => (prev + 0.3) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Calculate coordinates along isometric S-curves
  const getCurvePoint = (pct: number, curveId: number) => {
    const t = pct / 100;
    if (curveId === 1) {
      // 🟢 Safe Green Highway (Shillong ➔ Silchar Valley Bypass)
      const x = 50 + t * 500 + Math.sin(t * Math.PI * 2) * 60;
      const y = 260 - Math.sin(t * Math.PI) * 110 + t * 40;
      return { x, y };
    } else if (curveId === 2) {
      // ⚡ Direct Spine (Guwahati ➔ Kaziranga ➔ Dibrugarh) - Green to Orange/Red
      const x = 80 + t * 460;
      const y = 140 + Math.sin(t * Math.PI * 2.5) * 45;
      return { x, y };
    } else {
      // ⛰️ High Mountain Pass (Tezpur ➔ Sela Pass ➔ Tawang)
      const x = 120 + t * 400 + Math.cos(t * Math.PI * 2) * 50;
      const y = 80 + Math.sin(t * Math.PI * 1.8) * 60;
      return { x, y };
    }
  };

  const pt1 = getCurvePoint(truckPos, 1);
  const pt2 = getCurvePoint(truckPos2, 2);
  const pt3 = getCurvePoint(truckPos3, 3);

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[320px] sm:h-[380px] rounded-3xl overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border border-stone-800 shadow-2xl font-sans my-4 select-none">
      {/* 3D Isometric SVG Scene */}
      <svg
        className="w-full h-full"
        viewBox="0 0 640 340"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradients for 3D Mountain Ridges */}
          <linearGradient id="mountGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="mountGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B4332" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#081C15" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="greenRoadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="hazardRoadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="65%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Background Isometric Contour Grid */}
        <g stroke="#334155" strokeWidth="0.5" opacity="0.35">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`grid-x-${i}`} x1={i * 50} y1="0" x2={i * 50 + 80} y2="340" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`grid-y-${i}`} x1="0" y1={i * 45} x2="640" y2={i * 45 + 30} />
          ))}
        </g>

        {/* 2. 3D Mountain Silhouettes */}
        {/* Deep background peaks */}
        <polygon
          points="80,180 180,60 280,180"
          fill="url(#mountGrad1)"
          opacity="0.8"
        />
        <polygon
          points="240,190 360,40 480,190"
          fill="url(#mountGrad1)"
          opacity="0.75"
        />
        <polygon
          points="420,180 540,70 620,180"
          fill="url(#mountGrad1)"
          opacity="0.8"
        />

        {/* Midground Foothills */}
        <path
          d="M 20,280 Q 120,140 240,240 T 460,200 T 640,260 L 640,340 L 20,340 Z"
          fill="url(#mountGrad2)"
          opacity="0.85"
        />

        {/* 3. Multi-Colored Highway Corridors */}
        {/* Corridor 1: 🟢 Safe Green Valley Highway */}
        <path
          d="M 40,280 C 140,160 280,310 400,220 C 480,160 560,270 620,240"
          fill="none"
          stroke="#064E3B"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M 40,280 C 140,160 280,310 400,220 C 480,160 560,270 620,240"
          fill="none"
          stroke="url(#greenRoadGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          filter="url(#glowEffect)"
        />
        <path
          d="M 40,280 C 140,160 280,310 400,220 C 480,160 560,270 620,240"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeDasharray="5, 8"
          opacity="0.8"
        />

        {/* Corridor 2: ⚡ Multi-Hazard Spine (Green ➔ Yellow ➔ Red Hazard Zone) */}
        <path
          d="M 60,150 C 180,90 280,210 420,130 C 500,80 580,180 620,120"
          fill="none"
          stroke="#1E1E1E"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 60,150 C 180,90 280,210 420,130 C 500,80 580,180 620,120"
          fill="none"
          stroke="url(#hazardRoadGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#glowEffect)"
        />
        <path
          d="M 60,150 C 180,90 280,210 420,130 C 500,80 580,180 620,120"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeDasharray="4, 6"
          opacity="0.7"
        />

        {/* 4. Active Landslide Blockage Marker on Red Highway */}
        <g transform="translate(365, 148)">
          <circle cx="0" cy="0" r="14" fill="#EF4444" opacity="0.3" className="animate-ping" />
          <circle cx="0" cy="0" r="8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="0" y="3" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">⚠️</text>
          <rect x="-42" y="-22" width="84" height="14" rx="4" fill="#1E293B" stroke="#EF4444" strokeWidth="1" />
          <text x="0" y="-12" fill="#FCA5A5" fontSize="7" fontWeight="bold" textAnchor="middle">RED: Landslide Alert</text>
        </g>

        {/* 5. Waypoint Hub Pins (Guwahati, Shillong, Silchar, Tawang) */}
        {/* Guwahati Hub */}
        <g transform="translate(50, 275)">
          <circle cx="0" cy="0" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="0" y="14" fill="#E2E8F0" fontSize="8" fontWeight="bold" textAnchor="middle">Guwahati Hub</text>
        </g>

        {/* Shillong Junction */}
        <g transform="translate(240, 240)">
          <circle cx="0" cy="0" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="0" y="-8" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">Shillong Pass</text>
        </g>

        {/* Silchar Depot */}
        <g transform="translate(590, 235)">
          <circle cx="0" cy="0" r="5.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="0" y="15" fill="#E2E8F0" fontSize="8" fontWeight="bold" textAnchor="middle">Silchar Depot</text>
        </g>

        {/* Tawang Terminal */}
        <g transform="translate(580, 115)">
          <circle cx="0" cy="0" r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="0" y="-7" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">Tawang Frontier</text>
        </g>

        {/* 6. Moving 3D Trucks on the Highways with Light Beams */}
        {/* Truck 1 on Safe Green Highway */}
        <g transform={`translate(${pt1.x}, ${pt1.y})`}>
          {/* Headlamp light cone */}
          <polygon
            points="0,-2 28,-10 28,10 0,2"
            fill="rgba(255, 255, 200, 0.25)"
          />
          {/* Vehicle Body */}
          <circle cx="0" cy="0" r="9" fill="#1E293B" stroke="#10B981" strokeWidth="2" />
          <text x="0" y="3" fontSize="10" textAnchor="middle">🚚</text>
        </g>

        {/* Truck 2 on Upper Spine Highway */}
        <g transform={`translate(${pt2.x}, ${pt2.y})`}>
          <polygon
            points="0,-2 25,-8 25,8 0,2"
            fill="rgba(255, 255, 200, 0.25)"
          />
          <circle cx="0" cy="0" r="9" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
          <text x="0" y="3" fontSize="10" textAnchor="middle">⛽</text>
        </g>
      </svg>

      {/* Floating 3D Telemetry Badges */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700 text-white text-[11px] shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold">Live 3D GIS Telemetry:</span>
        <span className="text-emerald-400 font-mono">8/8 States Connected</span>
      </div>

      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700 text-white text-[11px] shadow-lg">
        <Activity className="w-3.5 h-3.5 text-amber-400" />
        <span>Predictive Model:</span>
        <span className="text-amber-300 font-mono font-bold">HistGradientBoosting Active</span>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 bg-stone-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-800 text-xs text-stone-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-emerald-500 rounded-full" />
            <span className="text-[11px]">Green: Safe Pass</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-amber-500 rounded-full" />
            <span className="text-[11px]">Yellow: Rain Caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-rose-500 rounded-full" />
            <span className="text-[11px]">Red: Landslide Block</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-emerald-400 font-bold hidden md:block">
          ⚡ Autonomous Vehicle Reroute Enabled
        </div>
      </div>
    </div>
  );
};
