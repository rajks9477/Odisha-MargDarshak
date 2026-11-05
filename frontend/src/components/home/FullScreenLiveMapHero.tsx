"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  Sparkles,
  Globe2,
  Radio,
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
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const vehicleMarkersRef = useRef<{ [id: string]: any }>({});
  const [mapStyle, setMapStyle] = useState<"LIGHT" | "TERRAIN" | "SATELLITE">("LIGHT");

  // Comprehensive Odisha Highway Grid covering all 30 Districts
  const HIGHWAYS = [
    // 1. NH-16 Coastal Trunk Spine (RED - Baitarani River Flood Overtopping Hazard ⚠️)
    {
      id: "NH-16",
      name: "NH-16 Coastal Arterial Spine (Balasore ➔ Bhadrak ➔ Cuttack ➔ Bhubaneswar ➔ Berhampur)",
      color: "#DC2626",
      coords: [
        [21.494, 86.932], // Balasore
        [21.054, 86.495], // Bhadrak
        [20.898, 86.295], // Baitarani River Bridge (Critical Flood Hazard)
        [20.851, 86.138], // Jajpur
        [20.463, 85.882], // Cuttack
        [20.296, 85.824], // Bhubaneswar
        [20.180, 85.700], // Khordha
        [19.800, 85.100], // Chatrapur
        [19.315, 84.794], // Berhampur
      ] as [number, number][],
    },
    // 2. NH-55 Central Industrial Expressway (GREEN - All-Weather Safe)
    {
      id: "NH-55",
      name: "NH-55 Central Industrial Expressway (Cuttack ➔ Dhenkanal ➔ Angul ➔ Sambalpur)",
      color: "#059669",
      coords: [
        [20.463, 85.882], // Cuttack
        [20.662, 85.596], // Dhenkanal
        [20.844, 85.101], // Angul
        [21.160, 84.580], // Rairakhol
        [21.467, 83.978], // Sambalpur
      ] as [number, number][],
    },
    // 3. NH-53 Western Mining Expressway (GREEN - Safe High Capacity)
    {
      id: "NH-53",
      name: "NH-53 Western Mining Expressway (Paradip ➔ Cuttack ➔ Sambalpur ➔ Bargarh)",
      color: "#059669",
      coords: [
        [20.264, 86.671], // Paradip Port
        [20.463, 85.882], // Cuttack
        [20.844, 85.101], // Angul
        [21.467, 83.978], // Sambalpur
        [21.334, 83.623], // Bargarh
      ] as [number, number][],
    },
    // 4. NH-20 Northern Mining Corridor (ORANGE - Kanjipani Ghat Rockfall Caution)
    {
      id: "NH-20",
      name: "NH-20 Northern Mineral Corridor (Cuttack ➔ Panikoili ➔ Keonjhar ➔ Barbil)",
      color: "#D97706",
      coords: [
        [20.463, 85.882], // Cuttack
        [20.900, 86.150], // Panikoili
        [21.217, 85.983], // Anandapur
        [21.517, 85.503], // Kanjipani Ghat (Rockfall Hazard)
        [21.629, 85.582], // Keonjhar
        [22.120, 85.390], // Barbil
      ] as [number, number][],
    },
    // 5. NH-26 Western-Southern Trunk (YELLOW - Continuous Monsoon Rain)
    {
      id: "NH-26",
      name: "NH-26 Western-Southern Spine (Bargarh ➔ Balangir ➔ Bhawanipatna ➔ Jeypore ➔ Koraput)",
      color: "#EAB308",
      coords: [
        [21.334, 83.623], // Bargarh
        [20.711, 83.487], // Balangir
        [19.907, 83.167], // Bhawanipatna
        [18.858, 82.569], // Jeypore
        [18.814, 82.711], // Koraput
      ] as [number, number][],
    },
    // 6. NH-326 Southern Tribal Lifeline (GREEN - Open Route)
    {
      id: "NH-326",
      name: "NH-326 Southern Tribal Lifeline (Rayagada ➔ Koraput ➔ Malkangiri)",
      color: "#059669",
      coords: [
        [19.167, 83.417], // Rayagada
        [18.814, 82.711], // Koraput
        [18.344, 81.895], // Malkangiri
      ] as [number, number][],
    },
    // 7. Biju Expressway Western Economic Spine (GREEN - Safe High Speed)
    {
      id: "BIJU-EXPRESSWAY",
      name: "Biju Expressway (Rourkela ➔ Jharsuguda ➔ Sambalpur ➔ Balangir ➔ Koraput)",
      color: "#059669",
      coords: [
        [22.260, 84.854], // Rourkela
        [21.855, 84.006], // Jharsuguda
        [21.467, 83.978], // Sambalpur
        [20.711, 83.487], // Balangir
        [19.907, 83.167], // Bhawanipatna
        [18.814, 82.711], // Koraput
      ] as [number, number][],
    },
    // 8. NH-57 Central Agro Highway (GREEN - Open Route)
    {
      id: "NH-57",
      name: "NH-57 Central Agro Highway (Khordha ➔ Nayagarh ➔ Boudh ➔ Balangir)",
      color: "#059669",
      coords: [
        [20.180, 85.700], // Khordha
        [20.128, 85.106], // Nayagarh
        [20.840, 84.327], // Boudh
        [20.838, 83.916], // Subarnapur (Sonepur)
        [20.711, 83.487], // Balangir
      ] as [number, number][],
    },
    // 9. NH-316 Jagannath Dham Highway (GREEN - Coastal Tourism & Relief)
    {
      id: "NH-316",
      name: "NH-316 Jagannath Dham Highway (Bhubaneswar ➔ Puri)",
      color: "#059669",
      coords: [
        [20.296, 85.824], // Bhubaneswar
        [20.080, 85.830], // Pipili
        [19.813, 85.831], // Puri
      ] as [number, number][],
    },
    // 10. NH-49 Northern Trans-Odisha (GREEN - Safe Inter-State Entry)
    {
      id: "NH-49",
      name: "NH-49 Northern Corridor (Baripada ➔ Keonjhar ➔ Deogarh ➔ Jharsuguda)",
      color: "#059669",
      coords: [
        [21.934, 86.736], // Baripada
        [21.629, 85.582], // Keonjhar
        [21.536, 84.733], // Deogarh
        [21.855, 84.006], // Jharsuguda
      ] as [number, number][],
    }
  ];

  // 8 Active Moving Vehicles continuously animating along Odisha corridors
  const [vehicles, setVehicles] = useState<MovingVehicle[]>([
    {
      id: "V1",
      name: "Medical Oxygen Carrier OD-05-GC-9104",
      type: "FUEL",
      icon: "⛽",
      routeCoords: [
        [20.264, 86.671], // Paradip
        [20.463, 85.882], // Cuttack
        [20.844, 85.101], // Angul
        [21.467, 83.978], // Sambalpur
      ],
      currentIdx: 0,
      speed: 0.035,
      color: "#059669",
      roadName: "NH-53 Green Corridor (Paradip ➔ Burla VIMSAR)",
    },
    {
      id: "V2",
      name: "OSDMA Flood Relief Truck OD-02-B-3042",
      type: "CARGO",
      icon: "🚚",
      routeCoords: [
        [20.296, 85.824], // Bhubaneswar
        [20.463, 85.882], // Cuttack
        [20.851, 86.138], // Jajpur
        [21.054, 86.495], // Bhadrak
        [21.494, 86.932], // Balasore
      ],
      currentIdx: 0,
      speed: 0.045,
      color: "#DC2626",
      roadName: "NH-16 Baitarani Bridge Approach (Flood Alert)",
    },
    {
      id: "V3",
      name: "Critical ICU Ambulance OD-02-A-4422",
      type: "AMBULANCE",
      icon: "🚑",
      routeCoords: [
        [20.296, 85.824], // AIIMS Bhubaneswar
        [20.463, 85.882], // SCB Medical Cuttack
      ],
      currentIdx: 0,
      speed: 0.06,
      color: "#059669",
      roadName: "Twin City Expressway (AIIMS ➔ SCB Emergency)",
    },
    {
      id: "V4",
      name: "Eastern Ghats Supply Convoy OD-10-M-9081",
      type: "CONVOY",
      icon: "🚛",
      routeCoords: [
        [19.315, 84.794], // Berhampur
        [19.167, 83.417], // Rayagada
        [18.814, 82.711], // Koraput
        [18.344, 81.895], // Malkangiri
      ],
      currentIdx: 0,
      speed: 0.038,
      color: "#EAB308",
      roadName: "NH-326 Southern Tribal Life Corridor",
    },
    {
      id: "V5",
      name: "Works Dept Heavy JCB Excavator OD-04-X-8800",
      type: "RECOVERY",
      icon: "🚜",
      routeCoords: [
        [21.629, 85.582], // Keonjhar
        [21.517, 85.503], // Kanjipani Ghat
      ],
      currentIdx: 0,
      speed: 0.025,
      color: "#D97706",
      roadName: "NH-20 Kanjipani Ghat Emergency Clearance",
    },
    {
      id: "V6",
      name: "Odisha Police Highway Patrol OD-07-P-2026",
      type: "PATROL",
      icon: "🚙",
      routeCoords: [
        [20.296, 85.824], // Bhubaneswar
        [20.180, 85.700], // Khordha
        [19.800, 85.100], // Chatrapur
        [19.315, 84.794], // Berhampur
      ],
      currentIdx: 0,
      speed: 0.055,
      color: "#059669",
      roadName: "NH-16 Coastal Patrol Intercept",
    },
    {
      id: "V7",
      name: "Inter-District Biju Express Bus OD-14-E-1011",
      type: "BUS",
      icon: "🚌",
      routeCoords: [
        [22.260, 84.854], // Rourkela
        [21.855, 84.006], // Jharsuguda
        [21.467, 83.978], // Sambalpur
        [20.844, 85.101], // Angul
        [20.296, 85.824], // Bhubaneswar
      ],
      currentIdx: 0,
      speed: 0.048,
      color: "#059669",
      roadName: "Biju Express Public Corridor",
    },
    {
      id: "V8",
      name: "Dhamra Port LNG Feeder OD-01-S-5566",
      type: "SUPPLY",
      icon: "🚚",
      routeCoords: [
        [20.803, 86.974], // Dhamra Port
        [21.054, 86.495], // Bhadrak
        [20.851, 86.138], // Jajpur Steel Hub
      ],
      currentIdx: 0,
      speed: 0.042,
      color: "#059669",
      roadName: "Dhamra Port Industrial Evacuation Route",
    }
  ]);

  // Initialize Full-Screen Map centered on Odisha
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: [20.50, 84.80], // Centered right on Odisha geographical centroid
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

    // Add Odisha Hazard Markers on NH-16 (Baitarani River), NH-20 (Kanjipani Ghat), and Kalinga Ghat
    const hazardIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: rgba(220,38,38,0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background-color: #DC2626; color: white; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold;">⚠️</div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([20.898, 86.295], { icon: hazardIcon })
      .addTo(map)
      .bindTooltip("<b>🔴 NH-16 Baitarani River Bridge: Flood Water Overtopping Alert</b>", { sticky: true });

    L.marker([21.517, 85.503], { icon: hazardIcon })
      .addTo(map)
      .bindTooltip("<b>🔴 NH-20 Kanjipani Ghat: Active Landslide & Rockfall Caution</b>", { sticky: true });

    L.marker([20.083, 84.533], { icon: hazardIcon })
      .addTo(map)
      .bindTooltip("<b>🔴 Kalinga Ghat (SH-41): Monsoon Slope Inundation</b>", { sticky: true });

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

      {/* 3. Center Floating Hero */}
      <div className="relative z-20 max-w-4xl w-full mx-auto text-center my-auto pointer-events-auto space-y-4 px-4">
        {/* Top Kicker */}
        <div 
          style={letterBorderSub}
          className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-emerald-950"
        >
          <Sparkles className="w-4 h-4 text-emerald-800" />
          <span>{t.kicker}</span>
        </div>

        {/* Main Title */}
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

        {/* Subtitle */}
        <p 
          style={letterBorderSub}
          className="text-sm sm:text-base md:text-lg text-stone-900 font-extrabold leading-relaxed max-w-2xl mx-auto"
        >
          {t.subtitle}
        </p>

        {/* Prominent Login / Signup Action */}
        <div className="pt-4 flex items-center justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-base bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xl hover:scale-105 transition-all border-2 border-emerald-600 cursor-pointer"
          >
            <span>{t.ctaButton}</span>
            <ArrowRight className="w-5 h-5" />
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

        {/* 30 District Node Sync Coverage Pill */}
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
