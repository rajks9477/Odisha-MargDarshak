"use client";

import React, { useState } from "react";
import { AdminUser, UserRole } from "../types/adminTypes";
import { adminApi } from "../api/adminApi";
import { User, Shield, AlertTriangle, X, Check, Lock, Unlock, Edit3 } from "lucide-react";

interface Props {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserDetailModal: React.FC<Props> = ({ user, isOpen, onClose, onSuccess }) => {
  if (!isOpen || !user) return null;

  const [role, setRole] = useState<UserRole>(user.role);
  const [district, setDistrict] = useState(user.district || "");
  const [department, setDepartment] = useState(user.department || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateScope = async () => {
    setLoading(true);
    setError(null);
    try {
      await adminApi.updateRoleOrScope(user.id, {
        role,
        district,
        department,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user scope");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user.status === "SUSPENDED") {
        await adminApi.reactivateUser(user.id);
      } else {
        await adminApi.suspendUser(user.id);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 font-sans animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">User Scope & Security Control</h3>
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
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Name:</span>
            <span className="font-bold text-slate-100">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Email:</span>
            <span className="text-slate-300">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="font-bold text-cyan-400">{user.status}</span>
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Role Permission</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
            >
              <option value="DRIVER">Fleet Driver</option>
              <option value="FIELD_OFFICER">Field Officer</option>
              <option value="DISTRICT_ADMIN">District Admin</option>
              <option value="CENTRAL_ADMIN">Super Admin</option>
              <option value="CITIZEN">Citizen</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Assigned District</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleToggleSuspend}
            disabled={loading}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              user.status === "SUSPENDED"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300"
            }`}
          >
            {user.status === "SUSPENDED" ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Reactivate</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Suspend</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateScope}
              disabled={loading}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow"
            >
              Save Scope
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
