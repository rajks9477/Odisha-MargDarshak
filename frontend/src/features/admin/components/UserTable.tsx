"use client";

import React from "react";
import { AdminUser } from "../types/adminTypes";
import {
  User,
  Shield,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  Edit2,
  Lock,
  Unlock,
} from "lucide-react";

interface Props {
  users: AdminUser[];
  onSelectUser: (user: AdminUser) => void;
  onAssignVehicle: (user: AdminUser) => void;
  onApprove: (user: AdminUser) => void;
}

export const UserTable: React.FC<Props> = ({
  users,
  onSelectUser,
  onAssignVehicle,
  onApprove,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "CENTRAL_ADMIN":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">Super Admin</span>;
      case "DISTRICT_ADMIN":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">District Admin</span>;
      case "FIELD_OFFICER":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">Field Officer</span>;
      case "DRIVER":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">Driver</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">Citizen</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">Active</span>;
      case "PENDING_APPROVAL":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">Pending</span>;
      case "SUSPENDED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">Suspended</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">Rejected</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl font-sans">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
          <tr>
            <th className="p-3.5">User / Official</th>
            <th className="p-3.5">Role</th>
            <th className="p-3.5">Scope (State / District)</th>
            <th className="p-3.5">Account Status</th>
            <th className="p-3.5">Registered</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 block font-sans text-xs">{u.name}</span>
                    <span className="text-[11px] text-slate-400 block">{u.email}</span>
                  </div>
                </div>
              </td>
              <td className="p-3.5">{getRoleBadge(u.role)}</td>
              <td className="p-3.5">
                <span className="text-slate-200">{u.district || "—"}, {u.state || "Odisha"}</span>
              </td>
              <td className="p-3.5">{getStatusBadge(u.status)}</td>
              <td className="p-3.5 text-[11px] text-slate-400">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
              <td className="p-3.5 text-right space-x-1.5">
                {u.status === "PENDING_APPROVAL" && (
                  <button
                    type="button"
                    onClick={() => onApprove(u)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                  >
                    Approve
                  </button>
                )}

                {u.role === "DRIVER" && (
                  <button
                    type="button"
                    onClick={() => onAssignVehicle(u)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[11px] border border-amber-500/30 transition-colors inline-flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3" />
                    <span>Vehicle</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectUser(u)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] border border-cyan-500/30 transition-colors"
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-xs">
                No users found matching the selected filter criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
