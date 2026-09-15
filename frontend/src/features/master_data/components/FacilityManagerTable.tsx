"use client";

import React from "react";
import { MasterFacility } from "../types/masterDataTypes";
import {
  Building2,
  HeartPulse,
  Tent,
  Fuel,
  Plane,
  Warehouse,
  Archive,
  RotateCcw,
  Edit2,
  MapPin,
} from "lucide-react";

interface Props {
  facilities: MasterFacility[];
  onSelectFacility: (fac: MasterFacility) => void;
  onArchive: (fac: MasterFacility) => void;
  onRestore: (fac: MasterFacility) => void;
}

export const FacilityManagerTable: React.FC<Props> = ({
  facilities,
  onSelectFacility,
  onArchive,
  onRestore,
}) => {
  const getFacilityIcon = (type: string) => {
    switch (type) {
      case "HOSPITAL":
        return <HeartPulse className="w-4 h-4 text-red-400" />;
      case "RELIEF_CENTER":
        return <Tent className="w-4 h-4 text-amber-400" />;
      case "WAREHOUSE":
        return <Warehouse className="w-4 h-4 text-purple-400" />;
      case "FUEL_STATION":
        return <Fuel className="w-4 h-4 text-emerald-400" />;
      default:
        return <Plane className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl font-sans">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
          <tr>
            <th className="p-3.5">Facility Name</th>
            <th className="p-3.5">Type</th>
            <th className="p-3.5">Jurisdiction</th>
            <th className="p-3.5">Capacity / Spec</th>
            <th className="p-3.5">Coordinates</th>
            <th className="p-3.5">Status (v)</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
          {facilities.map((f) => (
            <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="p-3.5 font-sans">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {getFacilityIcon(f.facility_type)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 block text-xs">{f.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{f.id}</span>
                  </div>
                </div>
              </td>
              <td className="p-3.5">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">
                  {f.facility_type.replace("_", " ")}
                </span>
              </td>
              <td className="p-3.5 text-slate-200 font-sans">
                {f.district}, {f.state}
              </td>
              <td className="p-3.5 text-slate-300">
                {f.capacity_metric || "Standard"}
              </td>
              <td className="p-3.5 text-[11px] text-slate-400">
                {f.latitude.toFixed(3)}°N, {f.longitude.toFixed(3)}°E
              </td>
              <td className="p-3.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    f.status === "ACTIVE"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {f.status} (v{f.version})
                </span>
              </td>
              <td className="p-3.5 text-right space-x-1.5">
                <button
                  type="button"
                  onClick={() => onSelectFacility(f)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] border border-cyan-500/30 transition-colors inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>

                {f.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() => onArchive(f)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 font-semibold text-[11px] border border-slate-700 hover:border-red-800 transition-colors inline-flex items-center gap-1"
                  >
                    <Archive className="w-3 h-3" />
                    <span>Archive</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRestore(f)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 font-semibold text-[11px] border border-slate-700 hover:border-emerald-800 transition-colors inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
          {facilities.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                No facilities registered matching the selected criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
