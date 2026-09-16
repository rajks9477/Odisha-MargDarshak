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
  Filter,
  CheckCircle2,
  X,
  Radio,
  Brain,
  Truck,
  Phone,
  PhoneCall,
  Send,
  Navigation,
  ShieldCheck,
  AlertOctagon,
  User,
  Zap,
  MapPin,
  ChevronRight,
  Activity,
  Maximize2
} from "lucide-react";
import { NER_STATES, NER_DISTRICTS, NERState } from "@/lib/constants";

export interface HighwayVehicleEntity {
  id: string;
  vehicle_number: string;
  vehicle_type: "FUEL_TANKER" | "HEAVY_TRUCK" | "AMBULANCE" | "RATION_CARRIER" | "CRANE_EXCAVATOR" | "RESCUE_CONVOY";
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
  district: string;
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
  coordinates: [number, number][];
}

// Center coordinates and zooms for States
export const STATE_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  ALL: { center: [26.15, 92.80], zoom: 7 },
  "Arunachal Pradesh": { center: [27.50, 94.00], zoom: 8 },
  Assam: { center: [26.20, 92.90], zoom: 8 },
  Manipur: { center: [24.80, 93.90], zoom: 9 },
  Meghalaya: { center: [25.50, 91.50], zoom: 9 },
  Mizoram: { center: [23.30, 92.80], zoom: 9 },
  Nagaland: { center: [26.15, 94.50], zoom: 9 },
  Sikkim: { center: [27.50, 88.50], zoom: 9 },
  Tripura: { center: [23.80, 91.60], zoom: 9 },
};

// District Center Coordinates, Weather, and Risk Overview
export const DISTRICT_CENTERS: Record<string, { center: [number, number]; zoom: number; weather: string; risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }> = {
  // Assam
  "Kamrup Metropolitan": { center: [26.185, 91.745], zoom: 11, weather: "Partly Cloudy • 28°C", risk: "LOW" },
  "Kamrup": { center: [26.310, 91.600], zoom: 11, weather: "Clear • 29°C", risk: "LOW" },
  "Cachar": { center: [24.833, 92.779], zoom: 11, weather: "Heavy Showers • 25°C", risk: "HIGH" },
  "Dima Hasao": { center: [25.176, 93.018], zoom: 11, weather: "Overcast Mist • 22°C", risk: "LOW" },
  "Nagaon": { center: [26.345, 92.684], zoom: 11, weather: "Light Rain • 27°C", risk: "MEDIUM" },
  "Golaghat": { center: [26.520, 93.970], zoom: 11, weather: "River Rise • 26°C", risk: "HIGH" },
  "Jorhat": { center: [26.750, 94.216], zoom: 11, weather: "Moderate Rain • 26°C", risk: "HIGH" },
  "Dibrugarh": { center: [27.472, 94.912], zoom: 11, weather: "Heavy Monsoons • 24°C", risk: "HIGH" },
  "Tinsukia": { center: [27.500, 95.360], zoom: 11, weather: "Passing Storm • 25°C", risk: "MEDIUM" },
  "Sonitpur": { center: [26.652, 92.793], zoom: 11, weather: "Scattered Rain • 27°C", risk: "LOW" },
  "Morigaon": { center: [26.250, 92.340], zoom: 11, weather: "Clear • 28°C", risk: "LOW" },
  "Hojai": { center: [26.000, 92.850], zoom: 11, weather: "Clear • 28°C", risk: "LOW" },
  "Dhubri": { center: [26.020, 89.980], zoom: 11, weather: "River Mist • 28°C", risk: "LOW" },
  "Goalpara": { center: [26.180, 90.620], zoom: 11, weather: "Clear • 29°C", risk: "LOW" },
  "Karimganj": { center: [24.870, 92.350], zoom: 11, weather: "Monsoon Rain • 25°C", risk: "MEDIUM" },
  "Hailakandi": { center: [24.680, 92.560], zoom: 11, weather: "Rain Squalls • 25°C", risk: "MEDIUM" },
  "Bongaigaon": { center: [26.500, 90.540], zoom: 11, weather: "Clear • 28°C", risk: "LOW" },
  "Kokrajhar": { center: [26.400, 90.270], zoom: 11, weather: "Clear • 28°C", risk: "LOW" },

  // Meghalaya
  "East Khasi Hills": { center: [25.578, 91.893], zoom: 11, weather: "Mountain Fog • 18°C", risk: "LOW" },
  "East Jaintia Hills": { center: [25.105, 92.361], zoom: 11, weather: "Torrential 88mm Rain • 20°C", risk: "CRITICAL" },
  "West Jaintia Hills": { center: [25.446, 92.203], zoom: 11, weather: "Heavy Monsoons • 21°C", risk: "HIGH" },
  "Ri Bhoi": { center: [25.900, 91.880], zoom: 11, weather: "Passing Clouds • 24°C", risk: "LOW" },
  "West Garo Hills": { center: [25.520, 90.220], zoom: 11, weather: "Warm Humid • 27°C", risk: "LOW" },
  "South Garo Hills": { center: [25.300, 90.630], zoom: 11, weather: "Rain Spells • 26°C", risk: "MEDIUM" },

  // Arunachal Pradesh
  "Tawang": { center: [27.586, 91.866], zoom: 11, weather: "Freezing Rain • 4°C", risk: "CRITICAL" },
  "West Kameng": { center: [27.264, 92.416], zoom: 11, weather: "Chilly Slush • 9°C", risk: "HIGH" },
  "East Kameng": { center: [27.300, 93.000], zoom: 11, weather: "Cloudy Hills • 14°C", risk: "MEDIUM" },
  "Papum Pare": { center: [27.100, 93.600], zoom: 11, weather: "Passing Rain • 22°C", risk: "LOW" },
  "Itanagar Capital Complex": { center: [27.084, 93.605], zoom: 11, weather: "Clear Valley • 24°C", risk: "LOW" },
  "East Siang": { center: [28.060, 95.330], zoom: 11, weather: "River Surge • 24°C", risk: "MEDIUM" },
  "Upper Siang": { center: [28.600, 94.900], zoom: 11, weather: "Mountain Rain • 16°C", risk: "HIGH" },
  "Lohit": { center: [27.900, 96.160], zoom: 11, weather: "Clear Mountain • 22°C", risk: "LOW" },
  "Changlang": { center: [27.120, 95.740], zoom: 11, weather: "Scattered Rain • 23°C", risk: "MEDIUM" },

  // Sikkim
  "Gangtok": { center: [27.338, 88.606], zoom: 11, weather: "Continuous Rain • 16°C", risk: "CRITICAL" },
  "Pakyong": { center: [27.230, 88.580], zoom: 11, weather: "Teesta Surge 94mm • 18°C", risk: "CRITICAL" },
  "Mangan": { center: [27.510, 88.530], zoom: 11, weather: "Cloudburst Alert • 12°C", risk: "CRITICAL" },
  "Namchi": { center: [27.170, 88.350], zoom: 11, weather: "Mist & Fog • 17°C", risk: "MEDIUM" },
  "Gyalshing": { center: [27.280, 88.250], zoom: 11, weather: "Cloudy Hills • 15°C", risk: "LOW" },
  "Soreng": { center: [27.160, 88.200], zoom: 11, weather: "Clear Ridge • 17°C", risk: "LOW" },

  // Mizoram
  "Aizawl": { center: [23.730, 92.717], zoom: 11, weather: "Heavy Monsoons • 21°C", risk: "HIGH" },
  "Kolasib": { center: [24.225, 92.678], zoom: 11, weather: "Mud Slush • 23°C", risk: "MEDIUM" },
  "Lunglei": { center: [22.880, 92.740], zoom: 11, weather: "Rain Squalls • 22°C", risk: "MEDIUM" },
  "Champhai": { center: [23.470, 93.320], zoom: 11, weather: "Mountain Mist • 19°C", risk: "LOW" },
  "Mamit": { center: [23.930, 92.480], zoom: 11, weather: "Passing Rain • 24°C", risk: "LOW" },
  "Serchhip": { center: [23.340, 92.850], zoom: 11, weather: "Cloudy • 22°C", risk: "LOW" },

  // Nagaland
  "Kohima": { center: [25.675, 94.108], zoom: 11, weather: "Sinking Fault Active • 18°C", risk: "HIGH" },
  "Dimapur": { center: [25.906, 93.727], zoom: 11, weather: "Light Rain • 27°C", risk: "LOW" },
  "Mokokchung": { center: [26.320, 94.520], zoom: 11, weather: "Mountain Drizzle • 20°C", risk: "MEDIUM" },
  "Mon": { center: [26.750, 95.050], zoom: 11, weather: "Heavy Mist • 19°C", risk: "HIGH" },
  "Wokha": { center: [26.100, 94.260], zoom: 11, weather: "Rain Spells • 22°C", risk: "MEDIUM" },
  "Phek": { center: [25.660, 94.460], zoom: 11, weather: "Overcast • 18°C", risk: "LOW" },

  // Manipur
  "Imphal West": { center: [24.817, 93.936], zoom: 11, weather: "Overcast Valley • 26°C", risk: "MEDIUM" },
  "Imphal East": { center: [24.820, 94.000], zoom: 11, weather: "Passing Clouds • 26°C", risk: "LOW" },
  "Senapati": { center: [25.260, 94.020], zoom: 11, weather: "Hill Slush • 20°C", risk: "HIGH" },
  "Churachandpur": { center: [24.330, 93.680], zoom: 11, weather: "Sinking Slope • 23°C", risk: "HIGH" },
  "Bishnupur": { center: [24.630, 93.760], zoom: 11, weather: "Lake Inundation • 26°C", risk: "MEDIUM" },
  "Thoubal": { center: [24.640, 93.990], zoom: 11, weather: "Clear • 27°C", risk: "LOW" },
  "Ukhrul": { center: [25.110, 94.360], zoom: 11, weather: "Foggy Ridge • 17°C", risk: "MEDIUM" },

  // Tripura
  "West Tripura": { center: [23.831, 91.286], zoom: 11, weather: "Clear • 30°C", risk: "LOW" },
  "North Tripura": { center: [24.370, 92.160], zoom: 11, weather: "Light Rain • 28°C", risk: "LOW" },
  "Dhalai": { center: [23.920, 91.850], zoom: 11, weather: "Scattered Showers • 27°C", risk: "LOW" },
  "Gomati": { center: [23.530, 91.480], zoom: 11, weather: "Clear • 29°C", risk: "LOW" },
  "Khowai": { center: [24.060, 91.600], zoom: 11, weather: "Monsoon Puddles • 28°C", risk: "MEDIUM" },
  "South Tripura": { center: [23.160, 91.500], zoom: 11, weather: "Clear • 30°C", risk: "LOW" },
  "Unakoti": { center: [24.320, 92.010], zoom: 11, weather: "Passing Rain • 28°C", risk: "LOW" },
  "Sepahijala": { center: [23.680, 91.310], zoom: 11, weather: "Clear • 29°C", risk: "LOW" },
};

export const REGIONAL_HIGHWAYS_DATA: HighwayRiskEntity[] = [
  // 1. NH-6 Sonapur Tunnel Mountain Pass (RED - Critical Landslide)
  {
    id: "RD-NH-6-SONAPUR",
    road_number: "NH-6",
    name: "NH-6 Sonapur Tunnel Mountain Pass (Shillong ➔ Silchar)",
    state: "Meghalaya",
    districts_traversed: ["East Jaintia Hills", "West Jaintia Hills", "Cachar", "Ri Bhoi", "East Khasi Hills"],
    risk_level: "CRITICAL",
    risk_score: 84.5,
    disaster_type: "LANDSLIDE_DEBRIS",
    disaster_title: "Severe Mountain Landslide & Heavy Mudflow",
    threat_time_window: "Imminent / Active (Next 2 to 6 Hours)",
    precipitation_mm_24h: 88.5,
    slope_gradient_deg: 36.2,
    soil_saturation_pct: 96,
    historical_failures_count: 7,
    ai_explanation: "Continuous 88.5 mm monsoonal precipitation combined with a 36.2° steep slope has oversaturated the subsoil to 96% capacity, creating high hydrostatic pressure and active slope failure near the tunnel ingress.",
    recommended_action: "Halt multi-axle freight convoys at Jowai and divert emergency light cargo via Umrangso-Haflong bypass.",
    coordinates: [
      [25.578, 91.893], // Shillong
      [25.446, 92.203], // Jowai
      [25.105, 92.361], // Sonapur Tunnel (Landslide Hazard)
      [24.950, 92.650], // Lumshnong
      [24.833, 92.779], // Silchar
    ],
  },
  // 2. NH-37 Brahmaputra Valley & Kaziranga Highway (ORANGE - High Flood Inundation)
  {
    id: "RD-NH-37-KAZIRANGA",
    road_number: "NH-37",
    name: "NH-37 Brahmaputra Valley & Kaziranga Highway",
    state: "Assam",
    districts_traversed: ["Kamrup Metropolitan", "Morigaon", "Nagaon", "Golaghat", "Jorhat", "Dibrugarh", "Tinsukia"],
    risk_level: "HIGH",
    risk_score: 68.0,
    disaster_type: "FLASH_FLOOD_OVERFLOW",
    disaster_title: "Brahmaputra River Inundation & Flash Flood Submergence",
    threat_time_window: "Next 6 to 14 Hours (River Peak Level Approaching)",
    precipitation_mm_24h: 72.0,
    slope_gradient_deg: 4.5,
    soil_saturation_pct: 94,
    historical_failures_count: 4,
    ai_explanation: "Upstream surge from Arunachal foothills is elevating the Brahmaputra water table, causing riverback water overflow onto low-lying road stretches between Bokakhat and Kohora.",
    recommended_action: "Impose 30 km/h speed limit, activate SDRF boat standby at animal crossing corridors, and prepare flood barriers.",
    coordinates: [
      [26.185, 91.745], // Guwahati
      [26.250, 92.340], // Morigaon
      [26.345, 92.684], // Nagaon
      [26.580, 93.170], // Kaziranga
      [26.750, 94.216], // Jorhat
      [27.472, 94.912], // Dibrugarh
      [27.500, 95.360], // Tinsukia
    ],
  },
  // 3. NH-27 East-West Commercial Expressway (GREEN - Clear Low Risk)
  {
    id: "RD-NH-27-EXPRESS",
    road_number: "NH-27",
    name: "NH-27 East-West Commercial Expressway (Guwahati ➔ Lumding)",
    state: "Assam",
    districts_traversed: ["Kamrup Metropolitan", "Kamrup", "Morigaon", "Hojai", "Nagaon"],
    risk_level: "LOW",
    risk_score: 18.0,
    disaster_type: "CLEAR_TRANSIT",
    disaster_title: "Normal All-Weather Smooth Transit",
    threat_time_window: "Safe Transit Window (Next 48 Hours Stable)",
    precipitation_mm_24h: 18.0,
    slope_gradient_deg: 2.1,
    soil_saturation_pct: 35,
    historical_failures_count: 0,
    ai_explanation: "4-lane reinforced elevated embankment with automated culvert drainage operating with zero obstruction.",
    recommended_action: "Maintain standard high-speed logistics dispatch schedules.",
    coordinates: [
      [26.185, 91.745], // Guwahati
      [26.250, 92.340], // Morigaon
      [26.000, 92.850], // Doboka
      [25.750, 93.180], // Lumding
    ],
  },
  // 4. NH-13 Trans-Arunachal & Sela Pass (ORANGE/RED - High Ice/Rockfall)
  {
    id: "RD-NH-13-TAWANG",
    road_number: "NH-13",
    name: "NH-13 Trans-Arunachal Highway & Sela Tunnel (Tezpur ➔ Tawang)",
    state: "Arunachal Pradesh",
    districts_traversed: ["Sonitpur", "West Kameng", "Tawang", "East Kameng", "Papum Pare"],
    risk_level: "CRITICAL",
    risk_score: 82.5,
    disaster_type: "SNOW_ICE_BLOCK",
    disaster_title: "High-Altitude Sela Pass Rockfall & Ice Glaze",
    threat_time_window: "Next 4 to 12 Hours (Night Frost & Slush Drop)",
    precipitation_mm_24h: 54.0,
    slope_gradient_deg: 38.0,
    soil_saturation_pct: 82,
    historical_failures_count: 5,
    ai_explanation: "Sub-zero mountain temperatures combined with wet precipitation have formed black ice on switchbacks approaching Sela Pass tunnel approach, with minor loose boulder movement.",
    recommended_action: "Enforce anti-skid tire chains and deploy BRO snow clearing graders at Jaswant Garh checkpoint.",
    coordinates: [
      [26.652, 92.793], // Tezpur
      [27.264, 92.416], // Bomdila
      [27.502, 92.103], // Sela Pass
      [27.586, 91.866], // Tawang
    ],
  },
  // 5. NH-10 Teesta Valley Lifeline (RED - Critical Bank Erosion)
  {
    id: "RD-NH-10-GANGTOK",
    road_number: "NH-10",
    name: "NH-10 Teesta Valley Mountain Arterial (Siliguri ➔ Gangtok)",
    state: "Sikkim",
    districts_traversed: ["Pakyong", "Gangtok", "Namchi"],
    risk_level: "CRITICAL",
    risk_score: 86.0,
    disaster_type: "FLASH_FLOOD_OVERFLOW",
    disaster_title: "Teesta River Turbulent Overflow & Bank Erosion",
    threat_time_window: "Immediate Alert (Next 1 to 5 Hours)",
    precipitation_mm_24h: 94.0,
    slope_gradient_deg: 41.0,
    soil_saturation_pct: 98,
    historical_failures_count: 8,
    ai_explanation: "Teesta river water level is running 1.4m above warning level near 29th Mile, washing away road embankment toe and threatening severe carriageway collapse.",
    recommended_action: "Total suspension of non-essential civilian vehicles. Divert essential traffic via Lava-Algarah ridge.",
    coordinates: [
      [26.720, 88.420], // Siliguri
      [27.170, 88.530], // Rangpo
      [27.230, 88.580], // Pakyong
      [27.338, 88.606], // Gangtok
    ],
  },
  // 6. NH-306 Southern Arterial Lifeline (YELLOW - Moderate Rain)
  {
    id: "RD-NH-306-AIZAWL",
    road_number: "NH-306",
    name: "NH-306 Southern Arterial Lifeline (Silchar ➔ Aizawl)",
    state: "Mizoram",
    districts_traversed: ["Cachar", "Kolasib", "Aizawl", "Mamit"],
    risk_level: "MEDIUM",
    risk_score: 48.0,
    disaster_type: "TORRENTIAL_RAINFALL",
    disaster_title: "Moderate Hill Slush & Heavy Mountain Downpour",
    threat_time_window: "Next 8 to 18 Hours (Heavy Rainfall Passing)",
    precipitation_mm_24h: 62.0,
    slope_gradient_deg: 26.5,
    soil_saturation_pct: 78,
    historical_failures_count: 3,
    ai_explanation: "Continuous monsoon squall is creating surface mud accumulation near Vairengte checkpost. Road foundation remains stable but braking distance is increased.",
    recommended_action: "Single-lane convoy pacing with mandatory 50-meter separation between fuel tankers.",
    coordinates: [
      [24.833, 92.779], // Silchar
      [24.505, 92.756], // Vairengte
      [24.225, 92.678], // Kolasib
      [23.730, 92.717], // Aizawl
    ],
  },
  // 7. NH-2 Trans-Hills Corridor (ORANGE - Pagala Pahar Sinking Zone)
  {
    id: "RD-NH-2-KOHIMA",
    road_number: "NH-2",
    name: "NH-2 Trans-Hills Corridor (Dimapur ➔ Kohima ➔ Imphal)",
    state: "Nagaland",
    districts_traversed: ["Dimapur", "Kohima", "Senapati", "Imphal West", "Thoubal"],
    risk_level: "HIGH",
    risk_score: 70.0,
    disaster_type: "LANDSLIDE_DEBRIS",
    disaster_title: "Pagala Pahar Sinking Zone & Mud Debris",
    threat_time_window: "Next 3 to 10 Hours (Active Slope Creep)",
    precipitation_mm_24h: 69.0,
    slope_gradient_deg: 33.0,
    soil_saturation_pct: 89,
    historical_failures_count: 6,
    ai_explanation: "Pagala Pahar geological fault line is experiencing localized soil displacement following 69 mm rain, causing road shoulder subsidence.",
    recommended_action: "Deploy SDRF spotters at sinking zones and restrict heavy goods vehicles above 20 tons.",
    coordinates: [
      [25.906, 93.727], // Dimapur
      [25.675, 94.108], // Kohima
      [25.260, 94.020], // Senapati
      [24.817, 93.936], // Imphal
    ],
  },
  // 8. NH-8 Southern Link Corridor (GREEN - Low Risk)
  {
    id: "RD-NH-8-AGARTALA",
    road_number: "NH-8",
    name: "NH-8 Southern Link Corridor (Silchar ➔ Agartala)",
    state: "Tripura",
    districts_traversed: ["North Tripura", "Unakoti", "Dhalai", "Khowai", "West Tripura", "Sepahijala", "South Tripura"],
    risk_level: "LOW",
    risk_score: 22.0,
    disaster_type: "CLEAR_TRANSIT",
    disaster_title: "Low Risk Stable Valley Passage",
    threat_time_window: "Safe Transit Window (Next 36 Hours Stable)",
    precipitation_mm_24h: 24.0,
    slope_gradient_deg: 8.0,
    soil_saturation_pct: 45,
    historical_failures_count: 1,
    ai_explanation: "Widened 2-lane bituminous highway with sound concrete retaining walls and clear water channels.",
    recommended_action: "All freight vehicles cleared for unrestricted transit.",
    coordinates: [
      [24.833, 92.779], // Silchar
      [24.370, 92.160], // Dharmanagar
      [23.920, 91.850], // Ambassa
      [23.831, 91.286], // Agartala
      [23.160, 91.500], // South Tripura
    ],
  },
  // 9. Haflong-Umrangso All-Weather Green Bypass (GREEN - Safe Detour)
  {
    id: "RD-HAFLONG-BYPASS",
    road_number: "SH-Haflong",
    name: "Haflong-Umrangso All-Weather Green Bypass Corridor",
    state: "Assam",
    districts_traversed: ["Dima Hasao", "Cachar", "Karbi Anglong"],
    risk_level: "LOW",
    risk_score: 16.5,
    disaster_type: "CLEAR_TRANSIT",
    disaster_title: "Safe Valley Detour for Blocked NH-6 Freight",
    threat_time_window: "Safe Transit Window (Recommended Alternative)",
    precipitation_mm_24h: 22.0,
    slope_gradient_deg: 12.0,
    soil_saturation_pct: 42,
    historical_failures_count: 0,
    ai_explanation: "Stable geological ridge with deep RCC culverts and zero landslide vulnerability.",
    recommended_action: "Recommended as prime diversion route for all Southern Assam & Mizoram relief convoys.",
    coordinates: [
      [25.510, 92.740], // Umrangso
      [25.176, 93.018], // Haflong
      [24.833, 92.779], // Silchar
    ],
  },
  // 10. NH-102B Imphal - Churachandpur Arterial (ORANGE - Sinking Hill Slope)
  {
    id: "RD-NH-102B-CHURA",
    road_number: "NH-102B",
    name: "NH-102B Imphal ➔ Churachandpur Arterial Highway",
    state: "Manipur",
    districts_traversed: ["Imphal West", "Bishnupur", "Churachandpur"],
    risk_level: "HIGH",
    risk_score: 66.0,
    disaster_type: "LANDSLIDE_DEBRIS",
    disaster_title: "Loktak Basin Waterlogging & Hill Embankment Slump",
    threat_time_window: "Next 5 to 12 Hours (Continuous Drizzle)",
    precipitation_mm_24h: 58.0,
    slope_gradient_deg: 24.0,
    soil_saturation_pct: 86,
    historical_failures_count: 3,
    ai_explanation: "Hill slopes between Bishnupur and Churachandpur border showing tension cracks. Road surface has localized water pooling.",
    recommended_action: "Caution signboards deployed. Night freight convoy restrictions active.",
    coordinates: [
      [24.817, 93.936], // Imphal West
      [24.630, 93.760], // Bishnupur
      [24.330, 93.680], // Churachandpur
    ],
  },
  // 11. SH-Mangan-Lachen North Sikkim Pass (RED - Cloudburst Mudflow)
  {
    id: "RD-SH-MANGAN-LACHEN",
    road_number: "SH-NorthSikkim",
    name: "Mangan ➔ Chungthang ➔ Lachen Frontier Pass",
    state: "Sikkim",
    districts_traversed: ["Mangan", "Gangtok"],
    risk_level: "CRITICAL",
    risk_score: 91.0,
    disaster_type: "LANDSLIDE_DEBRIS",
    disaster_title: "High-Altitude Glacial Stream Overflow & Mudflow",
    threat_time_window: "Active Road Closure (Next 24 Hours)",
    precipitation_mm_24h: 104.0,
    slope_gradient_deg: 44.0,
    soil_saturation_pct: 99,
    historical_failures_count: 9,
    ai_explanation: "Cloudburst runoff has triggered severe debris slide at Chungthang culvert bridge. Heavy machinery mobilized for clearing.",
    recommended_action: "Complete road closure. Army & Border Logistics convoys halted at Mangan.",
    coordinates: [
      [27.338, 88.606], // Gangtok
      [27.510, 88.530], // Mangan
      [27.600, 88.640], // Chungthang
      [27.720, 88.550], // Lachen
    ],
  },
];

export const REGIONAL_ACTIVE_VEHICLES: HighwayVehicleEntity[] = [
  {
    id: "VEH-AS-01-GB-4819",
    vehicle_number: "AS-01-GB-4819",
    vehicle_type: "FUEL_TANKER",
    type_label: "10-Wheeler Petroleum Tanker",
    driver_name: "Biren Das",
    driver_phone: "+91 98640 12345",
    current_road_id: "RD-NH-6-SONAPUR",
    current_road_name: "NH-6 Sonapur Tunnel Mountain Pass",
    cargo: "20,000 Litres High Speed Diesel (IOCL)",
    speed_kmh: 42,
    lat: 25.140,
    lng: 92.340,
    threat_status: "IN_DANGER",
    danger_distance_km: 3.8,
    hazard_ahead_description: "Active Landslide & Mud Debris Blockage at Sonapur Tunnel (3.8 km ahead)",
    state: "Meghalaya",
    district: "East Jaintia Hills",
  },
  {
    id: "VEH-AS-11-BC-3042",
    vehicle_number: "AS-11-BC-3042",
    vehicle_type: "HEAVY_TRUCK",
    type_label: "14-Wheeler Essential Grain Carrier",
    driver_name: "Rajesh Kalita",
    driver_phone: "+91 94350 78901",
    current_road_id: "RD-NH-37-KAZIRANGA",
    current_road_name: "NH-37 Kaziranga Brahmaputra Highway",
    cargo: "25 Metric Tonnes Rice (FCI Depot)",
    speed_kmh: 52,
    lat: 26.540,
    lng: 93.120,
    threat_status: "APPROACHING_HAZARD",
    danger_distance_km: 11.4,
    hazard_ahead_description: "Brahmaputra River Overtopping & Waterlogging (11.4 km ahead)",
    state: "Assam",
    district: "Golaghat",
  },
  {
    id: "VEH-AR-01-M-9081",
    vehicle_number: "AR-01-M-9081",
    vehicle_type: "HEAVY_TRUCK",
    type_label: "All-Terrain Mountain Cargo Carrier",
    driver_name: "Tashi Norbu",
    driver_phone: "+91 94360 45678",
    current_road_id: "RD-NH-13-TAWANG",
    current_road_name: "NH-13 Trans-Arunachal & Sela Pass",
    cargo: "Medical Gas Cylinders & High-Altitude Ration",
    speed_kmh: 34,
    lat: 27.460,
    lng: 92.140,
    threat_status: "APPROACHING_HAZARD",
    danger_distance_km: 6.2,
    hazard_ahead_description: "Sub-zero Black Ice Glaze & Rockfall Risk (6.2 km ahead)",
    state: "Arunachal Pradesh",
    district: "Tawang",
  },
  {
    id: "VEH-SK-01-P-5511",
    vehicle_number: "SK-01-P-5511",
    vehicle_type: "FUEL_TANKER",
    type_label: "LPG Bulk Cryogenic Tanker",
    driver_name: "Pema Bhutia",
    driver_phone: "+91 98320 88776",
    current_road_id: "RD-NH-10-GANGTOK",
    current_road_name: "NH-10 Teesta Valley Lifeline",
    cargo: "14 MT Liquid Petroleum Gas (Indane)",
    speed_kmh: 28,
    lat: 27.190,
    lng: 88.540,
    threat_status: "IN_DANGER",
    danger_distance_km: 2.1,
    hazard_ahead_description: "Teesta River 29th Mile Embankment Washout (2.1 km ahead)",
    state: "Sikkim",
    district: "Pakyong",
  },
  {
    id: "VEH-MZ-01-A-4422",
    vehicle_number: "MZ-01-A-4422",
    vehicle_type: "AMBULANCE",
    type_label: "Advanced Life Support Ambulance",
    driver_name: "Lalhmingthanga",
    driver_phone: "+91 98620 54321",
    current_road_id: "RD-NH-306-AIZAWL",
    current_road_name: "NH-306 Southern Arterial",
    cargo: "Emergency Patient Transit & Plasma Units",
    speed_kmh: 58,
    lat: 24.320,
    lng: 92.690,
    threat_status: "SAFE",
    danger_distance_km: 0,
    hazard_ahead_description: "Moderate hill rain - clear transit with caution",
    state: "Mizoram",
    district: "Kolasib",
  },
  {
    id: "VEH-NL-07-C-1290",
    vehicle_number: "NL-07-C-1290",
    vehicle_type: "RATION_CARRIER",
    type_label: "Multi-Axle Supply Truck",
    driver_name: "Kevichusa Angami",
    driver_phone: "+91 94360 11223",
    current_road_id: "RD-NH-2-KOHIMA",
    current_road_name: "NH-2 Trans-Hills Corridor",
    cargo: "Essential Baby Food & Medical Supplies",
    speed_kmh: 38,
    lat: 25.540,
    lng: 94.080,
    threat_status: "APPROACHING_HAZARD",
    danger_distance_km: 5.5,
    hazard_ahead_description: "Pagala Pahar Sinking Zone Soil Displacement (5.5 km ahead)",
    state: "Nagaland",
    district: "Kohima",
  },
  {
    id: "VEH-AS-01-X-8800",
    vehicle_number: "AS-01-X-8800",
    vehicle_type: "CRANE_EXCAVATOR",
    type_label: "PWD Heavy Hydraulic Crane & Clearer",
    driver_name: "Hemanta Bora",
    driver_phone: "+91 98640 99001",
    current_road_id: "RD-HAFLONG-BYPASS",
    current_road_name: "Haflong-Umrangso Green Bypass",
    cargo: "Disaster Road Clearance Gear & Earthmovers",
    speed_kmh: 30,
    lat: 25.220,
    lng: 92.980,
    threat_status: "SAFE",
    danger_distance_km: 0,
    hazard_ahead_description: "All-weather bypass clear and secure",
    state: "Assam",
    district: "Dima Hasao",
  },
  {
    id: "VEH-AS-01-K-7712",
    vehicle_number: "AS-01-K-7712",
    vehicle_type: "RESCUE_CONVOY",
    type_label: "SDRF Disaster Response Fleet Van",
    driver_name: "Manoj Sharma",
    driver_phone: "+91 94350 44556",
    current_road_id: "RD-NH-27-EXPRESS",
    current_road_name: "NH-27 East-West Expressway",
    cargo: "Inflatable Rescue Boats & De-watering Pumps",
    speed_kmh: 68,
    lat: 26.160,
    lng: 91.800,
    threat_status: "SAFE",
    danger_distance_km: 0,
    hazard_ahead_description: "4-lane expressway clear high speed transit",
    state: "Assam",
    district: "Kamrup Metropolitan",
  },
  {
    id: "VEH-TR-01-T-3321",
    vehicle_number: "TR-01-T-3321",
    vehicle_type: "HEAVY_TRUCK",
    type_label: "Tripura State Lifeline Freight Truck",
    driver_name: "Biplab Debbarma",
    driver_phone: "+91 98630 11998",
    current_road_id: "RD-NH-8-AGARTALA",
    current_road_name: "NH-8 Southern Link Corridor",
    cargo: "Essential Pharmaceutical Syrups & Tablets",
    speed_kmh: 54,
    lat: 23.860,
    lng: 91.320,
    threat_status: "SAFE",
    danger_distance_km: 0,
    hazard_ahead_description: "Bituminous highway clear with good visibility",
    state: "Tripura",
    district: "West Tripura",
  },
  {
    id: "VEH-MN-01-I-6644",
    vehicle_number: "MN-01-I-6644",
    vehicle_type: "RATION_CARRIER",
    type_label: "Hill Route Cargo Carrier",
    driver_name: "Tomba Singh",
    driver_phone: "+91 98560 33221",
    current_road_id: "RD-NH-102B-CHURA",
    current_road_name: "NH-102B Imphal-Churachandpur Road",
    cargo: "Dry Rations & Water Purification Kits",
    speed_kmh: 36,
    lat: 24.550,
    lng: 93.740,
    threat_status: "APPROACHING_HAZARD",
    danger_distance_km: 4.8,
    hazard_ahead_description: "Tension cracks on road shoulder & water puddles",
    state: "Manipur",
    district: "Churachandpur",
  },
];

export const CentralAdminRegionalRiskMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const vehicleMarkersRef = useRef<any[]>([]);

  // State & District interactive filters
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [mapStyle, setMapStyle] = useState<"LIGHT" | "TERRAIN" | "SATELLITE">("LIGHT");

  const [selectedHighway, setSelectedHighway] = useState<HighwayRiskEntity | null>(REGIONAL_HIGHWAYS_DATA[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<HighwayVehicleEntity | null>(null);
  const [voiceSpeaking, setVoiceSpeaking] = useState<boolean>(false);

  // Call & Message simulation states
  const [activeCallDriver, setActiveCallDriver] = useState<HighwayVehicleEntity | null>(null);
  const [callDurationSec, setCallDurationSec] = useState<number>(0);
  const [dispatchAlertLog, setDispatchAlertLog] = useState<string[]>([]);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Available districts for chosen state
  const availableDistricts = React.useMemo(() => {
    if (selectedState === "ALL") {
      const all: string[] = [];
      Object.values(NER_DISTRICTS).forEach((distList) => {
        distList.forEach((d) => {
          if (!all.includes(d)) all.push(d);
        });
      });
      return all.sort();
    }
    return (NER_DISTRICTS as any)[selectedState] || [];
  }, [selectedState]);

  // Filter highways based on State, District, and Risk
  const filteredHighways = React.useMemo(() => {
    return REGIONAL_HIGHWAYS_DATA.filter((hw) => {
      // State match
      if (selectedState !== "ALL" && !hw.state.includes(selectedState)) {
        const stateDistricts = (NER_DISTRICTS as any)[selectedState] || [];
        const hasStateDistrict = hw.districts_traversed.some((d) => stateDistricts.includes(d));
        if (!hasStateDistrict) return false;
      }
      // District match
      if (selectedDistrict !== "ALL") {
        const matchesDistrict = hw.districts_traversed.some((d) =>
          d.toLowerCase().includes(selectedDistrict.toLowerCase())
        );
        if (!matchesDistrict) return false;
      }
      // Risk filter
      if (filterRisk !== "ALL" && hw.risk_level !== filterRisk) return false;

      return true;
    });
  }, [selectedState, selectedDistrict, filterRisk]);

  // Filter vehicles based on State and District
  const filteredVehicles = React.useMemo(() => {
    return REGIONAL_ACTIVE_VEHICLES.filter((v) => {
      if (selectedState !== "ALL" && !v.state.includes(selectedState)) return false;
      if (selectedDistrict !== "ALL" && !v.district.toLowerCase().includes(selectedDistrict.toLowerCase())) return false;
      return true;
    });
  }, [selectedState, selectedDistrict]);

  // Current District KPI & Context Metadata
  const currentDistrictMeta = React.useMemo(() => {
    if (selectedDistrict !== "ALL" && DISTRICT_CENTERS[selectedDistrict]) {
      return DISTRICT_CENTERS[selectedDistrict];
    }
    return null;
  }, [selectedDistrict]);

  // Handle State Change
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedDistrict("ALL");
    setSelectedVehicle(null);

    const map = mapInstanceRef.current;
    if (map) {
      const stateMeta = STATE_CENTERS[stateName] || STATE_CENTERS.ALL;
      map.flyTo(stateMeta.center, stateMeta.zoom, { duration: 1.2 });
    }
  };

  // Handle District Change
  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    setSelectedVehicle(null);

    const map = mapInstanceRef.current;
    if (map) {
      if (districtName !== "ALL" && DISTRICT_CENTERS[districtName]) {
        const distMeta = DISTRICT_CENTERS[districtName];
        map.flyTo(distMeta.center, distMeta.zoom, { duration: 1.2 });
      } else if (selectedState !== "ALL" && STATE_CENTERS[selectedState]) {
        const stateMeta = STATE_CENTERS[selectedState];
        map.flyTo(stateMeta.center, stateMeta.zoom, { duration: 1.2 });
      } else {
        map.flyTo(STATE_CENTERS.ALL.center, STATE_CENTERS.ALL.zoom, { duration: 1.2 });
      }
    }
  };

  // Voice AI speech advisory
  const speakRiskAdvisory = (hw: HighwayRiskEntity) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const speechText = `Central Command Disaster Advisory on ${hw.name}. The AI prediction model detects a ${hw.risk_level} risk of ${hw.disaster_title}. Threat window: ${hw.threat_time_window}. Monsoonal precipitation: ${hw.precipitation_mm_24h} millimeters, slope gradient: ${hw.slope_gradient_deg} degrees, and soil saturation at ${hw.soil_saturation_pct} percent. Recommended Action: ${hw.recommended_action}`;

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

  // Initialize Map with Clean OpenStreetMap Tiles (NO API KEY WATERMARK)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: [26.15, 92.80],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
    });

    // High quality reliable tile URLs with 0 watermarks
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

  // Update Tile Layer on Style change
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

    // 1. Draw Highway Polylines with Color Coded Danger Levels
    filteredHighways.forEach((hw) => {
      const isSelected = selectedHighway?.id === hw.id;

      // Color based on risk level
      let color = "#10B981"; // GREEN - Safe
      if (hw.risk_level === "CRITICAL") color = "#EF4444"; // RED - Critical Landslide / Block
      else if (hw.risk_level === "HIGH") color = "#EA580C"; // ORANGE - Mud / Flood
      else if (hw.risk_level === "MEDIUM") color = "#F59E0B"; // YELLOW - Rain Caution

      const weight = isSelected ? 8 : 5;
      const opacity = isSelected ? 1.0 : 0.75;

      const polyline = L.polyline(hw.coordinates, {
        color: color,
        weight: weight,
        opacity: opacity,
        lineJoin: "round",
      }).addTo(map);

      // Glowing pulse line for critical roads
      if (hw.risk_level === "CRITICAL") {
        const glowLine = L.polyline(hw.coordinates, {
          color: "#EF4444",
          weight: 12,
          opacity: 0.25,
          lineJoin: "round",
        }).addTo(map);
        polylinesRef.current.push(glowLine);
      }

      polyline.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <b style="color: #0F172A; font-size: 12px;">${hw.road_number}: ${hw.name}</b><br/>
          <b>State/Districts:</b> ${hw.districts_traversed.join(", ")}<br/>
          <b>Risk Status:</b> <span style="color:${color}; font-weight:800;">${hw.risk_level} (${hw.risk_score}/100)</span><br/>
          <b>Hazard:</b> ${hw.disaster_title}<br/>
          <b>Threat Window:</b> ${hw.threat_time_window}<br/>
          <i style="color:#047857; font-weight: bold;">Click road to hear AI explanation & action plan</i>
        </div>`,
        { sticky: true }
      );

      polyline.on("click", () => {
        setSelectedHighway(hw);
        setSelectedVehicle(null);
        speakRiskAdvisory(hw);
      });

      polylinesRef.current.push(polyline);
    });

    // 2. Draw Live Active Vehicle Markers on the Roads
    filteredVehicles.forEach((veh) => {
      const isSelectedVeh = selectedVehicle?.id === veh.id;
      const isDanger = veh.threat_status === "IN_DANGER";
      const isWarning = veh.threat_status === "APPROACHING_HAZARD";

      const badgeBg = isDanger ? "#EF4444" : isWarning ? "#EA580C" : "#10B981";

      const vehIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${isDanger ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background-color: rgba(239,68,68,0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
            <div style="background-color: #1E293B; color: white; width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid ${badgeBg}; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">
              ${veh.vehicle_type === "FUEL_TANKER" ? "⛽" : veh.vehicle_type === "AMBULANCE" ? "🚑" : veh.vehicle_type === "CRANE_EXCAVATOR" ? "🚜" : veh.vehicle_type === "RESCUE_CONVOY" ? "🛡️" : "🚚"}
            </div>
            <div style="position: absolute; bottom: -9px; background-color: ${badgeBg}; color: white; font-size: 8px; font-weight: 800; font-family: monospace; padding: 1px 4px; border-radius: 4px; border: 1px solid white; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${veh.vehicle_number.split("-")[1] || veh.vehicle_number}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const vehMarker = L.marker([veh.lat, veh.lng], { icon: vehIcon }).addTo(map);

      vehMarker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <b>${veh.vehicle_number} (${veh.type_label})</b><br/>
          <b>Driver:</b> ${veh.driver_name} (${veh.driver_phone})<br/>
          <b>Location:</b> ${veh.district}, ${veh.state}<br/>
          <b>Road:</b> ${veh.current_road_name}<br/>
          <b>Speed:</b> <span style="color:#047857; font-weight:bold;">${veh.speed_kmh} km/h</span><br/>
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
    });
  }, [filteredHighways, filteredVehicles, selectedHighway, selectedVehicle]);

  return (
    <div className="space-y-4 font-sans text-stone-900">
      {/* 1. STATE & DISTRICT SELECTION BAR */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  NER Command GIS Map &amp; Spatial Risk Intelligence
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                  Live Telemetry Active
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Select any of the 8 North Eastern States &amp; Districts to zoom into localized highway hazard grids and active vehicle intercepts.
              </p>
            </div>
          </div>

          {/* Quick Reset Button */}
          {(selectedState !== "ALL" || selectedDistrict !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSelectedState("ALL");
                setSelectedDistrict("ALL");
                const map = mapInstanceRef.current;
                if (map) map.flyTo(STATE_CENTERS.ALL.center, STATE_CENTERS.ALL.zoom, { duration: 1.2 });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Regional View (All 8 States)</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          {/* 1. State Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-emerald-800" />
              <span>1. Select State:</span>
            </label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-all"
              >
                <option value="ALL">🌐 All 8 NER States (Regional Overview)</option>
                {NER_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. District Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Navigation className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Select District:</span>
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-all"
              >
                <option value="ALL">
                  {selectedState === "ALL" ? "All Districts across NER" : `All Districts in ${selectedState}`}
                </option>
                {availableDistricts.map((dist: string) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Risk Level Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-rose-700" />
              <span>3. Filter Danger Severity:</span>
            </label>
            <div className="relative">
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-all"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">🔴 Critical Landslide / Bridge Block (&gt;75%)</option>
                <option value="HIGH">🟠 High Mud / Flood Hazard (50-75%)</option>
                <option value="MEDIUM">🟡 Moderate Rain Caution (25-50%)</option>
                <option value="LOW">🟢 Clear All-Weather Transit (&lt;25%)</option>
              </select>
            </div>
          </div>

          {/* 4. Active Area Summary Pill */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-teal-700" />
              <span>Active Scope Telemetry:</span>
            </label>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs flex items-center justify-between font-mono">
              <span className="font-bold text-emerald-950 truncate">
                {selectedDistrict !== "ALL" ? selectedDistrict : selectedState !== "ALL" ? selectedState : "All NER"}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 shrink-0">
                {filteredHighways.length} Roads • {filteredVehicles.length} Trucks
              </span>
            </div>
          </div>
        </div>

        {/* Selected District Real-Time Weather & Geological Risk Alert Banner */}
        {currentDistrictMeta && (
          <div className="p-3 rounded-2xl bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold">District Focus: {selectedDistrict} ({selectedState})</span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-300">Weather: {currentDistrictMeta.weather}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentDistrictMeta.risk === "CRITICAL"
                  ? "bg-rose-600 text-white"
                  : currentDistrictMeta.risk === "HIGH"
                  ? "bg-orange-600 text-white"
                  : currentDistrictMeta.risk === "MEDIUM"
                  ? "bg-amber-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}>
                {currentDistrictMeta.risk} RISK ZONE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {dispatchSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* 2. Main Grid: Map (Left) + Right Diagnosis / Fleet Intercept Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive GIS Map */}
        <div className="lg:col-span-7 h-[540px] lg:h-[680px] relative rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-0" />

          {/* Map Layer Selector (Top Left) */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200 shadow-md flex items-center gap-1 text-[11px] font-semibold text-stone-700">
            <button
              type="button"
              onClick={() => setMapStyle("LIGHT")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "LIGHT" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100"
              }`}
            >
              Street (OSM)
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("TERRAIN")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapStyle === "TERRAIN" ? "bg-emerald-800 text-white font-bold shadow-xs" : "hover:bg-stone-100"
              }`}
            >
              Terrain Topo
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

          {/* Road Risk Color Legend (Bottom Left) */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200 shadow-xl text-xs space-y-2 max-w-xs">
            <div className="font-bold text-stone-900 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-800" />
                <span>Highway Danger Color Legend</span>
              </div>
              <span className="text-[9px] font-mono text-stone-500">Live AI</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-medium text-stone-700">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                <span>🟢 Safe (&lt;25%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-amber-500 rounded-full shrink-0" />
                <span>🟡 Rain Caution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-orange-500 rounded-full shrink-0" />
                <span>🟠 High Mud Hazard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-rose-500 rounded-full shrink-0" />
                <span>🔴 Critical Landslide</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-stone-200 text-stone-900 font-semibold">
                <span className="text-sm">⛽🚚🚑</span>
                <span>Active Convoys (Click to Call/Halt)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Risk Diagnostics OR Selected Vehicle Command Drawer */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. If A Vehicle Is Selected -> Show Fleet Intercept & Stop Action */}
          {selectedVehicle ? (
            <div className="bg-white border-2 border-emerald-800 rounded-3xl p-5 shadow-xl space-y-4 font-sans animate-in fade-in">
              <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs bg-stone-900 text-white">
                      {selectedVehicle.vehicle_number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                      selectedVehicle.threat_status === "IN_DANGER"
                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                        : selectedVehicle.threat_status === "APPROACHING_HAZARD"
                        ? "bg-orange-100 text-orange-900 border border-orange-300"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    }`}>
                      {selectedVehicle.threat_status === "IN_DANGER" ? "🔴 IN DANGER ZONE" : selectedVehicle.threat_status === "APPROACHING_HAZARD" ? "🟠 APPROACHING HAZARD" : "🟢 NORMAL TRANSIT"}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-stone-900 mt-1.5">
                    {selectedVehicle.type_label}
                  </h3>
                  <div className="text-xs text-stone-500 font-medium">
                    District: <span className="font-bold text-stone-800">{selectedVehicle.district}, {selectedVehicle.state}</span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Road: <span className="font-semibold text-emerald-900">{selectedVehicle.current_road_name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Driver & Telemetry Details */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Assigned Driver</div>
                  <div className="font-bold text-stone-900 mt-0.5">{selectedVehicle.driver_name}</div>
                  <div className="font-mono text-[11px] text-stone-600">{selectedVehicle.driver_phone}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Speed &amp; Cargo</div>
                  <div className="font-mono font-black text-emerald-800 text-sm mt-0.5">{selectedVehicle.speed_kmh} km/h</div>
                  <div className="text-[10px] text-stone-600 truncate">{selectedVehicle.cargo}</div>
                </div>
              </div>

              {/* Threat Alert Warning */}
              {selectedVehicle.threat_status !== "SAFE" && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
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
                  Emergency Intercept Orders:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartCall(selectedVehicle)}
                    className="w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver 📞</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendHaltOrder(selectedVehicle)}
                    className="w-full py-2.5 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Send HALT Order 🚨</span>
                  </button>
                </div>
              </div>
            </div>
          ) : selectedHighway ? (
            /* 2. Otherwise Show Road AI Diagnostics */
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4 font-sans animate-in fade-in">
              {/* Highway Header & Audio Speak */}
              <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs bg-stone-100 text-stone-800 border border-stone-200">
                      {selectedHighway.road_number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
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
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 mt-1">
                    {selectedHighway.name}
                  </h3>
                  <div className="text-[11px] text-stone-500 font-medium">
                    State / Districts: <span className="text-stone-800 font-semibold">{selectedHighway.districts_traversed.join(", ")}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => (voiceSpeaking ? stopVoice() : speakRiskAdvisory(selectedHighway))}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    voiceSpeaking
                      ? "bg-rose-100 border-rose-300 text-rose-800 animate-pulse"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100"
                  }`}
                  title={voiceSpeaking ? "Stop AI Voice" : "Hear AI Disaster Advisory"}
                >
                  {voiceSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Disaster Alert Box */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <ShieldAlert className={`w-4 h-4 ${
                      selectedHighway.risk_level === "CRITICAL" ? "text-rose-600" : "text-amber-600"
                    }`} />
                    <span>{selectedHighway.disaster_title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 font-semibold">
                    {selectedHighway.threat_time_window}
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  {selectedHighway.ai_explanation}
                </p>
              </div>

              {/* Sensor & ML Prediction Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-center gap-1 text-blue-700 text-[10px] font-semibold">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>24h Rain</span>
                  </div>
                  <div className="font-mono font-bold text-stone-900 text-sm mt-0.5">
                    {selectedHighway.precipitation_mm_24h} mm
                  </div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-center gap-1 text-amber-700 text-[10px] font-semibold">
                    <Mountain className="w-3.5 h-3.5" />
                    <span>Slope</span>
                  </div>
                  <div className="font-mono font-bold text-stone-900 text-sm mt-0.5">
                    {selectedHighway.slope_gradient_deg}°
                  </div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-center gap-1 text-emerald-800 text-[10px] font-semibold">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Soil Saturation</span>
                  </div>
                  <div className="font-mono font-bold text-stone-900 text-sm mt-0.5">
                    {selectedHighway.soil_saturation_pct}%
                  </div>
                </div>
              </div>

              {/* Government Recommended Action Plan */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
                  <Brain className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Central Command Recommended Standard Operating Procedure (SOP):</span>
                </div>
                <p className="text-emerald-900 text-[11px] leading-relaxed font-medium">
                  {selectedHighway.recommended_action}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500 text-xs space-y-2">
              <Compass className="w-8 h-8 mx-auto text-stone-300" />
              <p className="font-semibold text-stone-700">Select any highway road line or vehicle marker on the map to inspect live data.</p>
            </div>
          )}

          {/* Active Incident Log Stream */}
          {dispatchAlertLog.length > 0 && (
            <div className="bg-stone-900 text-white rounded-3xl p-4 space-y-2 text-xs font-mono shadow-md animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[11px]">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Live Dispatch Transmission Log</span>
                </div>
                <span className="text-[9px] text-stone-400">{dispatchAlertLog.length} Sent</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5 text-[10px] text-stone-300 pr-1">
                {dispatchAlertLog.map((log, idx) => (
                  <div key={idx} className="p-1.5 rounded-lg bg-stone-800/80 border border-stone-700">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Live Call Modal */}
      {activeCallDriver && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white border border-stone-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-900 text-emerald-200 flex items-center justify-center mx-auto ring-8 ring-emerald-900/40 animate-pulse">
              <PhoneCall className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
                Live Dispatch Connected
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {activeCallDriver.driver_name}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {activeCallDriver.driver_phone} • {activeCallDriver.vehicle_number}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Location: {activeCallDriver.district}, {activeCallDriver.state}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-stone-800/80 border border-stone-700 text-xs font-mono text-stone-300">
              Call Duration: {Math.floor(callDurationSec / 60)}:{(callDurationSec % 60).toString().padStart(2, "0")}
            </div>

            <button
              type="button"
              onClick={() => setActiveCallDriver(null)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              End Call 📵
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
