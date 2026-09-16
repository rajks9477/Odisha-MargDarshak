"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
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

// State Center Coordinates & Zooms
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

// Comprehensive District Center Coordinates, Weather, and Geological Risk Profiles
export const DISTRICT_CENTERS: Record<string, { center: [number, number]; zoom: number; weather: string; risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; roadCode: string }> = {
  // --- Arunachal Pradesh (26 Districts) ---
  "Tawang": { center: [27.586, 91.866], zoom: 11, weather: "Freezing Rain • 4°C", risk: "CRITICAL", roadCode: "NH-13" },
  "West Kameng": { center: [27.264, 92.416], zoom: 11, weather: "Chilly Slush • 9°C", risk: "HIGH", roadCode: "NH-13" },
  "East Kameng": { center: [27.300, 93.000], zoom: 11, weather: "Cloudy Hills • 14°C", risk: "MEDIUM", roadCode: "SH-Seppa" },
  "Papum Pare": { center: [27.100, 93.600], zoom: 11, weather: "Passing Rain • 22°C", risk: "LOW", roadCode: "NH-415" },
  "Kurung Kumey": { center: [27.900, 93.350], zoom: 11, weather: "Hill Fog • 13°C", risk: "HIGH", roadCode: "SH-Koloriang" },
  "Kra Daadi": { center: [27.750, 93.700], zoom: 11, weather: "Mountain Showers • 15°C", risk: "MEDIUM", roadCode: "SH-Palin" },
  "Lower Subansiri": { center: [27.550, 93.830], zoom: 11, weather: "Mist & Drizzle • 16°C", risk: "MEDIUM", roadCode: "NH-13" },
  "Upper Subansiri": { center: [28.000, 94.150], zoom: 11, weather: "Heavy Showers • 16°C", risk: "HIGH", roadCode: "SH-Daporijo" },
  "West Siang": { center: [28.250, 94.650], zoom: 11, weather: "Cloudy Mist • 18°C", risk: "MEDIUM", roadCode: "NH-515" },
  "East Siang": { center: [28.060, 95.330], zoom: 11, weather: "River Surge • 24°C", risk: "MEDIUM", roadCode: "NH-515" },
  "Siang": { center: [28.300, 95.000], zoom: 11, weather: "Continuous Rain • 17°C", risk: "HIGH", roadCode: "SH-Pangin" },
  "Upper Siang": { center: [28.600, 94.900], zoom: 11, weather: "Mountain Rain • 16°C", risk: "HIGH", roadCode: "SH-Yingkiong" },
  "Lower Siang": { center: [27.800, 94.800], zoom: 11, weather: "Scattered Rain • 21°C", risk: "MEDIUM", roadCode: "NH-515" },
  "Lower Dibang Valley": { center: [28.150, 95.840], zoom: 11, weather: "Heavy Monsoons • 20°C", risk: "HIGH", roadCode: "NH-115" },
  "Dibang Valley": { center: [28.800, 95.900], zoom: 11, weather: "High Mountain Rain • 11°C", risk: "CRITICAL", roadCode: "SH-Anini" },
  "Anjaw": { center: [28.000, 96.800], zoom: 11, weather: "Border Ridge Fog • 12°C", risk: "CRITICAL", roadCode: "NH-113" },
  "Lohit": { center: [27.900, 96.160], zoom: 11, weather: "Clear Mountain • 22°C", risk: "LOW", roadCode: "NH-115" },
  "Namsai": { center: [27.670, 95.860], zoom: 11, weather: "Partly Cloudy • 26°C", risk: "LOW", roadCode: "NH-52" },
  "Changlang": { center: [27.120, 95.740], zoom: 11, weather: "Scattered Rain • 23°C", risk: "MEDIUM", roadCode: "NH-215" },
  "Tirap": { center: [27.000, 95.500], zoom: 11, weather: "Hill Fog • 21°C", risk: "MEDIUM", roadCode: "NH-215" },
  "Longding": { center: [26.850, 95.300], zoom: 11, weather: "Heavy Squalls • 22°C", risk: "HIGH", roadCode: "SH-Longding" },
  "Kamle": { center: [27.600, 94.000], zoom: 11, weather: "Rain Spells • 19°C", risk: "MEDIUM", roadCode: "SH-Raga" },
  "Pakke Kessang": { center: [27.150, 93.200], zoom: 11, weather: "Drizzle • 20°C", risk: "MEDIUM", roadCode: "SH-Pakke" },
  "Shi Yomi": { center: [28.500, 94.300], zoom: 11, weather: "Glacial Rain • 9°C", risk: "CRITICAL", roadCode: "SH-Tato" },
  "Leparada": { center: [27.900, 94.500], zoom: 11, weather: "Overcast Mist • 18°C", risk: "MEDIUM", roadCode: "NH-13" },
  "Itanagar Capital Complex": { center: [27.084, 93.605], zoom: 11, weather: "Clear Valley • 24°C", risk: "LOW", roadCode: "NH-415" },

  // --- Assam (35 Districts) ---
  "Kamrup Metropolitan": { center: [26.185, 91.745], zoom: 11, weather: "Partly Cloudy • 28°C", risk: "LOW", roadCode: "NH-27" },
  "Kamrup": { center: [26.310, 91.600], zoom: 11, weather: "Clear • 29°C", risk: "LOW", roadCode: "NH-27" },
  "Cachar": { center: [24.833, 92.779], zoom: 11, weather: "Heavy Showers • 25°C", risk: "HIGH", roadCode: "NH-6" },
  "Dima Hasao": { center: [25.176, 93.018], zoom: 11, weather: "Overcast Mist • 22°C", risk: "LOW", roadCode: "SH-Haflong" },
  "Nagaon": { center: [26.345, 92.684], zoom: 11, weather: "Light Rain • 27°C", risk: "MEDIUM", roadCode: "NH-37" },
  "Golaghat": { center: [26.520, 93.970], zoom: 11, weather: "River Rise • 26°C", risk: "HIGH", roadCode: "NH-37" },
  "Jorhat": { center: [26.750, 94.216], zoom: 11, weather: "Moderate Rain • 26°C", risk: "HIGH", roadCode: "NH-37" },
  "Dibrugarh": { center: [27.472, 94.912], zoom: 11, weather: "Heavy Monsoons • 24°C", risk: "HIGH", roadCode: "NH-37" },
  "Tinsukia": { center: [27.500, 95.360], zoom: 11, weather: "Passing Storm • 25°C", risk: "MEDIUM", roadCode: "NH-37" },
  "Sonitpur": { center: [26.652, 92.793], zoom: 11, weather: "Scattered Rain • 27°C", risk: "LOW", roadCode: "NH-15" },
  "Morigaon": { center: [26.250, 92.340], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-37" },
  "Hojai": { center: [26.000, 92.850], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-27" },
  "Dhubri": { center: [26.020, 89.980], zoom: 11, weather: "River Mist • 28°C", risk: "LOW", roadCode: "NH-17" },
  "Goalpara": { center: [26.180, 90.620], zoom: 11, weather: "Clear • 29°C", risk: "LOW", roadCode: "NH-17" },
  "Karimganj": { center: [24.870, 92.350], zoom: 11, weather: "Monsoon Rain • 25°C", risk: "MEDIUM", roadCode: "NH-8" },
  "Hailakandi": { center: [24.680, 92.560], zoom: 11, weather: "Rain Squalls • 25°C", risk: "MEDIUM", roadCode: "NH-154" },
  "Bongaigaon": { center: [26.500, 90.540], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-27" },
  "Kokrajhar": { center: [26.400, 90.270], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-27" },
  "Baksa": { center: [26.650, 91.350], zoom: 11, weather: "Clear Foothills • 27°C", risk: "LOW", roadCode: "SH-Baksa" },
  "Barpeta": { center: [26.320, 91.000], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-127" },
  "Biswanath": { center: [26.730, 93.150], zoom: 11, weather: "Passing Rain • 26°C", risk: "MEDIUM", roadCode: "NH-15" },
  "Charaideo": { center: [26.950, 94.900], zoom: 11, weather: "Light Rain • 25°C", risk: "LOW", roadCode: "SH-Sonari" },
  "Chirang": { center: [26.550, 90.500], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-27" },
  "Darrang": { center: [26.450, 92.030], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-15" },
  "Dhemaji": { center: [27.480, 94.580], zoom: 11, weather: "River Surge • 24°C", risk: "HIGH", roadCode: "NH-15" },
  "Karbi Anglong": { center: [26.000, 93.400], zoom: 11, weather: "Hill Mist • 24°C", risk: "MEDIUM", roadCode: "NH-29" },
  "Lakhimpur": { center: [27.230, 94.100], zoom: 11, weather: "Monsoon Surge • 24°C", risk: "HIGH", roadCode: "NH-15" },
  "Majuli": { center: [26.950, 94.200], zoom: 11, weather: "Brahmaputra Crest • 25°C", risk: "HIGH", roadCode: "SH-Majuli" },
  "Nalbari": { center: [26.450, 91.440], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-27" },
  "Sivasagar": { center: [26.980, 94.630], zoom: 11, weather: "Drizzle • 26°C", risk: "MEDIUM", roadCode: "NH-37" },
  "South Salmara-Mankachar": { center: [25.850, 89.850], zoom: 11, weather: "River Rain • 27°C", risk: "MEDIUM", roadCode: "SH-Mankachar" },
  "Udalguri": { center: [26.740, 92.100], zoom: 11, weather: "Clear • 27°C", risk: "LOW", roadCode: "SH-Udalguri" },
  "West Karbi Anglong": { center: [25.800, 92.600], zoom: 11, weather: "Hill Drizzle • 23°C", risk: "MEDIUM", roadCode: "SH-Hamren" },
  "Bajali": { center: [26.500, 91.200], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "NH-27" },
  "Tamulpur": { center: [26.600, 91.550], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "SH-Tamulpur" },

  // --- Meghalaya (12 Districts) ---
  "East Khasi Hills": { center: [25.578, 91.893], zoom: 11, weather: "Mountain Fog • 18°C", risk: "LOW", roadCode: "NH-6" },
  "East Jaintia Hills": { center: [25.105, 92.361], zoom: 11, weather: "Torrential 88mm Rain • 20°C", risk: "CRITICAL", roadCode: "NH-6" },
  "West Jaintia Hills": { center: [25.446, 92.203], zoom: 11, weather: "Heavy Monsoons • 21°C", risk: "HIGH", roadCode: "NH-6" },
  "Ri Bhoi": { center: [25.900, 91.880], zoom: 11, weather: "Passing Clouds • 24°C", risk: "LOW", roadCode: "NH-6" },
  "West Garo Hills": { center: [25.520, 90.220], zoom: 11, weather: "Warm Humid • 27°C", risk: "LOW", roadCode: "NH-51" },
  "South Garo Hills": { center: [25.300, 90.630], zoom: 11, weather: "Rain Spells • 26°C", risk: "MEDIUM", roadCode: "NH-62" },
  "East Garo Hills": { center: [25.600, 90.580], zoom: 11, weather: "Drizzle • 25°C", risk: "MEDIUM", roadCode: "NH-51" },
  "Eastern West Khasi Hills": { center: [25.550, 91.450], zoom: 11, weather: "Foggy Mist • 19°C", risk: "MEDIUM", roadCode: "SH-Mairang" },
  "North Garo Hills": { center: [25.900, 90.550], zoom: 11, weather: "Clear • 27°C", risk: "LOW", roadCode: "SH-Resubelpara" },
  "South West Garo Hills": { center: [25.450, 89.900], zoom: 11, weather: "Clear • 28°C", risk: "LOW", roadCode: "SH-Ampati" },
  "South West Khasi Hills": { center: [25.350, 91.300], zoom: 11, weather: "Heavy Mountain Squall • 19°C", risk: "HIGH", roadCode: "SH-Mawkyrwat" },
  "West Khasi Hills": { center: [25.520, 91.250], zoom: 11, weather: "Mist • 20°C", risk: "MEDIUM", roadCode: "NH-106" },

  // --- Sikkim (6 Districts) ---
  "Gangtok": { center: [27.338, 88.606], zoom: 11, weather: "Continuous Rain • 16°C", risk: "CRITICAL", roadCode: "NH-10" },
  "Pakyong": { center: [27.230, 88.580], zoom: 11, weather: "Teesta Surge 94mm • 18°C", risk: "CRITICAL", roadCode: "NH-10" },
  "Mangan": { center: [27.510, 88.530], zoom: 11, weather: "Cloudburst Alert • 12°C", risk: "CRITICAL", roadCode: "SH-NorthSikkim" },
  "Namchi": { center: [27.170, 88.350], zoom: 11, weather: "Mist & Fog • 17°C", risk: "MEDIUM", roadCode: "SH-Namchi" },
  "Gyalshing": { center: [27.280, 88.250], zoom: 11, weather: "Cloudy Hills • 15°C", risk: "LOW", roadCode: "SH-Gyalshing" },
  "Soreng": { center: [27.160, 88.200], zoom: 11, weather: "Clear Ridge • 17°C", risk: "LOW", roadCode: "SH-Soreng" },

  // --- Mizoram (11 Districts) ---
  "Aizawl": { center: [23.730, 92.717], zoom: 11, weather: "Heavy Monsoons • 21°C", risk: "HIGH", roadCode: "NH-306" },
  "Kolasib": { center: [24.225, 92.678], zoom: 11, weather: "Mud Slush • 23°C", risk: "MEDIUM", roadCode: "NH-306" },
  "Lunglei": { center: [22.880, 92.740], zoom: 11, weather: "Rain Squalls • 22°C", risk: "MEDIUM", roadCode: "NH-54" },
  "Champhai": { center: [23.470, 93.320], zoom: 11, weather: "Mountain Mist • 19°C", risk: "LOW", roadCode: "NH-6" },
  "Mamit": { center: [23.930, 92.480], zoom: 11, weather: "Passing Rain • 24°C", risk: "LOW", roadCode: "SH-Mamit" },
  "Serchhip": { center: [23.340, 92.850], zoom: 11, weather: "Cloudy • 22°C", risk: "LOW", roadCode: "NH-54" },
  "Hnahthial": { center: [22.960, 92.930], zoom: 11, weather: "Overcast • 21°C", risk: "MEDIUM", roadCode: "SH-Hnahthial" },
  "Khawzawl": { center: [23.530, 93.180], zoom: 11, weather: "Mist • 20°C", risk: "LOW", roadCode: "SH-Khawzawl" },
  "Lawngtlai": { center: [22.520, 92.890], zoom: 11, weather: "Heavy Rain • 22°C", risk: "HIGH", roadCode: "NH-54" },
  "Saitual": { center: [23.680, 92.970], zoom: 11, weather: "Clear • 22°C", risk: "LOW", roadCode: "SH-Saitual" },
  "Siaha": { center: [22.480, 92.980], zoom: 11, weather: "Monsoon Showers • 22°C", risk: "HIGH", roadCode: "SH-Siaha" },

  // --- Nagaland (16 Districts) ---
  "Kohima": { center: [25.675, 94.108], zoom: 11, weather: "Sinking Fault Active • 18°C", risk: "HIGH", roadCode: "NH-2" },
  "Dimapur": { center: [25.906, 93.727], zoom: 11, weather: "Light Rain • 27°C", risk: "LOW", roadCode: "NH-29" },
  "Mokokchung": { center: [26.320, 94.520], zoom: 11, weather: "Mountain Drizzle • 20°C", risk: "MEDIUM", roadCode: "NH-702" },
  "Mon": { center: [26.750, 95.050], zoom: 11, weather: "Heavy Mist • 19°C", risk: "HIGH", roadCode: "SH-Mon" },
  "Wokha": { center: [26.100, 94.260], zoom: 11, weather: "Rain Spells • 22°C", risk: "MEDIUM", roadCode: "NH-2" },
  "Phek": { center: [25.660, 94.460], zoom: 11, weather: "Overcast • 18°C", risk: "LOW", roadCode: "SH-Phek" },
  "Chümoukedima": { center: [25.780, 93.770], zoom: 11, weather: "Clear • 27°C", risk: "LOW", roadCode: "NH-29" },
  "Kiphire": { center: [25.860, 94.780], zoom: 11, weather: "Hill Fog • 19°C", risk: "HIGH", roadCode: "SH-Kiphire" },
  "Longleng": { center: [26.470, 94.810], zoom: 11, weather: "Mud Squalls • 20°C", risk: "HIGH", roadCode: "SH-Longleng" },
  "Niuland": { center: [25.950, 93.850], zoom: 11, weather: "Clear • 27°C", risk: "LOW", roadCode: "SH-Niuland" },
  "Noklak": { center: [26.200, 95.000], zoom: 11, weather: "Ridge Drizzle • 17°C", risk: "HIGH", roadCode: "SH-Noklak" },
  "Peren": { center: [25.510, 93.730], zoom: 11, weather: "Passing Clouds • 22°C", risk: "MEDIUM", roadCode: "SH-Peren" },
  "Shamator": { center: [26.050, 94.880], zoom: 11, weather: "Heavy Showers • 19°C", risk: "HIGH", roadCode: "SH-Shamator" },
  "Tseminyü": { center: [25.920, 94.210], zoom: 11, weather: "Mist • 21°C", risk: "MEDIUM", roadCode: "NH-2" },
  "Tuensang": { center: [26.280, 94.830], zoom: 11, weather: "Heavy Mist • 18°C", risk: "HIGH", roadCode: "SH-Tuensang" },
  "Zünheboto": { center: [25.970, 94.520], zoom: 11, weather: "Fog • 19°C", risk: "MEDIUM", roadCode: "SH-Zunheboto" },

  // --- Manipur (16 Districts) ---
  "Imphal West": { center: [24.817, 93.936], zoom: 11, weather: "Overcast Valley • 26°C", risk: "MEDIUM", roadCode: "NH-2" },
  "Imphal East": { center: [24.820, 94.000], zoom: 11, weather: "Passing Clouds • 26°C", risk: "LOW", roadCode: "NH-2" },
  "Senapati": { center: [25.260, 94.020], zoom: 11, weather: "Hill Slush • 20°C", risk: "HIGH", roadCode: "NH-2" },
  "Churachandpur": { center: [24.330, 93.680], zoom: 11, weather: "Sinking Slope • 23°C", risk: "HIGH", roadCode: "NH-102B" },
  "Bishnupur": { center: [24.630, 93.760], zoom: 11, weather: "Lake Inundation • 26°C", risk: "MEDIUM", roadCode: "NH-102B" },
  "Thoubal": { center: [24.640, 93.990], zoom: 11, weather: "Clear • 27°C", risk: "LOW", roadCode: "NH-102" },
  "Ukhrul": { center: [25.110, 94.360], zoom: 11, weather: "Foggy Ridge • 17°C", risk: "MEDIUM", roadCode: "NH-202" },
  "Chandel": { center: [24.320, 94.000], zoom: 11, weather: "Hill Mud • 23°C", risk: "HIGH", roadCode: "NH-102" },
  "Jiribam": { center: [24.800, 93.120], zoom: 11, weather: "River Flash • 25°C", risk: "HIGH", roadCode: "NH-37" },
  "Kakching": { center: [24.480, 93.980], zoom: 11, weather: "Clear • 27°C", risk: "LOW", roadCode: "SH-Kakching" },
  "Kamjong": { center: [24.850, 94.500], zoom: 11, weather: "Border Rain • 19°C", risk: "HIGH", roadCode: "SH-Kamjong" },
  "Kangpokpi": { center: [25.150, 93.970], zoom: 11, weather: "Slope Creep • 21°C", risk: "HIGH", roadCode: "NH-2" },
  "Noney": { center: [24.800, 93.600], zoom: 11, weather: "Landslide Alert 82mm • 21°C", risk: "CRITICAL", roadCode: "NH-37" },
  "Pherzawl": { center: [24.250, 93.200], zoom: 11, weather: "Mountain Showers • 22°C", risk: "HIGH", roadCode: "SH-Pherzawl" },
  "Tamenglong": { center: [25.000, 93.500], zoom: 11, weather: "Heavy Mudflow • 19°C", risk: "CRITICAL", roadCode: "NH-37" },
  "Tengnoupal": { center: [24.380, 94.150], zoom: 11, weather: "Border Fog • 22°C", risk: "HIGH", roadCode: "NH-102" },

  // --- Tripura (8 Districts) ---
  "West Tripura": { center: [23.831, 91.286], zoom: 11, weather: "Clear • 30°C", risk: "LOW", roadCode: "NH-8" },
  "North Tripura": { center: [24.370, 92.160], zoom: 11, weather: "Light Rain • 28°C", risk: "LOW", roadCode: "NH-8" },
  "Dhalai": { center: [23.920, 91.850], zoom: 11, weather: "Scattered Showers • 27°C", risk: "LOW", roadCode: "NH-8" },
  "Gomati": { center: [23.530, 91.480], zoom: 11, weather: "Clear • 29°C", risk: "LOW", roadCode: "NH-8" },
  "Khowai": { center: [24.060, 91.600], zoom: 11, weather: "Monsoon Puddles • 28°C", risk: "MEDIUM", roadCode: "NH-8" },
  "South Tripura": { center: [23.160, 91.500], zoom: 11, weather: "Clear • 30°C", risk: "LOW", roadCode: "NH-8" },
  "Unakoti": { center: [24.320, 92.010], zoom: 11, weather: "Passing Rain • 28°C", risk: "LOW", roadCode: "NH-8" },
  "Sepahijala": { center: [23.680, 91.310], zoom: 11, weather: "Clear • 29°C", risk: "LOW", roadCode: "NH-8" },
};

// State Vehicle Plate Prefixes and Sample Drivers
const STATE_PLATE_PREFIX: Record<string, string> = {
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Sikkim": "SK",
  "Tripura": "TR",
};

const SAMPLE_DRIVERS: Record<string, { name: string; phone: string }[]> = {
  "Arunachal Pradesh": [
    { name: "Tashi Norbu", phone: "+91 94360 12001" },
    { name: "Dorjee Khandu", phone: "+91 94360 45678" },
    { name: "Wangdi Lama", phone: "+91 94360 99881" },
  ],
  "Assam": [
    { name: "Biren Das", phone: "+91 98640 12345" },
    { name: "Rajesh Kalita", phone: "+91 94350 78901" },
    { name: "Hemanta Bora", phone: "+91 98640 99001" },
  ],
  "Manipur": [
    { name: "Tomba Singh", phone: "+91 98560 33221" },
    { name: "Ibomcha Meitei", phone: "+91 98560 44112" },
    { name: "Haokip Thangboi", phone: "+91 98560 55889" },
  ],
  "Meghalaya": [
    { name: "Kyrmenlang Dkhar", phone: "+91 98630 44551" },
    { name: "Pynskhem Marak", phone: "+91 98630 77112" },
    { name: "Banrap Lyngdoh", phone: "+91 98630 88223" },
  ],
  "Mizoram": [
    { name: "Lalhmingthanga", phone: "+91 98620 54321" },
    { name: "Zosangliana", phone: "+91 98620 99002" },
    { name: "Vanlalrema", phone: "+91 98620 33441" },
  ],
  "Nagaland": [
    { name: "Kevichusa Angami", phone: "+91 94360 11223" },
    { name: "Imotemsu Ao", phone: "+91 94360 77889" },
    { name: "Chubameren Jamir", phone: "+91 94360 99441" },
  ],
  "Sikkim": [
    { name: "Pema Bhutia", phone: "+91 98320 88776" },
    { name: "Sonam Lepcha", phone: "+91 98320 44112" },
    { name: "Karma Tshering", phone: "+91 98320 55667" },
  ],
  "Tripura": [
    { name: "Biplab Debbarma", phone: "+91 98630 11998" },
    { name: "Subrata Roy", phone: "+91 98630 33445" },
    { name: "Ratan Jamatia", phone: "+91 98630 55667" },
  ],
};

// Helper: Generate dynamic Roads and Vehicles for any state/district
export function generateScopeRoadsAndVehicles(stateName: string, districtName: string): { roads: HighwayRiskEntity[]; vehicles: HighwayVehicleEntity[] } {
  const roads: HighwayRiskEntity[] = [];
  const vehicles: HighwayVehicleEntity[] = [];

  // Determine target districts
  let targetDistricts: { name: string; state: string }[] = [];

  if (districtName !== "ALL") {
    // Single district selected
    const st = stateName !== "ALL" ? stateName : Object.keys(NER_DISTRICTS).find((s) => (NER_DISTRICTS as any)[s].includes(districtName)) || "Assam";
    targetDistricts.push({ name: districtName, state: st });
  } else if (stateName !== "ALL") {
    // Whole state selected: include all its districts
    const distList = (NER_DISTRICTS as any)[stateName] || [];
    distList.forEach((d: string) => targetDistricts.push({ name: d, state: stateName }));
  } else {
    // All NER: pick 12 representative districts across all 8 states
    const sample = ["East Jaintia Hills", "Kamrup Metropolitan", "Golaghat", "Tawang", "Gangtok", "Mangan", "Aizawl", "Kohima", "Churachandpur", "West Tripura", "Dima Hasao", "Papum Pare"];
    sample.forEach((d) => {
      const st = Object.keys(NER_DISTRICTS).find((s) => (NER_DISTRICTS as any)[s].includes(d)) || "Assam";
      targetDistricts.push({ name: d, state: st });
    });
  }

  // Build roads and vehicles for each target district
  targetDistricts.forEach((td, dIdx) => {
    const meta = DISTRICT_CENTERS[td.name] || {
      center: [26.15 + (dIdx % 4) * 0.4, 92.80 + (dIdx % 5) * 0.4] as [number, number],
      zoom: 11,
      weather: "Monsoon Rain • 24°C",
      risk: (dIdx % 4 === 0 ? "CRITICAL" : dIdx % 4 === 1 ? "HIGH" : dIdx % 4 === 2 ? "MEDIUM" : "LOW") as any,
      roadCode: "NH-" + (10 + (dIdx % 30)),
    };

    const [cLat, cLng] = meta.center;
    const roadId = `RD-${td.name.toUpperCase().replace(/\s+/g, "-")}-MAIN`;
    const roadCode = meta.roadCode;

    // Build 2 roads per district:
    // 1. Primary Arterial (North-South / Ridge Transit)
    const riskScore = meta.risk === "CRITICAL" ? 88.5 : meta.risk === "HIGH" ? 68.0 : meta.risk === "MEDIUM" ? 45.0 : 18.0;
    const precip = meta.risk === "CRITICAL" ? 92.0 : meta.risk === "HIGH" ? 65.0 : meta.risk === "MEDIUM" ? 38.0 : 14.0;
    const slope = meta.risk === "CRITICAL" ? 38.5 : meta.risk === "HIGH" ? 31.0 : meta.risk === "MEDIUM" ? 18.0 : 6.5;
    const soilSat = meta.risk === "CRITICAL" ? 96 : meta.risk === "HIGH" ? 88 : meta.risk === "MEDIUM" ? 64 : 32;

    const disasterTitle =
      meta.risk === "CRITICAL"
        ? "Active Mountain Landslide & Highway Blockage"
        : meta.risk === "HIGH"
        ? "River Surge & Embankment Erosion Hazard"
        : meta.risk === "MEDIUM"
        ? "Torrential Monsoon Slush & Braking Caution"
        : "Clear All-Weather High-Speed Transit";

    const aiExp =
      meta.risk === "CRITICAL"
        ? `Sustained ${precip}mm rainfall combined with ${slope}° slope gradient has saturated soil to ${soilSat}%, triggering active slope displacement near the district mountain pass.`
        : meta.risk === "HIGH"
        ? `Elevated water table and continuous precipitation (${precip}mm) creating road shoulder slippage and localized waterlogging.`
        : meta.risk === "MEDIUM"
        ? `Moderate rainfall (${precip}mm) with surface runoff. Road foundation remains stable with 15% increased braking distances.`
        : `Elevated 2/4-lane bituminous highway with active automated drainage and zero structural vulnerabilities.`;

    const actionSOP =
      meta.risk === "CRITICAL"
        ? "Impose immediate emergency halt on heavy freight convoys; deploy SDRF and PWD clearing bulldozers."
        : meta.risk === "HIGH"
        ? "Restrict transit to single-lane single-file convoys; limit speeds to 30 km/h with 50m vehicle spacing."
        : meta.risk === "MEDIUM"
        ? "Maintain standard daytime transit speeds with headlights enabled; monitor water level gauges."
        : "Standard operational transit approved for all civilian and commercial freight.";

    // Coords for main road
    const mainCoords: [number, number][] = [
      [cLat - 0.09, cLng - 0.08],
      [cLat - 0.04, cLng - 0.03],
      [cLat, cLng],
      [cLat + 0.05, cLng + 0.04],
      [cLat + 0.10, cLng + 0.08],
    ];

    roads.push({
      id: roadId,
      road_number: roadCode,
      name: `${roadCode} ${td.name} Lifeline Arterial Highway`,
      state: td.state,
      districts_traversed: [td.name],
      risk_level: meta.risk,
      risk_score: riskScore,
      disaster_type: meta.risk === "CRITICAL" ? "LANDSLIDE_DEBRIS" : meta.risk === "HIGH" ? "FLASH_FLOOD_OVERFLOW" : meta.risk === "MEDIUM" ? "TORRENTIAL_RAINFALL" : "CLEAR_TRANSIT",
      disaster_title: disasterTitle,
      threat_time_window: meta.risk === "CRITICAL" ? "Next 2 to 6 Hours (Immediate Action)" : meta.risk === "HIGH" ? "Next 6 to 14 Hours" : "Safe Transit Window (48 Hours)",
      precipitation_mm_24h: precip,
      slope_gradient_deg: slope,
      soil_saturation_pct: soilSat,
      historical_failures_count: meta.risk === "CRITICAL" ? 7 : meta.risk === "HIGH" ? 4 : 1,
      ai_explanation: aiExp,
      recommended_action: actionSOP,
      coordinates: mainCoords,
    });

    // 2. Secondary Cross-Connector Road (if district is focused or in state view)
    if (districtName !== "ALL" || targetDistricts.length <= 8) {
      const secRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = meta.risk === "CRITICAL" ? "HIGH" : meta.risk === "HIGH" ? "MEDIUM" : "LOW";
      const secCoords: [number, number][] = [
        [cLat + 0.06, cLng - 0.09],
        [cLat + 0.02, cLng - 0.04],
        [cLat, cLng],
        [cLat - 0.03, cLng + 0.05],
        [cLat - 0.07, cLng + 0.09],
      ];

      roads.push({
        id: `${roadId}-CROSS`,
        road_number: `SH-${td.name.substring(0, 4).toUpperCase()}`,
        name: `${td.name} Regional Green Bypass & Collector Corridor`,
        state: td.state,
        districts_traversed: [td.name],
        risk_level: secRisk,
        risk_score: secRisk === "HIGH" ? 58.0 : secRisk === "MEDIUM" ? 35.0 : 15.0,
        disaster_type: secRisk === "HIGH" ? "FLASH_FLOOD_OVERFLOW" : "CLEAR_TRANSIT",
        disaster_title: secRisk === "HIGH" ? "River Basin Drainage Inundation" : "Safe Detour Alternative Route",
        threat_time_window: "Next 12 to 24 Hours",
        precipitation_mm_24h: precip * 0.7,
        slope_gradient_deg: Math.max(3, slope * 0.6),
        soil_saturation_pct: Math.max(25, soilSat * 0.7),
        historical_failures_count: 0,
        ai_explanation: `Secondary feeder corridor with stable retaining walls providing alternative transit through ${td.name}.`,
        recommended_action: "Recommended secondary bypass if primary arterial experiences bottlenecking.",
        coordinates: secCoords,
      });
    }

    // Generate Vehicles for this district
    const platePrefix = STATE_PLATE_PREFIX[td.state] || "NER";
    const drivers = SAMPLE_DRIVERS[td.state] || [
      { name: "Rajesh Kumar", phone: "+91 94350 11223" },
      { name: "Devendra Das", phone: "+91 98640 44556" },
    ];
    const driver1 = drivers[dIdx % drivers.length];
    const driver2 = drivers[(dIdx + 1) % drivers.length];

    // Vehicle 1: Freight / Tanker on main road
    const isDanger1 = meta.risk === "CRITICAL";
    const isWarning1 = meta.risk === "HIGH";
    vehicles.push({
      id: `VEH-${platePrefix}-${(dIdx + 1).toString().padStart(2, "0")}-A-${1000 + dIdx * 37}`,
      vehicle_number: `${platePrefix}-${(dIdx + 1).toString().padStart(2, "0")}-A-${1000 + dIdx * 37}`,
      vehicle_type: dIdx % 3 === 0 ? "FUEL_TANKER" : dIdx % 3 === 1 ? "HEAVY_TRUCK" : "RATION_CARRIER",
      type_label: dIdx % 3 === 0 ? "20,000L Petroleum Fuel Tanker" : dIdx % 3 === 1 ? "14-Wheeler Essential Grain Carrier" : "High-Altitude Ration Convoy",
      driver_name: driver1.name,
      driver_phone: driver1.phone,
      current_road_id: roadId,
      current_road_name: `${roadCode} ${td.name} Lifeline Arterial`,
      cargo: dIdx % 3 === 0 ? "20,000 Litres Diesel (IOCL Depot)" : "25 MT Food Grains (FCI Transit)",
      speed_kmh: isDanger1 ? 32 : isWarning1 ? 44 : 58,
      lat: cLat + (isDanger1 ? 0.02 : 0.04),
      lng: cLng + (isDanger1 ? 0.015 : 0.035),
      threat_status: isDanger1 ? "IN_DANGER" : isWarning1 ? "APPROACHING_HAZARD" : "SAFE",
      danger_distance_km: isDanger1 ? 2.4 : isWarning1 ? 6.8 : 0,
      hazard_ahead_description: isDanger1
        ? `Active Landslide & Slope Mudflow (2.4 km ahead in ${td.name})`
        : isWarning1
        ? `River Surge Waterlogging & Soil Subsidence (6.8 km ahead)`
        : "Route is stable and all-weather clear.",
      state: td.state,
      district: td.name,
    });

    // Vehicle 2: Emergency / SDRF / Patrol on secondary route
    const isDanger2 = meta.risk === "CRITICAL";
    vehicles.push({
      id: `VEH-${platePrefix}-${(dIdx + 1).toString().padStart(2, "0")}-E-${2000 + dIdx * 43}`,
      vehicle_number: `${platePrefix}-${(dIdx + 1).toString().padStart(2, "0")}-E-${2000 + dIdx * 43}`,
      vehicle_type: dIdx % 2 === 0 ? "AMBULANCE" : "RESCUE_CONVOY",
      type_label: dIdx % 2 === 0 ? "Advanced Life Support Ambulance" : "SDRF Disaster Quick-Response Fleet",
      driver_name: driver2.name,
      driver_phone: driver2.phone,
      current_road_id: `${roadId}-CROSS`,
      current_road_name: `${td.name} Green Collector Bypass`,
      cargo: dIdx % 2 === 0 ? "Emergency Medical Transit & Oxygen" : "Disaster Relief Kits & Water Pumps",
      speed_kmh: 52,
      lat: cLat - 0.025,
      lng: cLng + 0.03,
      threat_status: isDanger2 ? "APPROACHING_HAZARD" : "SAFE",
      danger_distance_km: isDanger2 ? 5.1 : 0,
      hazard_ahead_description: isDanger2 ? "Approaching rain-affected junction" : "Clear Transit",
      state: td.state,
      district: td.name,
    });
  });

  return { roads, vehicles };
}

export const CentralAdminRegionalRiskMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const vehicleMarkersRef = useRef<any[]>([]);

  // State & District interactive filters
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [mapStyle, setMapStyle] = useState<"LIGHT" | "TERRAIN" | "SATELLITE">("LIGHT");

  // Dynamic roads & vehicles generation based on selected scope
  const { roads: scopeRoads, vehicles: scopeVehicles } = useMemo(() => {
    return generateScopeRoadsAndVehicles(selectedState, selectedDistrict);
  }, [selectedState, selectedDistrict]);

  // Filtered lists with danger severity filter
  const filteredHighways = useMemo(() => {
    if (filterRisk === "ALL") return scopeRoads;
    return scopeRoads.filter((r) => r.risk_level === filterRisk);
  }, [scopeRoads, filterRisk]);

  const filteredVehicles = useMemo(() => {
    return scopeVehicles;
  }, [scopeVehicles]);

  const [selectedHighway, setSelectedHighway] = useState<HighwayRiskEntity | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<HighwayVehicleEntity | null>(null);
  const [voiceSpeaking, setVoiceSpeaking] = useState<boolean>(false);

  // Call & Message simulation states
  const [activeCallDriver, setActiveCallDriver] = useState<HighwayVehicleEntity | null>(null);
  const [callDurationSec, setCallDurationSec] = useState<number>(0);
  const [dispatchAlertLog, setDispatchAlertLog] = useState<string[]>([]);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Available districts for chosen state
  const availableDistricts = useMemo(() => {
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

  // Current District KPI & Context Metadata
  const currentDistrictMeta = useMemo(() => {
    if (selectedDistrict !== "ALL" && DISTRICT_CENTERS[selectedDistrict]) {
      return DISTRICT_CENTERS[selectedDistrict];
    }
    return null;
  }, [selectedDistrict]);

  // Auto-select primary highway when scope changes
  useEffect(() => {
    if (filteredHighways.length > 0) {
      // Prefer a critical or high risk road, or first road
      const prime = filteredHighways.find((r) => r.risk_level === "CRITICAL") || filteredHighways.find((r) => r.risk_level === "HIGH") || filteredHighways[0];
      setSelectedHighway(prime);
    }
    setSelectedVehicle(null);
  }, [selectedState, selectedDistrict, filterRisk]);

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
      minZoom: 5,
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
      const opacity = isSelected ? 1.0 : 0.85;

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
          weight: 14,
          opacity: 0.3,
          lineJoin: "round",
        }).addTo(map);
        polylinesRef.current.push(glowLine);
      }

      polyline.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <b style="color: #0F172A; font-size: 12px;">${hw.road_number}: ${hw.name}</b><br/>
          <b>State/Districts:</b> ${hw.districts_traversed.join(", ")} (${hw.state})<br/>
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
              ${veh.vehicle_number.split("-")[0] || "TRUCK"}-${veh.vehicle_number.split("-")[1] || "01"}
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
        const relatedHw = scopeRoads.find((h) => h.id === veh.current_road_id);
        if (relatedHw) setSelectedHighway(relatedHw);
      });

      vehicleMarkersRef.current.push(vehMarker);
    });
  }, [filteredHighways, filteredVehicles, selectedHighway, selectedVehicle, scopeRoads]);

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
                  NER Central Command GIS Spatial Intelligence
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
              <span className="font-bold">District Focus: {selectedDistrict} ({selectedState !== "ALL" ? selectedState : "NER"})</span>
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
                <span className="text-sm">⛽🚚🚑🚜</span>
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
                    State / District: <span className="text-stone-800 font-semibold">{selectedHighway.districts_traversed.join(", ")}, {selectedHighway.state}</span>
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
