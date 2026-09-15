"use client";

import React, { useState, useEffect } from "react";
import { MasterEntitySummary, MasterFacility } from "../types/masterDataTypes";
import { masterDataApi } from "../api/masterDataApi";
import { MasterDataKPICards } from "./MasterDataKPICards";
import { FacilityManagerTable } from "./FacilityManagerTable";
import { CreateFacilityModal } from "./CreateFacilityModal";
import { BulkImportModal } from "./BulkImportModal";
import {
  Database,
  Building2,
  Plus,
  UploadCloud,
  Search,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export const MasterDataDashboardView: React.FC = () => {
  const [summary, setSummary] = useState<MasterEntitySummary | null>(null);
  const [facilities, setFacilities] = useState<MasterFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<MasterFacility | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, facRes] = await Promise.all([
        masterDataApi.getSummary(),
        masterDataApi.getFacilities({
          facility_type: selectedType || undefined,
          status: selectedStatus || undefined,
          state: selectedState || undefined,
        }),
      ]);
      setSummary(sumRes);
      setFacilities(facRes);
    } catch (e) {
      console.warn("Failed to load master data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType, selectedStatus, selectedState]);

  const handleArchive = async (fac: MasterFacility) => {
    if (!confirm(`Archive facility ${fac.name}? It will remain accessible for historical queries.`)) return;
    try {
      await masterDataApi.archiveFacility(fac.id);
      setNotification(`✓ Archived ${fac.name}`);
      setTimeout(() => setNotification(null), 4000);
      loadData();
    } catch (e: any) {
      alert(e.message || "Archive failed");
    }
  };

  const handleRestore = async (fac: MasterFacility) => {
    try {
      await masterDataApi.restoreFacility(fac.id);
      setNotification(`✓ Restored ${fac.name} to ACTIVE status`);
      setTimeout(() => setNotification(null), 4000);
      loadData();
    } catch (e: any) {
      alert(e.message || "Restore failed");
    }
  };

  const filteredFacilities = facilities.filter((f) =>
    search ? f.name.toLowerCase().includes(search.toLowerCase()) || f.district.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Master Data Management Console
            </h2>
            <p className="text-xs text-slate-400">
              Foundational infrastructure registry across Corridors, Bridges, Hospitals, Logistics Hubs & Fuel Stations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Ingest</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedFacility(null);
              setIsCreateOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Facility</span>
          </button>

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

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <MasterDataKPICards summary={summary} />

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search facility name or district..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
        >
          <option value="">All Facility Types</option>
          <option value="HOSPITAL">Civil Hospital / ICU</option>
          <option value="RELIEF_CENTER">Disaster Relief Camp</option>
          <option value="WAREHOUSE">Strategic Supply Depot</option>
          <option value="FUEL_STATION">Fuel Depot</option>
          <option value="EMERGENCY_HELIPAD">Emergency Helipad</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Records</option>
          <option value="ARCHIVED">Archived Records</option>
        </select>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
        >
          <option value="">All States</option>
          <option value="Assam">Assam</option>
          <option value="Meghalaya">Meghalaya</option>
          <option value="Arunachal Pradesh">Arunachal Pradesh</option>
          <option value="Mizoram">Mizoram</option>
        </select>
      </div>

      {/* Facilities Table */}
      <FacilityManagerTable
        facilities={filteredFacilities}
        onSelectFacility={(fac) => {
          setSelectedFacility(fac);
          setIsCreateOpen(true);
        }}
        onArchive={handleArchive}
        onRestore={handleRestore}
      />

      {/* Modals */}
      <CreateFacilityModal
        isOpen={isCreateOpen}
        facility={selectedFacility}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedFacility(null);
        }}
        onSuccess={loadData}
      />

      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
