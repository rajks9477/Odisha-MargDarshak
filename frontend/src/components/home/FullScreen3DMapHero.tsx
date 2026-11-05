"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS, UserRole, ROLE_CONFIGS } from "@/lib/constants";
import {
  Compass,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Globe2,
  Building2,
  HardHat,
  Truck,
  Users,
  AlertTriangle,
  Radio,
  Zap,
  Sparkles,
  CloudRain,
  Mountain
} from "lucide-react";

interface MovingVehicle {
  id: string;
  name: string;
  type: "FUEL" | "CARGO" | "AMBULANCE" | "RECOVERY";
  icon: string;
  routeCoords: [number, number][];
  currentIdx: number;
  speed: number;
  color: string;
  roadName: string;
}

export const FullScreen3DMapHero: React.FC = () => {
  const { login } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const vehicleMarkersRef = useRef<{ [id: string]: any }>({});

  const [mapStyle, setMapStyle] = useState<"LIGHT" | "TERRAIN" | "SATELLITE">("LIGHT");
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<string>("CENTRAL_ADMIN");

  // Highway corridors with risk coloring
  const HIGHWAYS = [
    {
      id: "NH-6",
      name: "NH-16 Baitarani River Bridge Sector",
      color: "#EF4444", // RED - Landslide
      risk: "CRITICAL RISK (84/100)",
      coords: [
        [20.463, 85.882], // Cuttack
        [25.446, 92.203], // Jowai
        [20.898, 86.295], // Sonapur Tunnel (Landslide Hazard)
        [24.950, 92.650], // Lumshnong
        [24.833, 92.779], // Balasore
      ] as [number, number][],
    },
    {
      id: "NH-27",
      name: "NH-27 East-West Expressway",
      color: "#10B981", // GREEN - Safe
      risk: "CLEAR TRANSIT (18/100)",
      coords: [
        [20.296, 85.824], // Bhubaneswar
        [26.250, 92.340], // Morigaon
        [26.000, 92.850], // Doboka
        [25.750, 93.180], // Lumding
      ] as [number, number][],
    },
    {
      id: "NH-37",
      name: "NH-16 Coastal Highway Spine",
      color: "#EA580C", // ORANGE - Flood
      risk: "HIGH FLOOD HAZARD (68/100)",
      coords: [
        [20.296, 85.824], // Bhubaneswar
        [26.345, 92.684], // Nagaon
        [26.580, 93.170], // Kaziranga
        [20.462, 85.882], // Cuttack
        [21.493, 86.933], // Balasore
      ] as [number, number][],
    },
    {
      id: "NH-13",
      name: "NH-55 Cuttack-Angul-Sambalpur Expressway",
      color: "#EA580C", // ORANGE - Ice/Rockfall
      risk: "HIGH ROCKFALL RISK (72/100)",
      coords: [
        [26.652, 92.793], // Tezpur
        [27.264, 92.416], // Bomdila
        [27.502, 92.103], // Sela Pass
        [27.586, 91.866], // Tawang
      ] as [number, number][],
    },
    {
      id: "NH-306",
      name: "NH-306 Southern Arterial",
      color: "#F59E0B", // YELLOW - Rain caution
      risk: "CAUTION (48/100)",
      coords: [
        [24.833, 92.779], // Balasore
        [24.505, 92.756], // Vairengte
        [24.225, 92.678], // Kolasib
        [18.813, 82.713], // Koraput
      ] as [number, number][],
    },
    {
      id: "HAFLONG-BYPASS",
      name: "Haflong-Umrangso All-Weather Green Bypass",
      color: "#10B981", // GREEN - Safe Detour
      risk: "SAFE DETOUR (16/100)",
      coords: [
        [25.510, 92.740], // Umrangso
        [25.176, 93.018], // Haflong
        [24.833, 92.779], // Balasore
      ] as [number, number][],
    }
  ];

  // Moving Vehicles Dataset
  const [vehicles, setVehicles] = useState<MovingVehicle[]>([
    {
      id: "V1",
      name: "Fuel Tanker AS-01-GB-4819",
      type: "FUEL",
      icon: "⛽",
      routeCoords: [
        [20.463, 85.882],
        [25.446, 92.203],
        [20.898, 86.295],
        [24.950, 92.650],
        [24.833, 92.779],
      ],
      currentIdx: 0,
      speed: 0.04,
      color: "#EF4444",
      roadName: "NH-16 Baitarani River Bridge (Flood Alert)",
    },
    {
      id: "V2",
      name: "Freight Truck AS-11-BC-3042",
      type: "CARGO",
      icon: "🚚",
      routeCoords: [
        [20.296, 85.824],
        [26.345, 92.684],
        [26.580, 93.170],
        [26.750, 94.216],
        [27.472, 94.912],
      ],
      currentIdx: 0,
      speed: 0.05,
      color: "#EA580C",
      roadName: "NH-37 Kaziranga Highway",
    },
    {
      id: "V3",
      name: "Essential Van MZ-01-A-4422",
      type: "AMBULANCE",
      icon: "🚑",
      routeCoords: [
        [24.833, 92.779],
        [24.505, 92.756],
        [24.225, 92.678],
        [23.730, 92.717],
      ],
      currentIdx: 0,
      speed: 0.06,
      color: "#10B981",
      roadName: "NH-20 Kanjipani Ghat Lifeline",
    },
    {
      id: "V4",
      name: "PWD Recovery Crane AS-01-X-8800",
      type: "RECOVERY",
      icon: "🚜",
      routeCoords: [
        [25.510, 92.740],
        [25.176, 93.018],
        [24.833, 92.779],
      ],
      currentIdx: 0,
      speed: 0.03,
      color: "#10B981",
      roadName: "Haflong Safe Bypass",
    }
  ]);

  // Handle 1-Click Login
  const handle1ClickLogin = async (demoUser: typeof DEMO_USERS[0]) => {
    setLoggingInRole(demoUser.role);
    try {
      await login(demoUser.email, demoUser.password);
    } catch (err: any) {
      alert(err.detail || "Authentication failed");
    } finally {
      setLoggingInRole(null);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: [20.50, 84.80], // Centered on Odisha
      zoom: 8,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    const tileUrls = {
      LIGHT: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      TERRAIN: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    const tileLayer = L.tileLayer(tileUrls.LIGHT, {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    (map as any)._tileLayer = tileLayer;

    // Draw Highway Polylines
    HIGHWAYS.forEach((hw) => {
      // Glow polyline
      L.polyline(hw.coords, {
        color: hw.color,
        weight: 6,
        opacity: 0.9,
        lineJoin: "round",
      }).addTo(map);

      // Dash center line
      L.polyline(hw.coords, {
        color: "#FFFFFF",
        weight: 1.5,
        opacity: 0.7,
        dashArray: "6, 10",
        lineJoin: "round",
      }).addTo(map);
    });

    // Add Hazard Marker on NH-6
    const hazardIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: rgba(239,68,68,0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background-color: #EF4444; color: white; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold;">⚠️</div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([20.898, 86.295], { icon: hazardIcon })
      .addTo(map)
      .bindTooltip("<b>🔴 NH-6 Baitarani River Bridge: Active Flood Overtopping</b>", { sticky: true });

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
      LIGHT: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      TERRAIN: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    map.removeLayer((map as any)._tileLayer);
    const newLayer = L.tileLayer(tileUrls[mapStyle], { maxZoom: 19 }).addTo(map);
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

          // Update Leaflet Marker
          let marker = vehicleMarkersRef.current[veh.id];
          if (!marker) {
            const vehIcon = L.divIcon({
              className: "custom-div-icon",
              html: `<div style="background-color: #0F172A; color: white; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid ${veh.color}; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px;">${veh.icon}</div>`,
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "CENTRAL_ADMIN":
        return <Globe2 className="w-4 h-4 text-rose-700" />;
      case "DISTRICT_ADMIN":
        return <Building2 className="w-4 h-4 text-blue-700" />;
      case "FIELD_OFFICER":
        return <HardHat className="w-4 h-4 text-amber-700" />;
      case "DRIVER":
        return <Truck className="w-4 h-4 text-emerald-800" />;
      default:
        return <Users className="w-4 h-4 text-teal-700" />;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none bg-stone-900">
      {/* Full-Screen Interactive GIS Map */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/50 pointer-events-none z-10" />

      {/* Top Floating Glass Header Bar */}
      <header className="absolute top-4 inset-x-4 max-w-7xl mx-auto z-20 flex items-center justify-between pointer-events-none">
        {/* Brand Pill */}
        <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200 shadow-md flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-stone-900 tracking-tight">
                Odisha MargDarshak
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                Gov Logistics AI
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium">
              Odishaal Logistics &amp; Accessibility Grid
            </p>
          </div>
        </div>

        {/* Top Right Controls & Layer Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-stone-200 shadow-md flex items-center gap-1 text-[11px] font-semibold text-stone-700">
            <button
              type="button"
              onClick={() => setMapStyle("LIGHT")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "LIGHT" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100"
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("TERRAIN")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "TERRAIN" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100"
              }`}
            >
              Terrain
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("SATELLITE")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "SATELLITE" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100"
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </header>

      {/* Center / Left Floating Executive Gateway Card */}
      <div className="absolute top-24 left-4 right-4 max-w-xl z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>30 Districts of Odisha Connected in Real-Time</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
              AI-Powered Logistics &amp; <br />
              <span className="text-emerald-800">Accessibility Intelligence</span>
            </h1>

            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Live highway risk color-coding, moving fleet intercept, and turn-by-turn emergency navigation across rugged mountain corridors.
            </p>
          </div>

          {/* Quick Role Selection Tabs */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>Select Authorized Role:</span>
              <span className="text-[10px] text-emerald-800 font-mono font-bold">1-Click Fast Login</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_USERS.map((demo) => {
                const isLoggingIn = loggingInRole === demo.role;
                const isSelected = selectedRoleForDetail === demo.role;

                return (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handle1ClickLogin(demo)}
                    disabled={isLoggingIn}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 shadow-2xs hover:scale-[1.02] ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-700 text-emerald-950 font-bold"
                        : "bg-stone-50 hover:bg-white border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-2xs">
                        {getRoleIcon(demo.role)}
                      </div>
                      <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5" />
                    </div>

                    <div>
                      <div className="text-xs font-bold truncate">{demo.role.replace("_", " ")}</div>
                      <div className="text-[10px] text-stone-500 truncate font-normal">{demo.name.split(" ")[0]}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Highway Status Ticker & Legend */}
      <footer className="absolute bottom-4 inset-x-4 max-w-7xl mx-auto z-20 flex flex-col sm:flex-row items-center justify-between gap-2 pointer-events-none">
        {/* Color Legend Pill */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200 shadow-lg flex items-center gap-3 text-xs text-stone-800 pointer-events-auto">
          <span className="font-bold text-[11px] text-stone-900">Road Risk Colors:</span>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-emerald-500" /> Green: Safe</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-amber-500" /> Yellow: Rain</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-orange-500" /> Orange: Mud</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full bg-rose-500" /> Red: Landslide</span>
          </div>
        </div>

        {/* Live Active Vehicle Count */}
        <div className="bg-stone-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-800 shadow-lg text-white text-xs flex items-center gap-3 font-mono pointer-events-auto">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Moving Fleet:</span>
            <span className="text-emerald-400 font-bold">{vehicles.length} Vehicles Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
