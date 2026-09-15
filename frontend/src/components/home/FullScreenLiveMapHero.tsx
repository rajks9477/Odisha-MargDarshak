"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  Sparkles,
  Globe2,
  Layers,
  Radio,
  Activity,
  ShieldCheck,
  Zap,
  Mountain,
  Truck
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/common/LanguageSelector";

interface MovingVehicle {
  id: string;
  name: string;
  type: "FUEL" | "CARGO" | "AMBULANCE" | "RECOVERY" | "CONVOY" | "PATROL" | "BUS" | "SUPPLY";
  icon: string;
  routeCoords: [number, number][];
  currentIdx: number;
  speed: number;
  color: string;
  roadName: string;
}

export const FullScreenLiveMapHero: React.FC = () => {
  const { t, language } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const vehicleMarkersRef = useRef<{ [id: string]: any }>({});
  const [mapStyle, setMapStyle] = useState<"LIGHT" | "TERRAIN" | "SATELLITE">("LIGHT");

  // Comprehensive NER Highway Grid covering Every Visible Road across all 8 States
  const HIGHWAYS = [
    // 1. NH-6 Sonapur Tunnel Mountain Pass (RED - Active Landslide ⚠️)
    {
      id: "NH-6",
      name: "NH-6 Sonapur Tunnel Pass (Shillong ➔ Silchar)",
      color: "#DC2626",
      coords: [
        [25.578, 91.893], // Shillong
        [25.446, 92.203], // Jowai
        [25.105, 92.361], // Sonapur Tunnel (Landslide Hazard)
        [24.950, 92.650], // Lumshnong
        [24.833, 92.779], // Silchar
      ] as [number, number][],
    },
    // 2. NH-27 4-Lane East-West Commercial Expressway (GREEN - Safe All-Weather)
    {
      id: "NH-27",
      name: "NH-27 4-Lane East-West Corridor (Guwahati ➔ Lumding ➔ Silchar)",
      color: "#059669",
      coords: [
        [26.144, 91.736], // Guwahati
        [26.250, 92.340], // Morigaon
        [26.000, 92.850], // Doboka
        [25.750, 93.180], // Lumding
        [25.176, 93.018], // Haflong
        [24.833, 92.779], // Silchar
      ] as [number, number][],
    },
    // 3. NH-37 Brahmaputra Valley & Kaziranga (ORANGE - River Flood Inundation)
    {
      id: "NH-37",
      name: "NH-37 Kaziranga Brahmaputra Highway",
      color: "#D97706",
      coords: [
        [26.144, 91.736], // Guwahati
        [26.345, 92.684], // Nagaon
        [26.580, 93.170], // Kaziranga
        [26.750, 94.216], // Jorhat
        [27.472, 94.912], // Dibrugarh
        [27.500, 95.360], // Tinsukia
      ] as [number, number][],
    },
    // 4. NH-13 Trans-Arunachal Frontier (ORANGE - Sela Pass Rockfall / Ice)
    {
      id: "NH-13",
      name: "NH-13 Trans-Arunachal Highway (Tezpur ➔ Tawang)",
      color: "#D97706",
      coords: [
        [26.652, 92.793], // Tezpur
        [27.264, 92.416], // Bomdila
        [27.502, 92.103], // Sela Pass
        [27.586, 91.866], // Tawang
      ] as [number, number][],
    },
    // 5. NH-15 Brahmaputra North Bank Highway (GREEN - Safe High Road)
    {
      id: "NH-15",
      name: "NH-15 North Bank Highway (Baihata ➔ Tezpur ➔ Pasighat)",
      color: "#059669",
      coords: [
        [26.340, 91.710], // Baihata Chariali
        [26.430, 92.030], // Mangaldai
        [26.652, 92.793], // Tezpur
        [27.240, 94.100], // North Lakhimpur
        [27.480, 94.570], // Dhemaji
        [28.060, 95.330], // Pasighat
      ] as [number, number][],
    },
    // 6. NH-306 & NH-54 Mizoram Lifeline (YELLOW - Continuous Monsoon Rain)
    {
      id: "NH-306",
      name: "NH-306 Southern Arterial (Silchar ➔ Aizawl ➔ Lunglei)",
      color: "#EAB308",
      coords: [
        [24.833, 92.779], // Silchar
        [24.505, 92.756], // Vairengte
        [24.225, 92.678], // Kolasib
        [23.730, 92.717], // Aizawl
        [22.880, 92.740], // Lunglei
      ] as [number, number][],
    },
    // 7. NH-2 / NH-29 Nagaland & Manipur Hills Spine (ORANGE - Pagala Pahar Sinking Hill)
    {
      id: "NH-2",
      name: "NH-2 / NH-29 Trans-Hills Spine (Dimapur ➔ Kohima ➔ Imphal)",
      color: "#D97706",
      coords: [
        [25.906, 93.727], // Dimapur
        [25.675, 94.108], // Kohima
        [25.260, 94.020], // Senapati
        [24.817, 93.936], // Imphal
        [24.430, 93.680], // Churachandpur
      ] as [number, number][],
    },
    // 8. NH-8 Tripura Lifeline (GREEN - Safe Paved Arterial)
    {
      id: "NH-8",
      name: "NH-8 Tripura Lifeline (Silchar ➔ Agartala ➔ Sabroom)",
      color: "#059669",
      coords: [
        [24.833, 92.779], // Silchar
        [24.370, 92.160], // Dharmanagar
        [23.920, 91.850], // Ambassa
        [23.831, 91.286], // Agartala
        [23.000, 91.700], // Sabroom
      ] as [number, number][],
    },
    // 9. NH-17 Lower Assam Plain (GREEN - Safe Valley Road)
    {
      id: "NH-17",
      name: "NH-17 Lower Assam Link (Guwahati ➔ Goalpara ➔ Dhubri)",
      color: "#059669",
      coords: [
        [26.144, 91.736], // Guwahati
        [25.980, 90.990], // Dudhnoi
        [26.180, 90.620], // Goalpara
        [26.020, 89.980], // Dhubri
      ] as [number, number][],
    },
    // 10. NH-10 Teesta Valley Mountain Pass (RED - Teesta River Embankment Collapse)
    {
      id: "NH-10",
      name: "NH-10 Teesta Valley Mountain Pass (Siliguri ➔ Gangtok)",
      color: "#DC2626",
      coords: [
        [26.720, 88.420], // Siliguri
        [26.880, 88.470], // Sevoke
        [27.170, 88.530], // Rangpo
        [27.338, 88.606], // Gangtok
      ] as [number, number][],
    },
    // 11. NH-31 / NH-27 West Bengal & Siliguri Corridor (GREEN - Safe Entry)
    {
      id: "NH-31",
      name: "NH-31 North Bengal Entryway (Siliguri ➔ Alipurduar ➔ Bongaigaon)",
      color: "#059669",
      coords: [
        [26.720, 88.420], // Siliguri
        [26.540, 88.720], // Jalpaiguri
        [26.490, 89.520], // Alipurduar
        [26.470, 90.560], // Bongaigaon
        [26.144, 91.736], // Guwahati
      ] as [number, number][],
    },
    // 12. NH-53 Barak-Manipur Road (RED - Landslide Cutoff on Noney Hill)
    {
      id: "NH-53",
      name: "NH-53 Jiribam-Imphal Highway (Silchar ➔ Jiribam ➔ Imphal)",
      color: "#DC2626",
      coords: [
        [24.833, 92.779], // Silchar
        [24.800, 93.120], // Jiribam
        [24.780, 93.600], // Noney Hill (Active Mudflow)
        [24.817, 93.936], // Imphal
      ] as [number, number][],
    },
    // 13. NH-102 Asian Highway Border Link (GREEN - Safe Export Line)
    {
      id: "NH-102",
      name: "NH-102 Asian Highway (Imphal ➔ Thoubal ➔ Moreh Border)",
      color: "#059669",
      coords: [
        [24.817, 93.936], // Imphal
        [24.630, 93.990], // Thoubal
        [24.240, 94.310], // Moreh Border
      ] as [number, number][],
    },
    // 14. Haflong-Umrangso All-Weather Green Bypass (GREEN - Safe Detour)
    {
      id: "HAFLONG-BYPASS",
      name: "Haflong-Umrangso All-Weather Green Bypass",
      color: "#059669",
      coords: [
        [25.510, 92.740], // Umrangso
        [25.176, 93.018], // Haflong
        [24.833, 92.779], // Silchar
      ] as [number, number][],
    }
  ];

  // 8 Active Moving Vehicles continuously animating along the highway coordinates
  const [vehicles, setVehicles] = useState<MovingVehicle[]>([
    {
      id: "V1",
      name: "Fuel Tanker AS-01-GB-4819",
      type: "FUEL",
      icon: "⛽",
      routeCoords: [
        [25.578, 91.893],
        [25.446, 92.203],
        [25.105, 92.361],
        [24.950, 92.650],
        [24.833, 92.779],
      ],
      currentIdx: 0,
      speed: 0.035,
      color: "#DC2626",
      roadName: "NH-6 Sonapur Pass (In Danger)",
    },
    {
      id: "V2",
      name: "Freight Carrier AS-11-BC-3042",
      type: "CARGO",
      icon: "🚚",
      routeCoords: [
        [26.144, 91.736],
        [26.345, 92.684],
        [26.580, 93.170],
        [26.750, 94.216],
        [27.472, 94.912],
        [27.500, 95.360],
      ],
      currentIdx: 0,
      speed: 0.045,
      color: "#D97706",
      roadName: "NH-37 Kaziranga Highway",
    },
    {
      id: "V3",
      name: "Life Support Ambulance MZ-01-A-4422",
      type: "AMBULANCE",
      icon: "🚑",
      routeCoords: [
        [24.833, 92.779],
        [24.505, 92.756],
        [24.225, 92.678],
        [23.730, 92.717],
        [22.880, 92.740],
      ],
      currentIdx: 0,
      speed: 0.05,
      color: "#EAB308",
      roadName: "NH-306 Aizawl Lifeline",
    },
    {
      id: "V4",
      name: "Border Supply Convoy AR-01-M-9081",
      type: "CONVOY",
      icon: "🚛",
      routeCoords: [
        [26.652, 92.793],
        [27.264, 92.416],
        [27.502, 92.103],
        [27.586, 91.866],
      ],
      currentIdx: 0,
      speed: 0.038,
      color: "#D97706",
      roadName: "NH-13 Sela Pass Pass",
    },
    {
      id: "V5",
      name: "PWD Heavy Crane AS-01-X-8800",
      type: "RECOVERY",
      icon: "🚜",
      routeCoords: [
        [25.510, 92.740],
        [25.176, 93.018],
        [24.833, 92.779],
      ],
      currentIdx: 0,
      speed: 0.028,
      color: "#059669",
      roadName: "Haflong Green Bypass",
    },
    {
      id: "V6",
      name: "Patrol Intercept AS-01-P-2026",
      type: "PATROL",
      icon: "🚙",
      routeCoords: [
        [26.144, 91.736],
        [26.250, 92.340],
        [26.000, 92.850],
        [25.750, 93.180],
      ],
      currentIdx: 0,
      speed: 0.055,
      color: "#059669",
      roadName: "NH-27 4-Lane Corridor",
    },
    {
      id: "V7",
      name: "Inter-State Express Bus WB-73-E-1011",
      type: "BUS",
      icon: "🚌",
      routeCoords: [
        [26.720, 88.420],
        [26.540, 88.720],
        [26.490, 89.520],
        [26.470, 90.560],
        [26.144, 91.736],
      ],
      currentIdx: 0,
      speed: 0.048,
      color: "#059669",
      roadName: "NH-31 North Bengal Corridor",
    },
    {
      id: "V8",
      name: "Moreh Border Supply TR-01-S-5566",
      type: "SUPPLY",
      icon: "🚚",
      routeCoords: [
        [24.817, 93.936],
        [24.630, 93.990],
        [24.240, 94.310],
      ],
      currentIdx: 0,
      speed: 0.042,
      color: "#059669",
      roadName: "NH-102 Moreh Border Link",
    }
  ]);

  // Initialize Full-Screen Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: [25.80, 92.70],
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    const tileUrls = {
      LIGHT: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      TERRAIN: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    const tileLayer = L.tileLayer(tileUrls.LIGHT, { maxZoom: 19, opacity: 0.9 }).addTo(map);
    mapInstanceRef.current = map;
    (map as any)._tileLayer = tileLayer;

    // Draw Highway Polylines across all sides
    HIGHWAYS.forEach((hw) => {
      // Glow polyline
      L.polyline(hw.coords, {
        color: hw.color,
        weight: 7,
        opacity: 0.95,
        lineJoin: "round",
      }).addTo(map);

      // Inner white dashed line
      L.polyline(hw.coords, {
        color: "#FFFFFF",
        weight: 2,
        opacity: 0.85,
        dashArray: "6, 10",
        lineJoin: "round",
      }).addTo(map);
    });

    // Add Landslide Blockage Hazard Markers on NH-6, NH-10, NH-53
    const hazardIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: rgba(220,38,38,0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background-color: #DC2626; color: white; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold;">⚠️</div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([25.105, 92.361], { icon: hazardIcon })
      .addTo(map)
      .bindTooltip("<b>🔴 NH-6 Sonapur Tunnel: Active Landslide Blockage</b>", { sticky: true });

    L.marker([27.170, 88.530], { icon: hazardIcon })
      .addTo(map)
      .bindTooltip("<b>🔴 NH-10 Rangpo: Teesta River Overtopping</b>", { sticky: true });

    L.marker([24.780, 93.600], { icon: hazardIcon })
      .addTo(map)
      .bindTooltip("<b>🔴 NH-53 Noney Hill: Active Sinking Mudflow</b>", { sticky: true });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on Style change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(map as any)._tileLayer) return;
    const L = require("leaflet");

    const tileUrls = {
      LIGHT: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      TERRAIN: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    map.removeLayer((map as any)._tileLayer);
    const newLayer = L.tileLayer(tileUrls[mapStyle], { maxZoom: 19, opacity: 0.9 }).addTo(map);
    (map as any)._tileLayer = newLayer;
  }, [mapStyle]);

  // Animate Moving Vehicles along the Highways
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = require("leaflet");

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((veh) => {
          const coords = veh.routeCoords;
          const nextIdx = (veh.currentIdx + veh.speed) % (coords.length - 1);
          const i = Math.floor(nextIdx);
          const frac = nextIdx - i;

          const p1 = coords[i];
          const p2 = coords[i + 1] || coords[0];

          const currentLat = p1[0] + (p2[0] - p1[0]) * frac;
          const currentLng = p1[1] + (p2[1] - p1[1]) * frac;

          let marker = vehicleMarkersRef.current[veh.id];
          if (!marker) {
            const vehIcon = L.divIcon({
              className: "custom-div-icon",
              html: `<div style="background-color: #0F172A; color: white; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid ${veh.color}; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 14px;">${veh.icon}</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });
            marker = L.marker([currentLat, currentLng], { icon: vehIcon }).addTo(map);
            marker.bindTooltip(`<b>${veh.name}</b><br/>${veh.roadName}`, { sticky: true });
            vehicleMarkersRef.current[veh.id] = marker;
          } else {
            marker.setLatLng([currentLat, currentLng]);
          }

          return {
            ...veh,
            currentIdx: nextIdx,
          };
        })
      );
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Premium Branded Executive Letter Outline & Depth
  const letterBorderHeadline: React.CSSProperties = {
    WebkitTextStroke: "1.4px #FFFFFF",
    paintOrder: "stroke fill",
    textShadow: "0 0 16px rgba(255,255,255,1), 0 3px 8px rgba(15,23,42,0.3)",
  };

  const letterBorderSub: React.CSSProperties = {
    WebkitTextStroke: "0.8px #FFFFFF",
    paintOrder: "stroke fill",
    textShadow: "0 0 10px rgba(255,255,255,1), 0 2px 5px rgba(15,23,42,0.2)",
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none bg-stone-100 flex flex-col justify-between p-4 sm:p-6">
      {/* 1. Full-Screen Interactive GIS Map in Background (100% Screen) */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Top Floating Header Bar */}
      <header className="relative z-20 max-w-7xl w-full mx-auto flex items-center justify-between pointer-events-none">
        {/* Left Side: Brand Pill */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-stone-900 tracking-tight">
              {t.brandName}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
              {t.govBadge}
            </span>
          </div>
        </div>

        {/* Right Side: Map Layer Switcher & Multi-Language Circle Selector */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Map Tile Layer Switcher */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200/90 shadow-xl flex items-center gap-1 text-[11px] font-semibold text-stone-700">
            <button
              type="button"
              onClick={() => setMapStyle("LIGHT")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "LIGHT" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100 text-stone-700"
              }`}
            >
              {t.mapStreet}
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("TERRAIN")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "TERRAIN" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100 text-stone-700"
              }`}
            >
              {t.mapTerrain}
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("SATELLITE")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "SATELLITE" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100 text-stone-700"
              }`}
            >
              {t.mapSatellite}
            </button>
          </div>

          {/* Right-Side Multilingual Circle Icon */}
          <LanguageSelector variant="CIRCLE_ICON" />
        </div>
      </header>

      {/* 3. Center Floating Hero (Clean, Non-Overlapping Regional Multilingual Presentation) */}
      <div className="relative z-20 max-w-4xl w-full mx-auto text-center my-auto pointer-events-auto space-y-4 px-4">
        {/* Top Kicker - Dynamic Regional Language */}
        <div 
          style={letterBorderSub}
          className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-emerald-950"
        >
          <Sparkles className="w-4 h-4 text-emerald-800" />
          <span>{t.kicker}</span>
        </div>

        {/* Main Title - Pure Branded Luxury in Chosen Language */}
        <h1 
          style={letterBorderHeadline}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.12]"
        >
          <span className="text-stone-950 font-black">{t.title1}</span> <br />
          <span className="text-emerald-800 font-black">
            {t.title2}
          </span>{" "}
          <span className="text-stone-950 font-black">{t.title3}</span>
        </h1>

        {/* Subtitle - Translated in Chosen Regional Language */}
        <p 
          style={letterBorderSub}
          className="text-sm sm:text-base md:text-lg text-stone-900 font-extrabold leading-relaxed max-w-2xl mx-auto"
        >
          {t.subtitle}
        </p>

        {/* Single Prominent Glowing Login or Signup Button */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-base bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xl hover:scale-105 transition-all border-2 border-emerald-600 cursor-pointer"
          >
            <span>{t.ctaButton}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/citizen"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm bg-white/90 hover:bg-white text-stone-800 shadow-xl hover:scale-105 transition-all border border-stone-200 cursor-pointer"
          >
            <Globe2 className="w-4 h-4 text-emerald-800" />
            <span>Citizen Safety Map</span>
          </Link>
        </div>
      </div>

      {/* 4. Bottom Floating Regional Coverage & Live Legend Bar */}
      <footer className="relative z-20 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Road Risk Colors Legend */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-xl flex items-center gap-3 text-xs text-stone-800 pointer-events-auto">
          <span className="font-bold text-[11px] text-stone-900">{t.legendTitle}</span>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-emerald-600" /> {t.legendSafe}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-amber-500" /> {t.legendRain}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-orange-600" /> {t.legendMud}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-red-600" /> {t.legendLandslide}</span>
          </div>
        </div>

        {/* 8 State Node Sync Coverage Pill */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-xl text-stone-800 text-xs flex items-center gap-3 font-mono pointer-events-auto">
          <div className="flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-emerald-800" />
            <span className="text-stone-900 font-bold">{t.syncTitle}</span>
          </div>
          <div className="w-px h-3.5 bg-stone-300" />
          <div className="flex items-center gap-1.5 text-stone-600 font-semibold">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>{vehicles.length} {t.movingTrucks}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
