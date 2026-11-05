"use client";

import React, { useState, useEffect } from "react";
import { SatelliteScene, SatelliteChangeDetection } from "../types/satelliteTypes";
import { satelliteApi } from "../api/satelliteApi";
import { BeforeAfterViewer } from "./BeforeAfterViewer";
import { ChangeDetectionCard } from "./ChangeDetectionCard";
import {
  Globe,
  Layers,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Calendar,
  Eye,
  Activity,
} from "lucide-react";

export const SatelliteDashboardView: React.FC = () => {
  const [scenes, setScenes] = useState<SatelliteScene[]>([]);
  const [anomalies, setAnomalies] = useState<SatelliteChangeDetection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("East Jaintia Hills");

  const loadData = async () => {
    setLoading(true);
    try {
      const [scData, anData] = await Promise.all([
        satelliteApi.getScenes(selectedDistrict),
        satelliteApi.getActiveAnomalies(),
      ]);
      setScenes(scData);
      setAnomalies(anData);
    } catch (e) {
      console.warn("Failed to load satellite data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrict]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Satellite & Remote-Sensing Intelligence</h2>
            <p className="text-xs text-slate-400">
              Multi-spectral change detection (Sentinel-2, Landsat-9 & Cartosat) for landslide & flood monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
          >
            <option value="Bhadrak">Bhadrak (Baitarani Flood Basin)</option>
            <option value="Balasore">Balasore (Subarnarekha Coastal Belt)</option>
            <option value="Kendujhar">Kendujhar (Kanjipani Ghat Corridor)</option>
            <option value="Koraput">Koraput (Eastern Ghats Mountain Pass)</option>
            <option value="Cuttack">Cuttack (Mahanadi River Basin)</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Provenance Disclaimer */}
      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-[10px]">
        <span className="text-slate-400">
          Source Data: ESA Copernicus Open Access Hub & ISRO Bhuvan Spatial Portal
        </span>
        <span className="text-cyan-400 font-bold">[Demo Simulated Satellite Imagery]</span>
      </div>

      {/* Before / After Imagery Slider */}
      <BeforeAfterViewer
        preDate="2026-08-15"
        postDate="2026-08-28"
        roadName="NH-6 Sonapur Tunnel Section"
      />

      {/* Active Remote Sensing Change Anomalies */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-red-400" />
            <span>Detected Remote Sensing Spatial Anomalies ({anomalies.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Sentinel-2 CV Change Engine</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400" />
            <span>Processing multispectral raster scenes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((anom) => (
              <ChangeDetectionCard key={anom.id} anomaly={anom} />
            ))}
          </div>
        )}
      </div>

      {/* Available Satellite Scenes Timeline Grid */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Available Regional Satellite Scene Catalog ({scenes.length} Passes)</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Orbit Passes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
          {scenes.map((sc) => (
            <div key={sc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400">{sc.satellite_source}</span>
                <span className="text-[9px] text-slate-500">{sc.cloud_cover_pct}% Cloud</span>
              </div>
              <div className="text-xs font-bold text-slate-100">{sc.target_district}, {sc.state}</div>
              <div className="text-[10px] text-slate-400">{new Date(sc.acquisition_date).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
