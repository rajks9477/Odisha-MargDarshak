"use client";

import React, { useState, useEffect } from "react";
import { AdminUser, FleetVehicle } from "../types/adminTypes";
import { adminApi } from "../api/adminApi";
import { Truck, X, Check, AlertCircle } from "lucide-react";

interface Props {
  driver: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VehicleAssignmentModal: React.FC<Props> = ({
  driver,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !driver) return null;

  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listVehicles().then((res) => {
      setVehicles(res);
      const current = res.find((v) => v.assigned_driver_id === driver.id);
      if (current) setSelectedVehicleId(current.id);
    });
  }, [driver]);

  const handleAssign = async () => {
    setLoading(true);
    setError(null);
    try {
      await adminApi.assignVehicle(driver.id, selectedVehicleId || null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 font-sans animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Fleet Vehicle Assignment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">Assigned Driver:</span>
          <span className="font-bold text-slate-100">{driver.name} ({driver.email})</span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <label className="text-[10px] text-slate-400 uppercase block">Select Fleet Carrier</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500"
          >
            <option value="">-- No Vehicle (Unassigned) --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number} | {v.model} ({v.capacity_tonnes}T) - {v.status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow disabled:opacity-50"
          >
            {loading ? "Updating..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};
