"use client";

import React from "react";
import { WeatherObservation } from "../types/weatherTypes";
import {
  CloudRain,
  Thermometer,
  Wind,
  Eye,
  Droplets,
  Clock,
  ShieldAlert,
  Compass,
} from "lucide-react";

interface Props {
  weather: WeatherObservation;
}

export const WeatherCard: React.FC<Props> = ({ weather }) => {
  const getWarningStyle = (level: string) => {
    switch (level) {
      case "RED":
        return "bg-red-500/20 text-red-300 border-red-500/50 shadow-lg shadow-red-950/40";
      case "ORANGE":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "YELLOW":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "GREEN":
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
      {/* Header & Location */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {weather.district}, {weather.state}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Telemetry Fresh</span>
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100 mt-1">
            {weather.location_name}
          </h2>
        </div>

        <div className={`px-2.5 py-1 rounded-full border text-xs font-extrabold flex items-center gap-1 ${getWarningStyle(weather.weather_warning_level)}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>IMD {weather.weather_warning_level} ALERT</span>
        </div>
      </div>

      {/* Main Temperature & Rainfall Display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <span>Temperature</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {weather.temperature_c}°C
          </div>
          <div className="text-[10px] text-slate-400">
            Humidity: <span className="text-slate-200 font-semibold">{weather.humidity_pct}%</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span>24h Rainfall</span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">
            {weather.rainfall_24h_mm} <span className="text-xs font-normal">mm</span>
          </div>
          <div className="text-[10px] text-slate-400">
            7-Day Accumulation: <span className="text-cyan-300 font-semibold">{weather.rainfall_7d_mm} mm</span>
          </div>
        </div>
      </div>

      {/* Meteorological Gauges Grid */}
      <div className="grid grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <Wind className="w-3 h-3 text-purple-400" />
            <span>Wind Speed</span>
          </div>
          <div className="font-bold text-slate-200 font-mono">{weather.wind_speed_kmh} km/h</div>
        </div>

        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <Eye className="w-3 h-3 text-indigo-400" />
            <span>Visibility</span>
          </div>
          <div className="font-bold text-slate-200 font-mono">{weather.visibility_meters} m</div>
        </div>

        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>1-Hr Intensity</span>
          </div>
          <div className="font-bold text-cyan-300 font-mono">{weather.rainfall_1h_mm} mm/h</div>
        </div>
      </div>

      {/* Source Provenance */}
      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono">
        <span>Station Feed: {weather.source}</span>
        <span className="text-emerald-400 font-bold">[Grounded AWS Telemetry]</span>
      </div>
    </div>
  );
};
