"use client";

import React, { useState, useEffect } from "react";
import {
  Shipment,
  WarehouseHub,
  LogisticsMetrics,
  CargoPriority,
  CargoCategory,
  ShipmentStatus,
} from "../types/logisticsTypes";
import { logisticsApi } from "../api/logisticsApi";
import { ShipmentCard } from "./ShipmentCard";
import { WarehouseHubCard } from "./WarehouseHubCard";
import {
  Truck,
  Package,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Building,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";

export const LogisticsDashboardView: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [hubs, setHubs] = useState<WarehouseHub[]>([]);
  const [metrics, setMetrics] = useState<LogisticsMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State for New Shipment
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newCategory, setNewCategory] = useState<CargoCategory>(CargoCategory.MEDICINES_MEDICAL);
  const [newDescription, setNewDescription] = useState<string>("");
  const [newPriority, setNewPriority] = useState<CargoPriority>(CargoPriority.CRITICAL);
  const [newWeight, setNewWeight] = useState<number>(2000);
  const [newOrigin, setNewOrigin] = useState<string>("Bhubaneswar Central Medical Depot (AIIMS/Capital Hospital)");
  const [newDestination, setNewDestination] = useState<string>("Balasore District Headquarter Hospital (Fakir Mohan MCH)");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, hData, mData] = await Promise.all([
        logisticsApi.getShipments(),
        logisticsApi.getWarehouseHubs(),
        logisticsApi.getLogisticsMetrics(),
      ]);
      setShipments(sData);
      setHubs(hData);
      setMetrics(mData);
    } catch (e) {
      console.warn("Failed to load logistics data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      await logisticsApi.createShipment({
        title: newTitle,
        cargo_category: newCategory,
        cargo_description: newDescription,
        priority: newPriority,
        weight_kg: newWeight,
        origin_name: newOrigin,
        destination_name: newDestination,
      });
      setCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      await loadData();
    } catch (e) {
      console.warn("Failed to create shipment", e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    if (selectedPriority !== "ALL" && s.priority !== selectedPriority) return false;
    if (
      searchQuery.trim() &&
      !s.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.origin_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.destination_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Logistics & Supply Chain Intelligence</h2>
            <p className="text-xs text-slate-400">
              Emergency relief consignments, medicine dispatches & warehouse staging across NE corridors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Emergency Consignment</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Active Dispatches</div>
            <div className="text-xl font-extrabold text-slate-100 font-mono">
              {metrics.active_shipments_count}
            </div>
            <div className="text-[10px] text-slate-500">Emergency & Civil Cargo</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] text-red-400 font-bold uppercase">Critical Relief Consignments</div>
            <div className="text-xl font-extrabold text-red-400 font-mono">
              {metrics.critical_relief_shipments_count}
            </div>
            <div className="text-[10px] text-slate-500">Medicines & Oxygen</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Delayed Corridors</div>
            <div className="text-xl font-extrabold text-amber-400 font-mono">
              {metrics.delayed_corridors_count}
            </div>
            <div className="text-[10px] text-slate-500">Sonapur NH-6 Bottleneck</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] text-cyan-400 font-bold uppercase">Total In-Transit Weight</div>
            <div className="text-xl font-extrabold text-cyan-300 font-mono">
              {metrics.total_in_transit_tonnes} <span className="text-xs font-normal">Tonnes</span>
            </div>
            <div className="text-[10px] text-slate-500">Across 8 NE States</div>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search consignment by title, origin or destination (e.g. ICU Medicines, Balasore)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {["ALL", "CRITICAL", "IMPORTANT", "NORMAL"].map((prio) => (
            <button
              key={prio}
              type="button"
              onClick={() => setSelectedPriority(prio)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPriority === prio
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments List */}
      {loading ? (
        <div className="py-16 text-center space-y-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
          <span>Synchronizing supply chain tracking records...</span>
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
          No shipments matched the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredShipments.map((s) => (
            <ShipmentCard key={s.id} shipment={s} />
          ))}
        </div>
      )}

      {/* Warehouse Staging Hubs Overview */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Nodal Warehouse & Relief Staging Hubs ({hubs.length})</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Central Depots</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hubs.map((hub) => (
            <WarehouseHubCard key={hub.id} hub={hub} />
          ))}
        </div>
      </div>

      {/* Create New Shipment Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Register Emergency Supply Consignment</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Consignment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Life-Saving Antibiotics & Blood Plasma Units"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cargo Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CargoCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none"
                  >
                    <option value={CargoCategory.MEDICINES_MEDICAL}>Medicines & Medical</option>
                    <option value={CargoCategory.EMERGENCY_FOOD_RATIONS}>Emergency Food Rations</option>
                    <option value={CargoCategory.DISASTER_RECOVERY_EQUIPMENT}>Disaster Machinery</option>
                    <option value={CargoCategory.PETROLEUM_FUEL}>Petroleum Fuel</option>
                    <option value={CargoCategory.GENERAL_CIVIL_CARGO}>General Cargo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cargo Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as CargoPriority)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none"
                  >
                    <option value={CargoPriority.CRITICAL}>CRITICAL (Red)</option>
                    <option value={CargoPriority.IMPORTANT}>IMPORTANT (Amber)</option>
                    <option value={CargoPriority.NORMAL}>NORMAL (Slate)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Origin Depot</label>
                  <input
                    type="text"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Destination Facility</label>
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Cargo Details & Passability</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide essential details, temperature sensitivity, or special transit requirements..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Register Consignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
