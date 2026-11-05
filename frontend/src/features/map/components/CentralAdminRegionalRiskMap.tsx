"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  Layers,
  Volume2,
  VolumeX,
  AlertTriangle,
  CloudRain,
  Mountain,
  Droplets,
  Clock,
  ShieldAlert,
  Compass,
  ArrowRight,
  RefreshCw,
  Sliders,
  Filter,
  CheckCircle2,
  X,
  Radio,
  FileSpreadsheet,
  Brain,
  Truck,
  Phone,
  MessageSquare,
  PhoneCall,
  Send,
  Navigation,
  ShieldCheck,
  AlertOctagon,
  User,
  Zap
} from "lucide-react";

export interface HighwayVehicleEntity {
  id: string;
  vehicle_number: string;
  vehicle_type: "FUEL_TANKER" | "HEAVY_TRUCK" | "AMBULANCE" | "RATION_CARRIER" | "CRANE_EXCAVATOR";
  type_label: string;
  driver_name: string;
  driver_phone: string;
  current_road_id: string;
  current_road_name: string;
  cargo: string;
  speed_kmh: number;
  lat: number;
  lng: number;
  threat_status: "IN_DANGER" | "APPROACHING_HAZARD" | "SAFE";
  danger_distance_km: number;
  hazard_ahead_description: string;
  state: string;
}

export interface HighwayRiskEntity {
  id: string;
  road_number: string;
  name: string;
  state: string;
  districts_traversed: string[];
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  disaster_type: "LANDSLIDE_DEBRIS" | "FLASH_FLOOD_OVERFLOW" | "TORRENTIAL_RAINFALL" | "SNOW_ICE_BLOCK" | "CLEAR_TRANSIT";
  disaster_title: string;
  threat_time_window: string;
  precipitation_mm_24h: number;
  slope_gradient_deg: number;
  soil_saturation_pct: number;
  historical_failures_count: number;
  ai_explanation: string;
  recommended_action: string;
  coordinates: [number, number][]; // [lat, lng]
}

export const REGIONAL_HIGHWAYS_DATA: HighwayRiskEntity[] = [
  {
    id: "RD-NH-16-BAITARANI",
    road_number: "NH-16",
    name: "NH-16 Baitarani River Bridge Arterial Spine (Cuttack -> Bhadrak -> Balasore)",
    state: "Bhadrak / Jajpur / Balasore",
    districts_traversed: ["Bhadrak", "Jajpur", "Balasore", "Cuttack", "Khordha"],
    risk_level: "CRITICAL",
    risk_score: 88.5,
    disaster_type: "FLASH_FLOOD_OVERFLOW",
    disaster_title: "Baitarani River Peak Water Overtopping & Bridge Inundation",
    threat_time_window: "Imminent / Active (Next 2 to 6 Hours)",
    precipitation_mm_24h: 115.0,
    slope_gradient_deg: 3.5,
    soil_saturation_pct: 98,
    historical_failures_count: 8,
    ai_explanation: "Continuous 115.0 mm upstream precipitation across the Baitarani river catchment has pushed water levels to 18.25m (+0.42m above danger mark) at Anandapur gauging station, causing water overflow and single-lane stoppage.",
    recommended_action: "Halt multi-axle freight convoys at Panikoili and divert emergency relief cargo via NH-53/NH-20 Anandapur bypass.",
    coordinates: [
      [21.494, 86.932], // Balasore
      [21.054, 86.495], // Bhadrak
      [20.898, 86.295], // Baitarani River Bridge
      [20.851, 86.138], // Jajpur
      [20.463, 85.882], // Cuttack
      [20.296, 85.824], // Bhubaneswar
    ],
  },
  {
    id: "RD-NH-20-KANJIPANI",
    road_number: "NH-20",
    name: "NH-20 Northern Mining Corridor & Kanjipani Ghat (Panikoili -> Keonjhar)",
    state: "Kendujhar",
    districts_traversed: ["Kendujhar", "Jajpur"],
    risk_level: "HIGH",
    risk_score: 74.0,
    disaster_type: "LANDSLIDE_DEBRIS",
    disaster_title: "Kanjipani Ghat Slope Collapse & Rockfall Alert",
    threat_time_window: "Next 4 to 12 Hours (Active Slope Creep)",
    precipitation_mm_24h: 88.0,
    slope_gradient_deg: 34.0,
    soil_saturation_pct: 92,
    historical_failures_count: 7,
    ai_explanation: "Heavy torrential showers have loosened weathered laterite rock boulders along km 34-36 of Kanjipani Ghat, producing debris accumulation across the uphill freight lane.",
    recommended_action: "Pre-position Works Dept JCB hydraulic excavators at Kanjipani pass and restrict night transit of heavy mining trailers.",
    coordinates: [
      [20.851, 86.138], // Jajpur
      [21.217, 85.983], // Anandapur
      [21.517, 85.503], // Kanjipani Ghat Pass
      [21.629, 85.582], // Keonjhar
      [22.120, 85.390], // Barbil
    ],
  },
  {
    id: "RD-NH-55-EXPRESS",
    road_number: "NH-55",
    name: "NH-55 Central Industrial Expressway (Cuttack -> Dhenkanal -> Angul -> Sambalpur)",
    state: "Cuttack / Sambalpur",
    districts_traversed: ["Cuttack", "Dhenkanal", "Angul", "Sambalpur"],
    risk_level: "LOW",
    risk_score: 18.0,
    disaster_type: "CLEAR_TRANSIT",
    disaster_title: "Normal All-Weather Industrial Corridor Transit",
    threat_time_window: "Safe Transit Window (Next 48 Hours Stable)",
    precipitation_mm_24h: 16.0,
    slope_gradient_deg: 2.5,
    soil_saturation_pct: 38,
    historical_failures_count: 0,
    ai_explanation: "4-lane reinforced industrial corridor with automated drainage culverts functioning at normal clearance capacity.",
    recommended_action: "Maintain standard high-speed logistics dispatch schedules.",
    coordinates: [
      [20.463, 85.882], // Cuttack
      [20.662, 85.596], // Dhenkanal
      [20.844, 85.101], // Angul
      [21.467, 83.978], // Sambalpur
    ],
  },
  {
    id: "RD-NH-53-PARADIP",
    road_number: "NH-53",
    name: "NH-53 Western Mining & Port Expressway (Paradip -> Cuttack -> Sambalpur -> Bargarh)",
    state: "Khordha / Cuttack",
    districts_traversed: ["Jagatsinghpur", "Cuttack", "Angul", "Sambalpur", "Bargarh"],
    risk_level: "LOW",
    risk_score: 22.0,
    disaster_type: "CLEAR_TRANSIT",
    disaster_title: "Deepwater Port Freight & Chemical Supply Passage",
    threat_time_window: "Safe Transit Window (Unrestricted)",
    precipitation_mm_24h: 24.0,
    slope_gradient_deg: 1.8,
    soil_saturation_pct: 42,
    historical_failures_count: 1,
    ai_explanation: "High-capacity port corridor with sound bridge approaches and reinforced storm runoffs.",
    recommended_action: "Open for 24/7 heavy commercial and containerized logistics movement.",
    coordinates: [
      [20.264, 86.671], // Paradip Port
      [20.463, 85.882], // Cuttack
      [20.844, 85.101], // Angul
      [21.467, 83.978], // Sambalpur
      [21.334, 83.623], // Bargarh
    ],
  },
  {
    id: "RD-NH-26-SOUTHERN",
    road_number: "NH-26",
    name: "NH-26 Western-Southern Trunk (Bargarh -> Balangir -> Bhawanipatna -> Koraput)",
    state: "Koraput / Balangir",
    districts_traversed: ["Bargarh", "Balangir", "Kalahandi", "Koraput"],
    risk_level: "MEDIUM",
    risk_score: 48.0,
    disaster_type: "TORRENTIAL_RAINFALL",
    disaster_title: "Moderate Hill Slush & Heavy Mountain Downpour",
    threat_time_window: "Next 8 to 18 Hours (Heavy Rainfall Passing)",
    precipitation_mm_24h: 64.0,
    slope_gradient_deg: 24.0,
    soil_saturation_pct: 79,
    historical_failures_count: 3,
    ai_explanation: "Active monsoon squall over Eastern Ghats highlands causing waterlogging and reduced tire traction on winding ghat sections.",
    recommended_action: "Enforce 40 km/h speed limit and 60-meter convoy separation on mountain hairpins.",
    coordinates: [
      [21.334, 83.623], // Bargarh
      [20.711, 83.487], // Balangir
      [19.907, 83.167], // Bhawanipatna
      [18.858, 82.569], // Jeypore
      [18.814, 82.711], // Koraput
    ],
  },
  {
    id: "RD-SH-41-KALINGA",
    road_number: "SH-41",
    name: "SH-41 Kalinga Ghat Mountain Pass (Ganjam -> Kandhamal)",
    state: "Ganjam / Kandhamal",
    districts_traversed: ["Ganjam", "Kandhamal"],
    risk_level: "HIGH",
    risk_score: 72.0,
    disaster_type: "LANDSLIDE_DEBRIS",
    disaster_title: "Kalinga Ghat Slope Slush & Mountain Mudflow Alert",
    threat_time_window: "Next 3 to 10 Hours (Active Slope Inundation)",
    precipitation_mm_24h: 76.0,
    slope_gradient_deg: 32.5,
    soil_saturation_pct: 89,
    historical_failures_count: 5,
    ai_explanation: "Heavy precipitation in Kandhamal highlands is washing surface topsoil across hairpin bends between Bhanjanagar and Phulbani.",
    recommended_action: "Deploy ODRAF road patrol spotters and divert multi-axle freight via Aska-Bhanjanagar bypass.",
    coordinates: [
      [19.930, 84.580], // Bhanjanagar
      [20.083, 84.533], // Kalinga Ghat Pass
      [20.479, 84.234], // Phulbani
    ],
  },
  {
    id: "RD-NH-326-TRIBAL",
    road_number: "NH-326",
    name: "NH-326 Southern Tribal Lifeline (Rayagada -> Koraput -> Malkangiri)",
    state: "Koraput / Malkangiri",
    districts_traversed: ["Rayagada", "Koraput", "Malkangiri"],
    risk_level: "LOW",
    risk_score: 24.0,
    disaster_type: "CLEAR_TRANSIT",
    disaster_title: "Remote Tribal Supply Corridor Open",
    threat_time_window: "Safe Transit Window (Stable)",
    precipitation_mm_24h: 22.0,
    slope_gradient_deg: 14.0,
    soil_saturation_pct: 46,
    historical_failures_count: 1,
    ai_explanation: "Corridor clear of major structural defects; regular supply distribution to Malkangiri functioning smoothly.",
    recommended_action: "Maintain routine health & grain convoys.",
    coordinates: [
      [19.167, 83.417], // Rayagada
      [18.814, 82.711], // Koraput
      [18.344, 81.895], // Malkangiri
    ],
  },
  {
    id: "RD-ODISHA-BYPASS",
    road_number: "NH-53/20",
    name: "Anandapur-Keonjhar All-Weather Emergency Bypass Corridor",
    state: "Khordha / Kendujhar",
    districts_traversed: ["Cuttack", "Dhenkanal", "Kendujhar", "Balasore"],
    risk_level: "LOW",
    risk_score: 16.5,
    disaster_type: "CLEAR_TRANSIT",
    disaster_title: "Safe High-Ground Bypass Detour for Blocked Baitarani Traffic",
    threat_time_window: "Safe Transit Window (Recommended Alternative)",
    precipitation_mm_24h: 18.0,
    slope_gradient_deg: 6.0,
    soil_saturation_pct: 38,
    historical_failures_count: 0,
    ai_explanation: "Stable elevated inland bypass bypassing the flood-prone coastal river basins with zero inundation risk.",
    recommended_action: "Recommended as prime detour for all Northern Odisha, Kolkata, and Port-bound freight convoys.",
    coordinates: [
      [20.463, 85.882], // Cuttack
      [20.662, 85.596], // Dhenkanal
      [21.217, 85.983], // Anandapur
      [21.494, 86.932], // Balasore
    ],
  }
];

export const REGIONAL_ACTIVE_VEHICLES: HighwayVehicleEntity[] = [
  {
    id: "VEH-OD-05-GC-9104",
    vehicle_number: "OD-05-GC-9104",
    vehicle_type: "FUEL_TANKER",
    type_label: "16-Wheeler Medical Oxygen Tanker",
    driver_name: "Biren Behera",
    driver_phone: "+91 94370 12345",
    current_road_id: "RD-NH-16-BAITARANI",
    current_road_name: "NH-16 Baitarani River Bridge Corridor",
    cargo: "22,000 Litres Liquid Medical Oxygen (IOCL)",
    speed_kmh: 38,
    lat: 20.910,
    lng: 86.320,
    threat_status: "IN_DANGER",
    danger_distance_km: 2.4,
    hazard_ahead_description: "Active River Flood Overtopping at Baitarani Bridge (2.4 km ahead)",
    state: "Bhadrak / Jajpur / Balasore",
  },
  {
    id: "VEH-OD-02-B-3042",
    vehicle_number: "OD-02-B-3042",
    vehicle_type: "HEAVY_TRUCK",
    type_label: "14-Wheeler OSDMA Relief Grain Carrier",
    driver_name: "Soumya Ranjan Nayak",
    driver_phone: "+91 94371 78901",
    current_road_id: "RD-NH-16-BAITARANI",
    current_road_name: "NH-16 Coastal Arterial Spine",
    cargo: "25 Metric Tonnes Rice & Water Packets",
    speed_kmh: 48,
    lat: 20.870,
    lng: 86.210,
    threat_status: "APPROACHING_HAZARD",
    danger_distance_km: 8.6,
    hazard_ahead_description: "Baitarani Flood Water Inundation (8.6 km ahead)",
    state: "Bhadrak / Jajpur / Balasore",
  },
  {
    id: "VEH-OD-04-X-8800",
    vehicle_number: "OD-04-X-8800",
    vehicle_type: "CRANE_EXCAVATOR",
    type_label: "Works Dept Hydraulic JCB Excavator",
    driver_name: "Hemanta Mohanty",
    driver_phone: "+91 94372 99001",
    current_road_id: "RD-NH-20-KANJIPANI",
    current_road_name: "NH-20 Kanjipani Ghat Corridor",
    cargo: "Slope Debris Clearing Machinery & Winch",
    speed_kmh: 32,
    lat: 21.500,
    lng: 85.520,
    threat_status: "APPROACHING_HAZARD",
    danger_distance_km: 4.1,
    hazard_ahead_description: "Kanjipani Ghat Rockfall & Mud Slip (4.1 km ahead)",
    state: "Kendujhar",
  },
  {
    id: "VEH-OD-02-A-4422",
    vehicle_number: "OD-02-A-4422",
    vehicle_type: "AMBULANCE",
    type_label: "Advanced Life Support ICU Ambulance",
    driver_name: "Rajesh Jena",
    driver_phone: "+91 98610 54321",
    current_road_id: "RD-NH-55-EXPRESS",
    current_road_name: "Twin City Medical Corridor (AIIMS -> SCB)",
    cargo: "Critical Trauma Patient & Blood Plasma",
    speed_kmh: 65,
    lat: 20.410,
    lng: 85.860,
    threat_status: "SAFE",
    danger_distance_km: 0,
    hazard_ahead_description: "Expressway clear with green medical corridor active",
    state: "Cuttack / Sambalpur",
  },
  {
    id: "VEH-OD-10-M-9081",
    vehicle_number: "OD-10-M-9081",
    vehicle_type: "RATION_CARRIER",
    type_label: "Eastern Ghats Heavy Relief Truck",
    driver_name: "Tapan Sahu",
    driver_phone: "+91 94380 45678",
    current_road_id: "RD-NH-26-SOUTHERN",
    current_road_name: "NH-26 Western-Southern Spine",
    cargo: "Essential Baby Nutrition & Primary Vaccines",
    speed_kmh: 40,
    lat: 19.820,
    lng: 83.120,
    threat_status: "APPROACHING_HAZARD",
    danger_distance_km: 7.2,
    hazard_ahead_description: "Eastern Ghats Hill Slush & Heavy Rain (7.2 km ahead)",
    state: "Koraput / Balangir",
  },
  {
    id: "VEH-OD-07-P-2026",
    vehicle_number: "OD-07-P-2026",
    vehicle_type: "HEAVY_TRUCK",
    type_label: "Odisha Police Highway Patrol & Intercept",
    driver_name: "ASI Bikash Rout",
    driver_phone: "+91 94374 11223",
    current_road_id: "RD-ODISHA-BYPASS",
    current_road_name: "Anandapur-Keonjhar Bypass Patrol",
    cargo: "Emergency Road Diversion Cones & Radio Base",
    speed_kmh: 56,
    lat: 21.180,
    lng: 85.920,
    threat_status: "SAFE",
    danger_distance_km: 0,
    hazard_ahead_description: "Bypass traffic moving smoothly without delay",
    state: "Khordha / Kendujhar",
  }
];

export const CentralAdminRegionalRiskMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const vehicleMarkersRef = useRef<any[]>([]);

  const [selectedHighway, setSelectedHighway] = useState<HighwayRiskEntity | null>(REGIONAL_HIGHWAYS_DATA[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<HighwayVehicleEntity | null>(null);
  const [filterState, setFilterState] = useState<string>("ALL");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [voiceSpeaking, setVoiceSpeaking] = useState<boolean>(false);
  const [mapStyle, setMapStyle] = useState<"LIGHT" | "TERRAIN" | "SATELLITE">("LIGHT");

  // Call & Message simulation states
  const [activeCallDriver, setActiveCallDriver] = useState<HighwayVehicleEntity | null>(null);
  const [callDurationSec, setCallDurationSec] = useState<number>(0);
  const [dispatchAlertLog, setDispatchAlertLog] = useState<string[]>([]);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Filter highways
  const filteredHighways = REGIONAL_HIGHWAYS_DATA.filter((hw) => {
    if (filterState !== "ALL" && !hw.state.includes(filterState)) return false;
    if (filterRisk !== "ALL" && hw.risk_level !== filterRisk) return false;
    return true;
  });

  // Filter vehicles
  const filteredVehicles = REGIONAL_ACTIVE_VEHICLES.filter((v) => {
    if (filterState !== "ALL" && !v.state.includes(filterState)) return false;
    return true;
  });

  // Voice AI speech function
  const speakRiskAdvisory = (hw: HighwayRiskEntity) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const speechText = `Central Command Disaster Alert on ${hw.name}. The AI prediction model detects a ${hw.risk_level} risk of ${hw.disaster_title}. Threat window: ${hw.threat_time_window}. Cause: ${hw.precipitation_mm_24h} millimeters precipitation, slope ${hw.slope_gradient_deg} degrees, and soil saturation at ${hw.soil_saturation_pct} percent. Recommended Action: ${hw.recommended_action}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setVoiceSpeaking(true);
    utterance.onend = () => setVoiceSpeaking(false);
    utterance.onerror = () => setVoiceSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setVoiceSpeaking(false);
    }
  };

  // Handle Emergency Stop / HALT Order
  const handleSendHaltOrder = (veh: HighwayVehicleEntity) => {
    const alertText = `🚨 GOVT COMMAND DISPATCH: Urgent HALT order issued to ${veh.vehicle_number} (${veh.driver_name}). Reason: ${veh.hazard_ahead_description}. Stop at nearest safe bay immediately.`;
    setDispatchAlertLog((prev) => [alertText, ...prev]);
    setDispatchSuccessMsg(`Emergency HALT Order dispatched via SMS/Radio to driver ${veh.driver_name} (${veh.driver_phone})!`);

    // Voice announcement for Government Admin
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(`Emergency Halt Order sent to driver ${veh.driver_name} on vehicle ${veh.vehicle_number}. Highway danger alert transmitted.`);
      window.speechSynthesis.speak(u);
    }

    setTimeout(() => setDispatchSuccessMsg(null), 6000);
  };

  // Handle Direct Emergency Call
  const handleStartCall = (veh: HighwayVehicleEntity) => {
    setActiveCallDriver(veh);
    setCallDurationSec(0);
  };

  useEffect(() => {
    let timer: any;
    if (activeCallDriver) {
      timer = setInterval(() => {
        setCallDurationSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCallDriver]);

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: [20.50, 84.80],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
    });

    const tileUrls = {
      LIGHT: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      TERRAIN: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    const tileLayer = L.tileLayer(tileUrls.LIGHT, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    mapInstanceRef.current = map;
    (map as any)._tileLayer = tileLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(map as any)._tileLayer) return;
    const L = require("leaflet");

    const tileUrls = {
      LIGHT: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      TERRAIN: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    map.removeLayer((map as any)._tileLayer);
    const newLayer = L.tileLayer(tileUrls[mapStyle], {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    (map as any)._tileLayer = newLayer;
  }, [mapStyle]);

  // Render Colored Road Polylines & Live Vehicle Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = require("leaflet");

    // Clear previous polylines & markers
    polylinesRef.current.forEach((p) => map.removeLayer(p));
    polylinesRef.current = [];
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    vehicleMarkersRef.current.forEach((vm) => map.removeLayer(vm));
    vehicleMarkersRef.current = [];

    const allBounds = L.latLngBounds([]);

    // 1. Draw Highway Polylines
    filteredHighways.forEach((hw) => {
      const isSelected = selectedHighway?.id === hw.id;

      let color = "#10B981"; // GREEN
      if (hw.risk_level === "CRITICAL") color = "#EF4444"; // RED
      else if (hw.risk_level === "HIGH") color = "#EA580C"; // ORANGE
      else if (hw.risk_level === "MEDIUM") color = "#F59E0B"; // YELLOW

      const weight = isSelected ? 8 : 5;
      const opacity = isSelected ? 1.0 : 0.65;

      const polyline = L.polyline(hw.coordinates, {
        color: color,
        weight: weight,
        opacity: opacity,
        lineJoin: "round",
      }).addTo(map);

      polyline.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px;">
          <b style="color: #0F172A;">${hw.road_number}: ${hw.name}</b><br/>
          <b>Risk Level:</b> <span style="color:${color}; font-weight:800;">${hw.risk_level} (${hw.risk_score}/100)</span><br/>
          <b>Disaster:</b> ${hw.disaster_title}<br/>
          <b>Threat Window:</b> ${hw.threat_time_window}<br/>
          <i style="color:#047857;">Click road to hear AI explanation & action plan</i>
        </div>`,
        { sticky: true }
      );

      polyline.on("click", () => {
        setSelectedHighway(hw);
        setSelectedVehicle(null);
        speakRiskAdvisory(hw);
      });

      polylinesRef.current.push(polyline);
      hw.coordinates.forEach((c) => allBounds.extend(c));
    });

    // 2. Draw Live Active Vehicle Markers on the Roads
    filteredVehicles.forEach((veh) => {
      const isSelectedVeh = selectedVehicle?.id === veh.id;
      const isDanger = veh.threat_status === "IN_DANGER";
      const isWarning = veh.threat_status === "APPROACHING_HAZARD";

      const badgeBg = isDanger ? "#EF4444" : isWarning ? "#EA580C" : "#10B981";
      const pulseClass = isDanger ? "animate-ping" : "";

      const vehIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${isDanger ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background-color: rgba(239,68,68,0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
            <div style="background-color: #1E293B; color: white; width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid ${badgeBg}; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 15px;">
              ${veh.vehicle_type === "FUEL_TANKER" ? "⛽" : veh.vehicle_type === "AMBULANCE" ? "🚑" : veh.vehicle_type === "CRANE_EXCAVATOR" ? "🚜" : "🚚"}
            </div>
            <div style="position: absolute; bottom: -8px; background-color: ${badgeBg}; color: white; font-size: 8px; font-weight: 800; font-family: monospace; padding: 0 4px; border-radius: 4px; border: 1px solid white; white-space: nowrap;">
              ${veh.vehicle_number.split("-")[1] || veh.vehicle_number}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const vehMarker = L.marker([veh.lat, veh.lng], { icon: vehIcon }).addTo(map);

      vehMarker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px;">
          <b>${veh.vehicle_number} (${veh.type_label})</b><br/>
          <b>Driver:</b> ${veh.driver_name} (${veh.driver_phone})<br/>
          <b>Corridor:</b> ${veh.current_road_name}<br/>
          <b>Status:</b> <span style="color:${badgeBg}; font-weight:bold;">${veh.threat_status}</span><br/>
          ${veh.hazard_ahead_description ? `⚠️ <i>${veh.hazard_ahead_description}</i><br/>` : ""}
          <b style="color: #0284C7;">Click vehicle to Call or send Emergency HALT order</b>
        </div>`,
        { sticky: true }
      );

      vehMarker.on("click", () => {
        setSelectedVehicle(veh);
        const relatedHw = REGIONAL_HIGHWAYS_DATA.find((h) => h.id === veh.current_road_id);
        if (relatedHw) setSelectedHighway(relatedHw);
      });

      vehicleMarkersRef.current.push(vehMarker);
      allBounds.extend([veh.lat, veh.lng]);
    });

    if (allBounds.isValid()) {
      map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [filteredHighways, filteredVehicles, selectedHighway, selectedVehicle]);

  return (
    <div className="space-y-4 font-sans text-stone-900">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                Odisha State Highway GIS Map & Active Fleet Intercept
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                Live Moving Vehicles ({filteredVehicles.length})
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Live highway risk coloring • Active vehicle telemetry • 1-Click Driver Call & Emergency Stop Orders
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="bg-transparent text-stone-800 font-semibold outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Odisha Corridors</option>
              <option value="Bhadrak">Bhadrak / Coastal Spine</option>
              <option value="Kendujhar">Kendujhar / Mining Corridor</option>
              <option value="Cuttack">Cuttack / Industrial</option>
              <option value="Koraput">Koraput / Southern Ghats</option>
              <option value="Khordha">Khordha / Capital</option>
              <option value="Ganjam">Ganjam / Southern</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-transparent text-stone-800 font-semibold outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">🔴 Critical Landslide / Flood</option>
              <option value="HIGH">🟠 High Hazard Only</option>
              <option value="MEDIUM">🟡 Medium / Caution</option>
              <option value="LOW">🟢 Clear / Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {dispatchSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Map (Left) + Right Diagnosis / Fleet Intercept Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive GIS Map */}
        <div className="lg:col-span-7 h-[500px] lg:h-[640px] relative rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-0" />

          {/* Map Layer Selector */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-stone-200 shadow-xs flex items-center gap-1 text-[11px] font-semibold text-stone-700">
            <button
              type="button"
              onClick={() => setMapStyle("LIGHT")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === "LIGHT" ? "bg-emerald-800 text-white font-bold" : "hover:bg-stone-100"
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("TERRAIN")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === "TERRAIN" ? "bg-emerald-800 text-white font-bold" : "hover:bg-stone-100"
              }`}
            >
              Terrain
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("SATELLITE")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === "SATELLITE" ? "bg-emerald-800 text-white font-bold" : "hover:bg-stone-100"
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Legend Bottom Left */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-stone-200 shadow-md text-xs space-y-1.5">
            <div className="font-bold text-stone-900 flex items-center gap-1.5 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-emerald-800" />
              <span>Map Layer &amp; Vehicle Legend</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-emerald-500 rounded-full" />
                <span>🟢 Green: Low Risk (&lt;25%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-amber-500 rounded-full" />
                <span>🟡 Yellow: Caution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-orange-500 rounded-full" />
                <span>🟠 Orange: High Mud Hazard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-rose-500 rounded-full" />
                <span>🔴 Red: Critical Landslide</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-stone-200">
                <span className="text-sm">⛽🚚</span>
                <span>Moving Vehicles (Click to Call/Halt)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Risk Diagnostics OR Selected Vehicle Command Drawer */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. If A Vehicle Is Selected -> Show Fleet Intercept & Stop Action */}
          {selectedVehicle ? (
            <div className="bg-white border-2 border-emerald-800 rounded-2xl p-5 shadow-md space-y-4 font-sans animate-in fade-in">
              <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-stone-900 text-white">
                      {selectedVehicle.vehicle_number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                      selectedVehicle.threat_status === "IN_DANGER"
                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                        : selectedVehicle.threat_status === "APPROACHING_HAZARD"
                        ? "bg-orange-100 text-orange-900 border border-orange-300"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    }`}>
                      {selectedVehicle.threat_status === "IN_DANGER" ? "🔴 IN DANGER ZONE" : selectedVehicle.threat_status === "APPROACHING_HAZARD" ? "🟠 APPROACHING HAZARD" : "🟢 NORMAL TRANSIT"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-1.5">
                    {selectedVehicle.type_label}
                  </h3>
                  <div className="text-xs text-stone-500">
                    Corridor: <span className="font-semibold text-stone-800">{selectedVehicle.current_road_name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Driver & Telemetry Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-medium">Assigned Driver</div>
                  <div className="font-bold text-stone-900">{selectedVehicle.driver_name}</div>
                  <div className="font-mono text-[11px] text-stone-600">{selectedVehicle.driver_phone}</div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-medium">Live Telemetry</div>
                  <div className="font-mono font-bold text-emerald-800">{selectedVehicle.speed_kmh} km/h</div>
                  <div className="text-[10px] text-stone-500 truncate">{selectedVehicle.cargo}</div>
                </div>
              </div>

              {/* Threat Alert Warning */}
              {selectedVehicle.threat_status !== "SAFE" && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Hazard Alert in Transit:</span>
                  </div>
                  <p className="text-rose-800 text-[11px] font-medium leading-relaxed">
                    {selectedVehicle.hazard_ahead_description}
                  </p>
                </div>
              )}

              {/* Emergency Government Action Buttons: Call & Send HALT Order */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Emergency Intercept Actions:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartCall(selectedVehicle)}
                    className="w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver 📞</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendHaltOrder(selectedVehicle)}
                    className="w-full py-2.5 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Send HALT Order 🚨</span>
                  </button>
                </div>
              </div>
            </div>
          ) : selectedHighway ? (
            /* 2. Otherwise Show Road AI Diagnostics */
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4 font-sans animate-in fade-in">
              {/* Highway Header & Audio Speak */}
              <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-stone-100 text-stone-800 border border-stone-200">
                      {selectedHighway.road_number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                      selectedHighway.risk_level === "CRITICAL"
                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                        : selectedHighway.risk_level === "HIGH"
                        ? "bg-orange-100 text-orange-900 border border-orange-300"
                        : selectedHighway.risk_level === "MEDIUM"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    }`}>
                      {selectedHighway.risk_level} RISK ({selectedHighway.risk_score}/100)
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-1.5 leading-snug">
                    {selectedHighway.name}
                  </h3>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {selectedHighway.state} • Districts: {selectedHighway.districts_traversed.join(", ")}
                  </div>
                </div>

                {/* Voice Audio Read Button */}
                <button
                  type="button"
                  onClick={() => voiceSpeaking ? stopVoice() : speakRiskAdvisory(selectedHighway)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 ${
                    voiceSpeaking
                      ? "bg-rose-700 text-white animate-pulse"
                      : "bg-emerald-800 hover:bg-emerald-900 text-white"
                  }`}
                  title="Speak AI Disaster Explanation in Voice"
                >
                  {voiceSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak Advisory 🔊</span>
                    </>
                  )}
                </button>
              </div>

              {/* Disaster Forecast Title & Threat Time Window */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                selectedHighway.risk_level === "CRITICAL" || selectedHighway.risk_level === "HIGH"
                  ? "bg-rose-50 border-rose-200 text-rose-950"
                  : "bg-stone-50 border-stone-200 text-stone-900"
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Predicted Disaster: {selectedHighway.disaster_title}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>When will it happen: </span>
                  <span className="text-rose-900 font-bold">{selectedHighway.threat_time_window}</span>
                </div>
              </div>

              {/* AI Feature Explainability Grid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Why is there Risk? (AI Feature Predictors):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                      <CloudRain className="w-3 h-3 text-blue-600" />
                      <span>Precipitation (IMD)</span>
                    </div>
                    <div className="font-mono font-bold text-stone-900">{selectedHighway.precipitation_mm_24h} mm</div>
                    <div className="text-[9px] text-stone-400">{selectedHighway.precipitation_mm_24h > 45 ? "Torrential Downpour" : "Normal"}</div>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                      <Mountain className="w-3 h-3 text-amber-700" />
                      <span>Slope Gradient</span>
                    </div>
                    <div className="font-mono font-bold text-stone-900">{selectedHighway.slope_gradient_deg}° Incline</div>
                    <div className="text-[9px] text-stone-400">{selectedHighway.slope_gradient_deg > 25 ? "Steep Mountain" : "Gentle"}</div>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                      <Droplets className="w-3 h-3 text-cyan-600" />
                      <span>Soil Saturation</span>
                    </div>
                    <div className="font-mono font-bold text-stone-900">{selectedHighway.soil_saturation_pct}% Waterlogged</div>
                    <div className="text-[9px] text-stone-400">{selectedHighway.soil_saturation_pct > 80 ? "Saturated Subsoil" : "Stable"}</div>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Historical Landslides</span>
                    </div>
                    <div className="font-mono font-bold text-stone-900">{selectedHighway.historical_failures_count} Previous Collapses</div>
                    <div className="text-[9px] text-stone-400">GSI Vulnerability Map</div>
                  </div>
                </div>
              </div>

              {/* Recommended Government Action */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Recommended Central Command Action:</span>
                </div>
                <p className="text-emerald-900 text-[11px] font-medium">
                  {selectedHighway.recommended_action}
                </p>
              </div>
            </div>
          ) : null}

          {/* 3. Live Active Vehicles Matrix on the Roads */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-800" />
                <span>Active Vehicles on Corridors ({filteredVehicles.length})</span>
              </div>
              <span className="text-[10px] text-stone-500">Click to Call / Halt</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {filteredVehicles.map((veh) => (
                <div
                  key={veh.id}
                  onClick={() => {
                    setSelectedVehicle(veh);
                    const relatedHw = REGIONAL_HIGHWAYS_DATA.find((h) => h.id === veh.current_road_id);
                    if (relatedHw) setSelectedHighway(relatedHw);
                  }}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                    selectedVehicle?.id === veh.id
                      ? "bg-emerald-50 border-emerald-300 shadow-2xs font-semibold text-emerald-950"
                      : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">
                      {veh.vehicle_type === "FUEL_TANKER" ? "⛽" : veh.vehicle_type === "AMBULANCE" ? "🚑" : "🚚"}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-stone-900 truncate">
                        {veh.vehicle_number} • <span className="font-normal text-stone-500">{veh.driver_name}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">{veh.current_road_name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      veh.threat_status === "IN_DANGER"
                        ? "bg-rose-100 text-rose-900 border border-rose-200 animate-pulse"
                        : veh.threat_status === "APPROACHING_HAZARD"
                        ? "bg-orange-100 text-orange-900 border border-orange-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}>
                      {veh.threat_status === "IN_DANGER" ? "DANGER" : veh.threat_status === "APPROACHING_HAZARD" ? "CAUTION" : "SAFE"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Call Overlay Modal if Admin is calling driver */}
      {activeCallDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-6 max-w-sm w-full text-center text-white shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <PhoneCall className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs text-stone-400 font-mono">GOVERNMENT CENTRAL COMMAND CALL</div>
              <h3 className="text-lg font-bold text-white mt-1">{activeCallDriver.driver_name}</h3>
              <div className="text-xs text-stone-300 font-mono">{activeCallDriver.driver_phone}</div>
              <div className="text-xs text-stone-400 mt-1">{activeCallDriver.vehicle_number} • {activeCallDriver.current_road_name}</div>
            </div>

            <div className="p-3 bg-stone-800 rounded-2xl border border-stone-700 text-xs font-mono text-emerald-400">
              Connected: {Math.floor(callDurationSec / 60)}:{(callDurationSec % 60).toString().padStart(2, "0")}
            </div>

            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-2xl text-[11px] text-rose-200 text-left">
              <b>Advisory to Driver:</b> "Biren, Stop immediately. Landslide reported 3.8 km ahead near Sonapur tunnel. Divert to Haflong bypass."
            </div>

            <button
              type="button"
              onClick={() => setActiveCallDriver(null)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              End Emergency Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
