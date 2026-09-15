"use client";

import React, { useState, useEffect } from "react";
import { MasterFacility } from "../types/masterDataTypes";
import { masterDataApi } from "../api/masterDataApi";
import { Building2, X, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  facility?: MasterFacility | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateFacilityModal: React.FC<Props> = ({
  isOpen,
  facility,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [facilityType, setFacilityType] = useState("HOSPITAL");
  const [state, setState] = useState("Assam");
  const [district, setDistrict] = useState("Kamrup");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("26.144");
  const [longitude, setLongitude] = useState("91.736");
  const [capacityMetric, setCapacityMetric] = useState("500 Beds");
  const [contactPhone, setContactPhone] = useState("+91361200100");
  const [nodalOfficer, setNodalOfficer] = useState("Dr. B. K. Sarma");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (facility) {
      setName(facility.name);
      setFacilityType(facility.facility_type);
      setState(facility.state);
      setDistrict(facility.district);
      setAddress(facility.address || "");
      setLatitude(facility.latitude.toString());
      setLongitude(facility.longitude.toString());
      setCapacityMetric(facility.capacity_metric || "");
      setContactPhone(facility.contact_phone || "");
      setNodalOfficer(facility.nodal_officer || "");
    } else {
      setName("");
      setFacilityType("HOSPITAL");
      setState("Assam");
      setDistrict("Kamrup");
      setAddress("");
      setLatitude("26.144");
      setLongitude("91.736");
      setCapacityMetric("500 Beds");
      setContactPhone("+91361200100");
      setNodalOfficer("Dr. B. K. Sarma");
    }
  }, [facility, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name,
        facility_type: facilityType,
        state,
        district,
        address: address || undefined,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        capacity_metric: capacityMetric || undefined,
        contact_phone: contactPhone || undefined,
        nodal_officer: nodalOfficer || undefined,
      };

      if (facility) {
        await masterDataApi.updateFacility(facility.id, payload);
      } else {
        await masterDataApi.createFacility(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 font-sans animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {facility ? "Update Master Facility" : "Provision Critical Master Facility"}
            </h3>
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

        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Facility Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Silchar Civil Hospital"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Facility Type</label>
              <select
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="HOSPITAL">Civil Hospital / ICU Trauma</option>
                <option value="RELIEF_CENTER">Disaster Relief Camp</option>
                <option value="WAREHOUSE">Strategic Supply Depot</option>
                <option value="FUEL_STATION">Emergency Fuel Depot</option>
                <option value="EMERGENCY_HELIPAD">Emergency Helipad</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="Assam">Assam</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Manipur">Manipur</option>
                <option value="Tripura">Tripura</option>
                <option value="Sikkim">Sikkim</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">District</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Kamrup / Tawang"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Latitude (°N)</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Capacity / Metric</label>
              <input
                type="text"
                value={capacityMetric}
                onChange={(e) => setCapacityMetric(e.target.value)}
                placeholder="e.g. 500 Beds / 12000 MT"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91361..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Nodal Officer Name</label>
            <input
              type="text"
              value={nodalOfficer}
              onChange={(e) => setNodalOfficer(e.target.value)}
              placeholder="e.g. Dr. B. K. Sarma"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
            />
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
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow disabled:opacity-50"
            >
              {loading ? "Saving..." : facility ? "Update Record" : "Create Facility"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
