"use client";

import React, { useState, useEffect } from "react";
import {
  WeatherObservation,
  DisasterAlert,
  RegionalWeatherSummary,
} from "../types/weatherTypes";
import { weatherApi } from "../api/weatherApi";
import { WeatherCard } from "./WeatherCard";
import { DisasterEventCard } from "./DisasterEventCard";
import { DistrictSelector } from "./DistrictSelector";
import { DataSourceInfo } from "./DataSourceInfo";
import {
  CloudRain,
  ShieldAlert,
  RefreshCw,
  Globe,
  Flame,
  Layers,
  AlertTriangle,
  Building,
} from "lucide-react";

export const WeatherDisasterDashboard: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>("Bhubaneswar (Khordha District)");
  const [currentWeather, setCurrentWeather] = useState<WeatherObservation | null>(null);
  const [disasters, setDisasters] = useState<DisasterAlert[]>([]);
  const [regionalSummaries, setRegionalSummaries] = useState<RegionalWeatherSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (loc?: string) => {
    setLoading(true);
    const targetLoc = loc || selectedLocation;

    try {
      const [wData, dData, sData] = await Promise.all([
        weatherApi.getDistrictWeather(targetLoc),
        weatherApi.getActiveDisasters(),
        weatherApi.getRegionalSummaries(),
      ]);
      setCurrentWeather(wData);
      setDisasters(dData);
      setRegionalSummaries(sData);
    } catch (e) {
      console.warn("Failed to load weather data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedLocation);
  }, [selectedLocation]);

  return (
    <div className="space-y-4">
      {/* Top Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Weather & Disaster Intelligence</h2>
            <p className="text-xs text-slate-400">
              IMD automatic weather telemetry, CWC river gauges & SDMA alerts across 8 NE states
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DistrictSelector
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
            }}
          />

          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      <DataSourceInfo />

      {/* Main Grid: Telemetry Card & Active Disasters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: District Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          {loading || !currentWeather ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
              <span>Ingesting IMD AWS weather telemetry...</span>
            </div>
          ) : (
            <WeatherCard weather={currentWeather} />
          )}

          {/* Regional Summary Overview */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>North East Regional Corridor Weather Summary</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">5 Nodal Zones</span>
            </div>

            <div className="space-y-2">
              {regionalSummaries.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 truncate">{s.district} ({s.state})</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          s.active_warning_level === "RED"
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : s.active_warning_level === "ORANGE"
                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {s.active_warning_level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{s.primary_condition}</div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <div className="text-cyan-300 font-bold">{s.max_rainfall_24h_mm} mm</div>
                    <div className="text-[10px] text-slate-400">{s.temperature_range_c}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Disaster Alerts */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between p-2">
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Active Disaster Alerts ({disasters.length})</span>
            </h3>
            <span className="text-[10px] text-red-400 font-mono font-bold bg-red-950 px-2 py-0.5 rounded border border-red-800">
              HIGH IMPACT
            </span>
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              Fetching disaster bulletins...
            </div>
          ) : disasters.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-xs">
              No active disaster alerts reported.
            </div>
          ) : (
            disasters.map((d) => <DisasterEventCard key={d.id} disaster={d} />)
          )}
        </div>
      </div>
    </div>
  );
};
