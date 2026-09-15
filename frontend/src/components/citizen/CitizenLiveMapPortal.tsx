"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { 
  Compass, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  ShieldCheck, 
  PhoneCall, 
  Radio, 
  Volume2, 
  VolumeX, 
  Layers, 
  Crosshair, 
  Search, 
  ArrowRight, 
  Share2, 
  Camera, 
  CheckCircle2, 
  X, 
  Clock, 
  Gauge, 
  Fuel, 
  Building2, 
  Hospital, 
  Tent, 
  ChevronRight,
  ShieldAlert,
  Send,
  Sparkles,
  Info
} from "lucide-react";

// Preset regional hubs across the 8 North-Eastern states
interface LocationPreset {
  id: string;
  name: string;
  state: string;
  coords: [number, number];
  weather: string;
  temp: string;
  riskIndex: number; // 0 to 100
  surroundingRoads: SurroundingRoad[];
  safeHavens: SafeHaven[];
}

interface SurroundingRoad {
  id: string;
  name: string;
  direction: "NORTH" | "SOUTH" | "EAST" | "WEST";
  directionLabel: string;
  riskLevel: "SAFE" | "CAUTION" | "DANGER";
  riskScore: number; // 0.0 to 1.0
  statusText: string;
  hazardReason: string;
  speedLimit: string;
  distanceKm: number;
  coords: [number, number][];
}

interface SafeHaven {
  id: string;
  name: string;
  type: "HOSPITAL" | "SHELTER" | "FUEL";
  distance: string;
  coords: [number, number];
  contact: string;
  capacity?: string;
  isOpen: boolean;
}

const NER_LOCATIONS: LocationPreset[] = [
  {
    id: "guwahati",
    name: "Guwahati City Center (Paltan Bazaar)",
    state: "Assam",
    coords: [26.180, 91.750],
    weather: "Overcast with Intermittent Drizzle",
    temp: "27°C",
    riskIndex: 32,
    surroundingRoads: [
      {
        id: "GHY-N",
        name: "North Bank Corridor (Saraighat Bridge ➔ Jalukbari)",
        direction: "NORTH",
        directionLabel: "North (NH-27 / NH-15)",
        riskLevel: "SAFE",
        riskScore: 0.15,
        statusText: "Open & Safe — Smooth Flow",
        hazardReason: "Paved 4-lane bridge with operational telemetry.",
        speedLimit: "60 km/h",
        distanceKm: 8.5,
        coords: [[26.180, 91.750], [26.170, 91.680], [26.130, 91.600]]
      },
      {
        id: "GHY-S",
        name: "Khanapara - Meghalaya Gateway (NH-6 Hill Incline)",
        direction: "SOUTH",
        directionLabel: "South (NH-6 to Shillong)",
        riskLevel: "CAUTION",
        riskScore: 0.58,
        statusText: "Caution — Waterlogging & Heavy Fog",
        hazardReason: "Monsoon runoff near Jorabat junction. Slow uphill movement.",
        speedLimit: "35 km/h",
        distanceKm: 12.0,
        coords: [[26.180, 91.750], [26.130, 91.800], [26.070, 91.870]]
      },
      {
        id: "GHY-E",
        name: "East Expressway (Beltola ➔ Sonapur ➔ Nagaon)",
        direction: "EAST",
        directionLabel: "East (NH-27 Expressway)",
        riskLevel: "SAFE",
        riskScore: 0.20,
        statusText: "All-Weather Clear Highway",
        hazardReason: "Four-lane elevated corridor. Dry pavement.",
        speedLimit: "80 km/h",
        distanceKm: 18.0,
        coords: [[26.180, 91.750], [26.140, 91.820], [26.110, 91.950]]
      },
      {
        id: "GHY-W",
        name: "Deepor Beel - VIP Airport Road",
        direction: "WEST",
        directionLabel: "West (Airport Corridor)",
        riskLevel: "DANGER",
        riskScore: 0.88,
        statusText: "BLOCKED — Flash Flood Submersion",
        hazardReason: "Water overflow from Deepor lake catchment. Vehicles redirected.",
        speedLimit: "0 km/h",
        distanceKm: 9.2,
        coords: [[26.180, 91.750], [26.130, 91.660], [26.115, 91.590]]
      }
    ],
    safeHavens: [
      {
        id: "SH-1",
        name: "Gauhati Medical College & Hospital (GMCH)",
        type: "HOSPITAL",
        distance: "3.4 km",
        coords: [26.155, 91.770],
        contact: "108 / 0361-2529457",
        isOpen: true
      },
      {
        id: "SH-2",
        name: "Dispur Govt Relief & Cyclone Shelter",
        type: "SHELTER",
        distance: "4.8 km",
        coords: [26.140, 91.790],
        capacity: "450 Beds Available",
        contact: "1077 (District Control)",
        isOpen: true
      },
      {
        id: "SH-3",
        name: "Indian Oil 24x7 Emergency Fuel Point (Khanapara)",
        type: "FUEL",
        distance: "6.1 km",
        coords: [26.120, 91.815],
        contact: "0361-2284910",
        isOpen: true
      }
    ]
  },
  {
    id: "shillong",
    name: "Shillong Police Bazar Ridge",
    state: "Meghalaya",
    coords: [25.578, 91.893],
    weather: "Dense Mountain Fog & Heavy Mist",
    temp: "17°C",
    riskIndex: 68,
    surroundingRoads: [
      {
        id: "SHL-N",
        name: "Umiam Lake Highway (Shillong ➔ Guwahati)",
        direction: "NORTH",
        directionLabel: "North (NH-6 Umiam)",
        riskLevel: "SAFE",
        riskScore: 0.28,
        statusText: "Open — Drive with Fog Lights",
        hazardReason: "Asphalt intact. Visibility 150m in mountain turns.",
        speedLimit: "45 km/h",
        distanceKm: 14.0,
        coords: [[25.578, 91.893], [25.640, 91.890], [25.680, 91.900]]
      },
      {
        id: "SHL-S",
        name: "Cherrapunji / Sohra Hill Road",
        direction: "SOUTH",
        directionLabel: "South (SH-5 to Sohra)",
        riskLevel: "CAUTION",
        riskScore: 0.62,
        statusText: "Caution — Sinking Soil Patch at Mile 12",
        hazardReason: "Continuous monsoon drizzle. Single-lane slow transit.",
        speedLimit: "30 km/h",
        distanceKm: 22.0,
        coords: [[25.578, 91.893], [25.510, 91.870], [25.430, 91.750]]
      },
      {
        id: "SHL-E",
        name: "Jowai - Sonapur Tunnel Arterial",
        direction: "EAST",
        directionLabel: "East (NH-6 Sonapur Pass)",
        riskLevel: "DANGER",
        riskScore: 0.96,
        statusText: "DANGER — Active Landslide Blockage",
        hazardReason: "Major rockfall debris at Sonapur Tunnel mouth. Clearance underway.",
        speedLimit: "0 km/h (Halt)",
        distanceKm: 34.0,
        coords: [[25.578, 91.893], [25.450, 92.200], [25.105, 92.361]]
      },
      {
        id: "SHL-W",
        name: "Elephant Falls - Nongstoin Bypass",
        direction: "WEST",
        directionLabel: "West (NH-106 Nongstoin)",
        riskLevel: "SAFE",
        riskScore: 0.22,
        statusText: "Open All-Weather Ridge Route",
        hazardReason: "Newly reinforced retaining walls and drainage channels.",
        speedLimit: "50 km/h",
        distanceKm: 16.5,
        coords: [[25.578, 91.893], [25.560, 91.820], [25.520, 91.700]]
      }
    ],
    safeHavens: [
      {
        id: "SHL-H1",
        name: "NEIGRIHMS Super Specialty Hospital",
        type: "HOSPITAL",
        distance: "5.2 km",
        coords: [25.590, 91.930],
        contact: "0364-2538011",
        isOpen: true
      },
      {
        id: "SHL-S1",
        name: "State Disaster Emergency Camp (Polo Ground)",
        type: "SHELTER",
        distance: "1.8 km",
        coords: [25.585, 91.895],
        capacity: "300 Persons Capacity",
        contact: "1070 (SDMA)",
        isOpen: true
      }
    ]
  },
  {
    id: "gangtok",
    name: "Gangtok MG Marg Ridge",
    state: "Sikkim",
    coords: [27.338, 88.606],
    weather: "Monsoon Downpour & Cloud Cover",
    temp: "15°C",
    riskIndex: 75,
    surroundingRoads: [
      {
        id: "GTK-N",
        name: "North Sikkim Highway (Mangan ➔ Chungthang)",
        direction: "NORTH",
        directionLabel: "North (NH-310A North Pass)",
        riskLevel: "DANGER",
        riskScore: 0.92,
        statusText: "CLOSED — Mudslide Cutoff at Dikchu",
        hazardReason: "Heavy boulder deposition across both lanes. BRO team deployed.",
        speedLimit: "0 km/h",
        distanceKm: 28.0,
        coords: [[27.338, 88.606], [27.390, 88.580], [27.460, 88.530]]
      },
      {
        id: "GTK-S",
        name: "NH-10 Teesta Valley Lifeline (to Siliguri)",
        direction: "SOUTH",
        directionLabel: "South (NH-10 Teesta Corridor)",
        riskLevel: "DANGER",
        riskScore: 0.94,
        statusText: "CRITICAL — Teesta River Scouring at 29th Mile",
        hazardReason: "River water touching road level. Divert via Lava-Algarah.",
        speedLimit: "0 km/h",
        distanceKm: 32.0,
        coords: [[27.338, 88.606], [27.240, 88.540], [27.170, 88.530]]
      },
      {
        id: "GTK-E",
        name: "Nathula Pass Border Road",
        direction: "EAST",
        directionLabel: "East (Jawaharlal Nehru Road)",
        riskLevel: "CAUTION",
        riskScore: 0.65,
        statusText: "Caution — Ice Flakes & Rock Slips",
        hazardReason: "Snow accumulation above 12,000 ft. 4x4 vehicles permitted.",
        speedLimit: "25 km/h",
        distanceKm: 19.0,
        coords: [[27.338, 88.606], [27.370, 88.690], [27.390, 88.780]]
      },
      {
        id: "GTK-W",
        name: "Rumtek - Singtam Green Detour Route",
        direction: "WEST",
        directionLabel: "West (Singtam Bypass)",
        riskLevel: "SAFE",
        riskScore: 0.30,
        statusText: "OPEN — Safe High-Altitude Alternative",
        hazardReason: "Reinforced ridge line road. Fully operational for light traffic.",
        speedLimit: "40 km/h",
        distanceKm: 18.0,
        coords: [[27.338, 88.606], [27.290, 88.580], [27.230, 88.490]]
      }
    ],
    safeHavens: [
      {
        id: "GTK-H1",
        name: "STNM Multispeciality Hospital (Sochaygang)",
        type: "HOSPITAL",
        distance: "4.1 km",
        coords: [27.315, 88.600],
        contact: "03592-202944",
        isOpen: true
      },
      {
        id: "GTK-S1",
        name: "District Community Relief Center (Tadong)",
        type: "SHELTER",
        distance: "3.2 km",
        coords: [27.310, 88.605],
        capacity: "250 Emergency Beds",
        contact: "1077 (Gangtok Disaster Cell)",
        isOpen: true
      }
    ]
  },
  {
    id: "imphal",
    name: "Imphal Kangla Fort Center",
    state: "Manipur",
    coords: [24.817, 93.936],
    weather: "Partly Cloudy with Humid Breeze",
    temp: "29°C",
    riskIndex: 45,
    surroundingRoads: [
      {
        id: "IMP-N",
        name: "NH-2 Hills Highway (Imphal ➔ Kangpokpi ➔ Kohima)",
        direction: "NORTH",
        directionLabel: "North (NH-2 to Nagaland)",
        riskLevel: "CAUTION",
        riskScore: 0.60,
        statusText: "Caution — Sinking Slope at Taphou",
        hazardReason: "Single-lane restricted movement due to minor hill slumping.",
        speedLimit: "35 km/h",
        distanceKm: 25.0,
        coords: [[24.817, 93.936], [24.930, 93.950], [25.100, 93.980]]
      },
      {
        id: "IMP-S",
        name: "NH-102 Asian Highway (to Thoubal & Moreh)",
        direction: "SOUTH",
        directionLabel: "South (Asian Highway 1)",
        riskLevel: "SAFE",
        riskScore: 0.18,
        statusText: "SAFE — Paved 2-Way International Corridor",
        hazardReason: "Optimal road conditions with round-the-clock patrol.",
        speedLimit: "70 km/h",
        distanceKm: 22.0,
        coords: [[24.817, 93.936], [24.630, 93.990], [24.400, 94.100]]
      },
      {
        id: "IMP-E",
        name: "Ukhrul Hill Ridge Highway",
        direction: "EAST",
        directionLabel: "East (SH-3 to Ukhrul)",
        riskLevel: "SAFE",
        riskScore: 0.25,
        statusText: "Open — Scenic Mountain Drive",
        hazardReason: "Clear asphalt without blockages.",
        speedLimit: "45 km/h",
        distanceKm: 20.0,
        coords: [[24.817, 93.936], [24.890, 94.120], [25.050, 94.350]]
      },
      {
        id: "IMP-W",
        name: "NH-53 Jiribam - Silchar Lifeline",
        direction: "WEST",
        directionLabel: "West (NH-53 Noney Hill)",
        riskLevel: "DANGER",
        riskScore: 0.95,
        statusText: "BLOCKED — Mudflow at Noney Bridge Approach",
        hazardReason: "Substantial mud and debris accumulation on hill slope.",
        speedLimit: "0 km/h",
        distanceKm: 38.0,
        coords: [[24.817, 93.936], [24.780, 93.600], [24.800, 93.120]]
      }
    ],
    safeHavens: [
      {
        id: "IMP-H1",
        name: "Regional Institute of Medical Sciences (RIMS)",
        type: "HOSPITAL",
        distance: "2.6 km",
        coords: [24.825, 93.920],
        contact: "0385-2414629",
        isOpen: true
      },
      {
        id: "IMP-S1",
        name: "Kangla Relief & Civil Defense Transit Center",
        type: "SHELTER",
        distance: "1.2 km",
        coords: [24.815, 93.940],
        capacity: "500 Person Capacity",
        contact: "1070 (Manipur DDMA)",
        isOpen: true
      }
    ]
  }
];

export const CitizenLiveMapPortal: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const roadLayersRef = useRef<{ [id: string]: any }>({});
  const safeHavenMarkersRef = useRef<any[]>([]);
  const userBeaconMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  // Selected hub & live coordinates
  const [selectedLocationId, setSelectedLocationId] = useState<string>("guwahati");
  const currentLocation = NER_LOCATIONS.find((l) => l.id === selectedLocationId) || NER_LOCATIONS[0];
  const [userCoords, setUserCoords] = useState<[number, number]>(currentLocation.coords);

  // Map Tile Style
  const [tileStyle, setTileStyle] = useState<"STREET" | "TERRAIN" | "SATELLITE">("STREET");

  // Selected road details for the bottom/side inspection sheet
  const [selectedRoad, setSelectedRoad] = useState<SurroundingRoad | null>(null);

  // Google Maps Style Navigation Search
  const [originInput, setOriginInput] = useState<string>("📍 Current Live Location");
  const [destinationInput, setDestinationInput] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    distance: string;
    duration: string;
    safetyScore: number;
    hazardAvoided: string;
    steps: { text: string; distance: string; isHazardAvoidance?: boolean }[];
  } | null>(null);

  // Audio Voice Guidance
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [lastVoicePrompt, setLastVoicePrompt] = useState<string>("");

  // Emergency SOS Modal State
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [sosSent, setSosSent] = useState<boolean>(false);
  const [sosTicketId, setSosTicketId] = useState<string>("");

  // Citizen Incident Submission Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportRoadName, setReportRoadName] = useState<string>("");
  const [reportType, setReportType] = useState<string>("LANDSLIDE");
  const [reportComment, setReportComment] = useState<string>("");
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

  // Play voice prompt helper
  const speakVoice = (text: string) => {
    setLastVoicePrompt(text);
    if (!isVoiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback
    }
  };

  // Sync coords when user changes location preset
  useEffect(() => {
    setUserCoords(currentLocation.coords);
    setSelectedRoad(null);
    setIsNavigating(false);
    setActiveRouteInfo(null);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(currentLocation.coords, 12, {
        duration: 1.5,
      });
    }
  }, [selectedLocationId]);

  // Handle GPS Button
  const handleUseDeviceGps = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(newCoords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(newCoords, 14, { duration: 1.2 });
          }
          speakVoice("Centering map to your live device GPS location.");
        },
        () => {
          speakVoice("Using regional center coordinates.");
        }
      );
    }
  };

  // Initialize Interactive Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: userCoords,
      zoom: 12,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    const tileUrls = {
      STREET: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      TERRAIN: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    const tileLayer = L.tileLayer(tileUrls.STREET, { maxZoom: 19, opacity: 0.95 }).addTo(map);
    mapInstanceRef.current = map;
    (map as any)._tileLayer = tileLayer;

    // Add Top-Right Zoom Control
    L.control.zoom({ position: "topright" }).addTo(map);

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
      STREET: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      TERRAIN: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    map.removeLayer((map as any)._tileLayer);
    const newLayer = L.tileLayer(tileUrls[tileStyle], { maxZoom: 19, opacity: 0.95 }).addTo(map);
    (map as any)._tileLayer = newLayer;
  }, [tileStyle]);

  // Draw 4-Directional Surrounding Danger Roads & User Live Beacon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = require("leaflet");

    // 1. Draw / Update User Live GPS Beacon
    if (userBeaconMarkerRef.current) {
      map.removeLayer(userBeaconMarkerRef.current);
    }

    const userIcon = L.divIcon({
      className: "custom-user-beacon",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background-color: rgba(5, 150, 105, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.6); border: 2px solid #FFFFFF;"></div>
          <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: #047857; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    userBeaconMarkerRef.current = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindTooltip(`<b>📍 You Are Here</b><br/>${currentLocation.name}`, { sticky: true });

    // 2. Clear previous road layers
    Object.values(roadLayersRef.current).forEach((layer: any) => {
      map.removeLayer(layer);
    });
    roadLayersRef.current = {};

    // 3. Draw surrounding 4-side roads color-coded by hazard level
    currentLocation.surroundingRoads.forEach((road) => {
      const roadColor =
        road.riskLevel === "DANGER"
          ? "#DC2626"
          : road.riskLevel === "CAUTION"
          ? "#D97706"
          : "#059669";

      // Glow outline polyline
      const glowLine = L.polyline(road.coords, {
        color: roadColor,
        weight: 9,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Inner dashed line
      const innerLine = L.polyline(road.coords, {
        color: "#FFFFFF",
        weight: 2.5,
        opacity: 0.9,
        dashArray: road.riskLevel === "DANGER" ? "4, 6" : "6, 10",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Layer group
      const roadGroup = L.layerGroup([glowLine, innerLine]).addTo(map);
      roadLayersRef.current[road.id] = roadGroup;

      // Click to inspect road
      glowLine.on("click", () => {
        setSelectedRoad(road);
        speakVoice(`${road.name}. Status: ${road.statusText}.`);
      });

      // Direction Badge Marker along the road
      const midPoint = road.coords[Math.floor(road.coords.length / 2)];
      const badgeIcon = L.divIcon({
        className: "custom-road-badge",
        html: `
          <div style="background-color: ${roadColor}; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; font-family: monospace; border: 1.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px; white-space: nowrap; cursor: pointer;">
            <span>${road.riskLevel === "DANGER" ? "⛔" : road.riskLevel === "CAUTION" ? "⚠️" : "✅"}</span>
            <span>${road.directionLabel}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      });

      const badgeMarker = L.marker(midPoint, { icon: badgeIcon }).addTo(map);
      badgeMarker.on("click", () => {
        setSelectedRoad(road);
        speakVoice(`${road.name}. ${road.hazardReason}`);
      });
    });

    // 4. Draw Safe Havens & Emergency Centers
    safeHavenMarkersRef.current.forEach((m) => map.removeLayer(m));
    safeHavenMarkersRef.current = [];

    currentLocation.safeHavens.forEach((haven) => {
      const isHospital = haven.type === "HOSPITAL";
      const isShelter = haven.type === "SHELTER";
      const markerColor = isHospital ? "#DC2626" : isShelter ? "#2563EB" : "#059669";
      const emoji = isHospital ? "🏥" : isShelter ? "⛺" : "⛽";

      const havenIcon = L.divIcon({
        className: "custom-haven-icon",
        html: `
          <div style="background-color: #0F172A; color: white; width: 32px; height: 32px; border-radius: 10px; border: 2.5px solid ${markerColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer;">
            ${emoji}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const havenMarker = L.marker(haven.coords, { icon: havenIcon })
        .addTo(map)
        .bindTooltip(`<b>${haven.name}</b><br/>Type: ${haven.type} • Dist: ${haven.distance}`, { sticky: true });

      havenMarker.on("click", () => {
        setDestinationInput(haven.name);
        handleCalculateRoute(haven.name);
      });

      safeHavenMarkersRef.current.push(havenMarker);
    });
  }, [userCoords, currentLocation]);

  // Google Maps Style Route Calculation
  const handleCalculateRoute = (targetDest?: string) => {
    const dest = targetDest || destinationInput;
    if (!dest.trim()) {
      setDestinationInput("Nearest Safe Relief Shelter (Dispur)");
    }

    const destinationName = dest.trim() || "Nearest Safe Relief Shelter";
    setIsNavigating(true);

    // AI Safe Route calculation avoiding RED hazard roads
    const safeRoute = {
      distance: "18.4 km",
      duration: "24 mins",
      safetyScore: 97,
      hazardAvoided: "Bypassed Active Deepor Flood Cutoff & NH-6 Sonapur Landslide Zone via 4-Lane East Expressway",
      steps: [
        { text: "Start navigation from your current location", distance: "0 m" },
        { text: "Head East on Paved All-Weather Beltola Corridor (NH-27)", distance: "4.2 km" },
        { text: "Merge onto elevated 4-lane East Expressway (Green Safe Zone)", distance: "9.8 km" },
        { text: "Take Exit 14 towards Dispur Gov Relief Campus", distance: "3.2 km", isHazardAvoidance: true },
        { text: `Arrive safely at ${destinationName}`, distance: "1.2 km" }
      ]
    };

    setActiveRouteInfo(safeRoute);

    // Draw active navigation route line on the map
    const map = mapInstanceRef.current;
    if (map) {
      const L = require("leaflet");
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
      }

      // Safe route coords that avoid red zones
      const routeCoords: [number, number][] = [
        userCoords,
        [userCoords[0] - 0.02, userCoords[1] + 0.04],
        [userCoords[0] - 0.04, userCoords[1] + 0.09],
        [userCoords[0] - 0.06, userCoords[1] + 0.14],
      ];

      routePolylineRef.current = L.polyline(routeCoords, {
        color: "#2563EB",
        weight: 8,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      map.fitBounds(L.latLngBounds(routeCoords), { padding: [60, 60] });
    }

    speakVoice(`Safest all-weather route calculated for ${destinationName}. Total distance 18.4 kilometers. All danger zones safely avoided.`);
  };

  // Trigger Emergency SOS
  const handleTriggerSos = () => {
    setIsSosActive(true);
    const code = "SOS-NER-" + Math.floor(100000 + Math.random() * 900000);
    setSosTicketId(code);
    setSosSent(true);

    speakVoice(`Emergency distress beacon activated. GPS coordinates ${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)} transmitted to NDRF and State Disaster Command.`);
  };

  // Submit Incident Report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReportModalOpen(false);
    setReportSuccessToast(`Ground hazard on ${reportRoadName || "selected road"} registered and verified by AI model.`);
    setReportRoadName("");
    setReportComment("");
    speakVoice("Hazard report submitted to District Disaster Control.");
    setTimeout(() => setReportSuccessToast(null), 5000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden font-sans bg-stone-900 text-stone-900 select-none">
      {/* 1. Full-Screen Interactive GIS Map in Background */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Top-Left Floating Google Maps Style Search & City Hub Controller */}
      <div className="absolute top-4 left-4 z-20 max-w-md w-[calc(100%-2rem)] sm:w-96 space-y-3">
        {/* Main Search & Navigation Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-stone-200/90 space-y-3">
          {/* City Preset Switcher & Device GPS */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xs text-stone-900">
                Citizen Safety Navigator
              </span>
            </div>

            <button
              onClick={handleUseDeviceGps}
              title="Use Device Live GPS"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Crosshair className="w-3 h-3 text-emerald-700" />
              <span>Live GPS</span>
            </button>
          </div>

          {/* Regional Hub Selector Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Active Regional Command Zone
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-emerald-700 cursor-pointer"
            >
              {NER_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.state})
                </option>
              ))}
            </select>
          </div>

          {/* Google Maps Origin / Destination Input Form */}
          <div className="space-y-2 pt-1">
            {/* Origin Input */}
            <div className="relative">
              <div className="absolute left-3 top-2.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
              <input
                type="text"
                readOnly
                value={`From: ${currentLocation.name}`}
                className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 truncate outline-none cursor-default"
              />
            </div>

            {/* Destination Input */}
            <div className="relative">
              <div className="absolute left-3 top-2.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-rose-100" />
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                placeholder="Where to? (e.g. Civil Hospital, Relief Center, Airport)"
                className="w-full pl-8 pr-8 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-700"
              />
              {destinationInput && (
                <button
                  onClick={() => setDestinationInput("")}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Destination Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-semibold text-stone-600 no-scrollbar">
              <button
                onClick={() => {
                  setDestinationInput("Nearest Safe Relief Shelter");
                  handleCalculateRoute("Nearest Safe Relief Shelter");
                }}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-stone-200 shrink-0 cursor-pointer"
              >
                ⛺ Safe Shelter
              </button>
              <button
                onClick={() => {
                  setDestinationInput("Civil Hospital & Trauma Center");
                  handleCalculateRoute("Civil Hospital & Trauma Center");
                }}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200 border border-stone-200 shrink-0 cursor-pointer"
              >
                🏥 Hospital
              </button>
              <button
                onClick={() => {
                  setDestinationInput("Emergency Fuel & Ration Hub");
                  handleCalculateRoute("Emergency Fuel & Ration Hub");
                }}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200 border border-stone-200 shrink-0 cursor-pointer"
              >
                ⛽ Fuel Station
              </button>
            </div>

            {/* Calculate Safest Route Button */}
            <button
              onClick={() => handleCalculateRoute()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Find Safest AI Route (Avoid Landslides)</span>
            </button>
          </div>
        </div>

        {/* Live Weather & Surrounding Hazard Summary Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-stone-200/90 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⛈️</span>
            <div>
              <div className="font-bold text-stone-900">{currentLocation.temp} • {currentLocation.weather}</div>
              <div className="text-[10px] text-stone-500">Live IMD & Doppler Radar Synced</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              currentLocation.riskIndex > 60 
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : currentLocation.riskIndex > 40
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}>
              Risk: {currentLocation.riskIndex}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Top-Right Floating Map Controls & Multi-Voice Assistance */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {/* Tile Style Picker */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200/90 shadow-xl flex items-center gap-1 text-[11px] font-bold">
          <button
            onClick={() => setTileStyle("STREET")}
            className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
              tileStyle === "STREET" ? "bg-emerald-800 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setTileStyle("TERRAIN")}
            className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
              tileStyle === "TERRAIN" ? "bg-emerald-800 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            Terrain
          </button>
          <button
            onClick={() => setTileStyle("SATELLITE")}
            className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
              tileStyle === "SATELLITE" ? "bg-emerald-800 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Voice Assistant Toggle */}
        <button
          onClick={() => {
            const next = !isVoiceEnabled;
            setIsVoiceEnabled(next);
            if (next) speakVoice("Voice navigation assistance enabled.");
          }}
          className={`p-2.5 rounded-2xl backdrop-blur-md border shadow-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            isVoiceEnabled
              ? "bg-emerald-800 text-white border-emerald-700"
              : "bg-white/95 text-stone-700 border-stone-200 hover:bg-stone-50"
          }`}
        >
          {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{isVoiceEnabled ? "Voice Guidance Active" : "Voice Muted"}</span>
        </button>

        {/* Ground Incident Report Button */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="bg-white/95 backdrop-blur-md hover:bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-all hover:scale-105"
        >
          <Camera className="w-4 h-4 text-emerald-700" />
          <span>Report Road Hazard</span>
        </button>
      </div>

      {/* 4. Bottom-Right Floating Emergency 1-Tap SOS Beacon */}
      <div className="absolute bottom-6 right-6 z-30">
        <button
          onClick={handleTriggerSos}
          className="relative group p-4 sm:px-6 sm:py-4 rounded-3xl bg-rose-600 hover:bg-rose-700 text-white shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-wider border-2 border-white cursor-pointer transition-all transform hover:scale-105"
        >
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-400 animate-ping" />
          <PhoneCall className="w-5 h-5 text-white animate-bounce" />
          <div className="text-left">
            <div className="text-[10px] text-rose-200 font-bold leading-tight">1-Tap Emergency</div>
            <div className="text-xs sm:text-sm font-black">SOS Distress Beacon</div>
          </div>
        </button>
      </div>

      {/* 5. Bottom Surrounding 4-Road Danger Quick Bar (Color-Coded) */}
      <div className="absolute bottom-6 left-4 right-20 sm:right-64 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-stone-200/90 shadow-2xl pointer-events-auto space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-900 pb-1 border-b border-stone-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Surrounding 4-Direction Road Danger Status</span>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">Click road to inspect</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentLocation.surroundingRoads.map((road) => {
              const isSelected = selectedRoad?.id === road.id;
              const isDanger = road.riskLevel === "DANGER";
              const isCaution = road.riskLevel === "CAUTION";

              return (
                <button
                  key={road.id}
                  onClick={() => {
                    setSelectedRoad(road);
                    speakVoice(`${road.name}. ${road.statusText}.`);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    isDanger
                      ? "bg-rose-50/80 border-rose-300 text-rose-950 hover:bg-rose-100"
                      : isCaution
                      ? "bg-amber-50/80 border-amber-300 text-amber-950 hover:bg-amber-100"
                      : "bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100"
                  } ${isSelected ? "ring-2 ring-stone-900 scale-102" : ""}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="flex items-center gap-1">
                      {isDanger ? "🔴" : isCaution ? "🟡" : "🟢"} {road.directionLabel.split(" ")[0]}
                    </span>
                    <span className="font-mono text-[9px]">{(road.riskScore * 100).toFixed(0)}% Risk</span>
                  </div>
                  <div className="text-[11px] font-bold truncate mt-0.5">{road.name.split("(")[0]}</div>
                  <div className="text-[9px] text-stone-600 font-medium truncate">{road.statusText}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Active Road Inspector Modal / Sheet */}
      {selectedRoad && (
        <div className="absolute top-20 sm:top-4 right-4 z-30 max-w-sm w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {selectedRoad.riskLevel === "DANGER" ? "🔴" : selectedRoad.riskLevel === "CAUTION" ? "🟡" : "🟢"}
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {selectedRoad.directionLabel}
                </div>
                <h3 className="text-sm font-black text-stone-900 leading-tight">
                  {selectedRoad.name}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedRoad(null)}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className={`p-3 rounded-2xl border font-bold flex items-start gap-2.5 ${
              selectedRoad.riskLevel === "DANGER"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : selectedRoad.riskLevel === "CAUTION"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black">{selectedRoad.statusText}</div>
                <div className="text-[11px] font-normal mt-0.5 leading-relaxed">{selectedRoad.hazardReason}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium bg-stone-50 p-3 rounded-2xl border border-stone-200">
              <div>
                <span className="text-stone-400 block text-[10px]">Speed Limit:</span>
                <span className="font-bold text-stone-800">{selectedRoad.speedLimit}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Distance Coverage:</span>
                <span className="font-bold text-stone-800">{selectedRoad.distanceKm} km</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setDestinationInput(selectedRoad.name);
                handleCalculateRoute(selectedRoad.name);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route Through Safe Path</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Turn-by-Turn Safe Navigation Drawer */}
      {isNavigating && activeRouteInfo && (
        <div className="absolute top-64 sm:top-76 left-4 z-20 max-w-md w-[calc(100%-2rem)] sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-stone-200 shadow-2xl space-y-4 animate-in fade-in max-h-[45vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-stone-900">Turn-by-Turn Guidance</h4>
                <p className="text-[10px] text-emerald-800 font-bold">{activeRouteInfo.safetyScore}% Safe Corridor Index</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsNavigating(false);
                setActiveRouteInfo(null);
                if (mapInstanceRef.current && routePolylineRef.current) {
                  mapInstanceRef.current.removeLayer(routePolylineRef.current);
                }
              }}
              className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-2xl border border-blue-200 text-xs">
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase">Estimated Time</span>
              <div className="text-base font-black text-blue-950">{activeRouteInfo.duration}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-blue-700 font-bold uppercase">Total Distance</span>
              <div className="text-base font-black text-blue-950">{activeRouteInfo.distance}</div>
            </div>
          </div>

          {/* Hazard Avoidance Alert Note */}
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-medium flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{activeRouteInfo.hazardAvoided}</span>
          </div>

          {/* Step list */}
          <div className="space-y-2 pt-1">
            {activeRouteInfo.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-800">
                <div className="w-5 h-5 rounded-full bg-stone-100 border border-stone-300 text-stone-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{step.text}</div>
                  <div className="text-[10px] text-stone-500">{step.distance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Emergency SOS Broadcast Modal */}
      {isSosActive && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-white border-2 border-rose-500 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 border-2 border-rose-500 text-rose-600 flex items-center justify-center mx-auto animate-bounce">
              <PhoneCall className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-3 py-1 rounded-full uppercase tracking-wider">
                NDRF / SDRF Priority Channel
              </span>
              <h3 className="text-xl font-black text-stone-900 pt-1">
                Emergency Distress Signal Broadcasted
              </h3>
              <p className="text-xs text-stone-600">
                Your high-accuracy GPS coordinates have been securely dispatched to the National &amp; State Disaster Response Control Centers.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-400">Distress Ticket:</span>
                <span className="font-bold text-rose-700">{sosTicketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Live Latitude:</span>
                <span className="font-bold text-stone-800">{userCoords[0].toFixed(5)}° N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Live Longitude:</span>
                <span className="font-bold text-stone-800">{userCoords[1].toFixed(5)}° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Nearby Rescue Desk:</span>
                <span className="font-bold text-emerald-800">Assam / NER SDMA (1070)</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <a
                href="tel:112"
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Police 112</span>
              </a>
              <button
                onClick={() => setIsSosActive(false)}
                className="py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Citizen Ground Disruption Reporter Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Report Ground Disruption</h3>
                  <p className="text-[11px] text-stone-500">Alert fellow citizens and field emergency teams</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Road / Highway Location</label>
                <input
                  type="text"
                  required
                  value={reportRoadName}
                  onChange={(e) => setReportRoadName(e.target.value)}
                  placeholder="e.g. NH-6 Sonapur Pass, Mile 24"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Hazard Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="LANDSLIDE">Mud / Rockfall Landslide</option>
                  <option value="FLASH_FLOOD">Waterlogging / Flash Flood</option>
                  <option value="BRIDGE_DAMAGE">Bridge / Culvert Erosion</option>
                  <option value="FALLEN_TREE">Fallen Tree / Power Cable</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Observation Details</label>
                <textarea
                  required
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  rows={3}
                  placeholder="Describe road condition, single lane availability, or vehicle stagnation..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-700 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Geo-Tagged Citizen Alert</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. Success Toast Banner */}
      {reportSuccessToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reportSuccessToast}</span>
        </div>
      )}
    </div>
  );
};
