"use client";

import React, { useState, useEffect } from "react";
import { DigitalTwinState, EntityDependency } from "../types/digitalTwinTypes";
import { digitalTwinApi } from "../api/digitalTwinApi";
import { LayerControl, LayerState } from "./LayerControl";
import { DigitalTwinMap } from "./DigitalTwinMap";
import { EntityDetailsDrawer } from "./EntityDetailsDrawer";
import {
  Activity,
  RefreshCw,
  Camera,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Building,
  Truck,
  AlertTriangle,
} from "lucide-react";

export const DigitalTwinView: React.FC = () => {
  const [state, setState] = useState<DigitalTwinState | null>(null);
  const [selectedDependency, setSelectedDependency] = useState<EntityDependency | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);

  const [layers, setLayers] = useState<LayerState>({
    showRoads: true,
    showNodes: true,
    showFleet: true,
    showIncidents: true,
    showWeather: true,
  });

  const loadTwinState = async () => {
    setLoading(true);
    try {
      const data = await digitalTwinApi.getNetworkState();
      setState(data);
    } catch (e) {
      console.warn("Failed to load digital twin state", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwinState();
  }, []);

  const handleToggleLayer = (key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectEntity = async (entityId: string) => {
    try {
      const dep = await digitalTwinApi.getEntityDependencies(entityId);
      setSelectedDependency(dep);
    } catch (e) {
      console.warn("Failed to fetch entity dependencies", e);
    }
  };

  const handleTakeSnapshot = async () => {
    try {
      const res = await digitalTwinApi.takeSnapshot("Manual Command Center State Snapshot");
      setSnapshotMsg(`✓ Snapshot ${res.snapshot_id} saved successfully.`);
      setTimeout(() => setSnapshotMsg(null), 4000);
    } catch (e) {
      console.warn("Snapshot failed", e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Digital Twin of NER Network</h2>
            <p className="text-xs text-slate-400">
              Live unified graph model connecting Roads, Bridges, Vehicles, Relief Consignments & District Services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTakeSnapshot}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Network Snapshot</span>
          </button>

          <button
            type="button"
            onClick={loadTwinState}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {snapshotMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl font-bold">
          {snapshotMsg}
        </div>
      )}

      {/* Layer Control Bar */}
      <LayerControl layers={layers} onToggle={handleToggleLayer} />

      {/* Digital Twin Topology Map */}
      <DigitalTwinMap state={state} layers={layers} onSelectEntity={handleSelectEntity} />

      {/* Entity Dependency Details Drawer */}
      {selectedDependency && (
        <EntityDetailsDrawer
          dependency={selectedDependency}
          onClose={() => setSelectedDependency(null)}
        />
      )}

      {/* Unified Key Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 block">Corridors Scanned</span>
          <span className="text-lg font-extrabold text-slate-100 font-mono">
            {state?.edges.length || 3} Corridors
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 block">Critical Nodes</span>
          <span className="text-lg font-extrabold text-purple-400 font-mono">
            {state?.nodes.length || 4} Hubs
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 block">Active Relief Consignments</span>
          <span className="text-lg font-extrabold text-cyan-400 font-mono">
            {state?.active_shipments_count || 1} Consignments
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 block">Network Passability Health</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            {state?.network_health_index || 84.5}%
          </span>
        </div>
      </div>
    </div>
  );
};
