"use client";

import React, { useState, useEffect } from "react";
import { AdminUser } from "../types/adminTypes";
import { adminApi } from "../api/adminApi";
import { UserTable } from "./UserTable";
import { CreateUserModal } from "./CreateUserModal";
import { UserDetailModal } from "./UserDetailModal";
import { VehicleAssignmentModal } from "./VehicleAssignmentModal";
import { AuditLogViewer } from "./AuditLogViewer";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const AdminDashboardView: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<AdminUser | null>(null);
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        search: search || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        state: selectedState || undefined,
      });
      setUsers(res.users);
    } catch (e) {
      console.warn("Failed to load user list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, selectedRole, selectedStatus, selectedState]);

  const handleApprove = async (user: AdminUser) => {
    try {
      await adminApi.approveUser(user.id);
      setNotification(`✓ Approved account for ${user.name} (${user.role})`);
      setTimeout(() => setNotification(null), 4000);
      loadUsers();
    } catch (e: any) {
      alert(e.message || "Approval failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Admin & User Management Console
            </h2>
            <p className="text-xs text-slate-400">
              Hierarchical RBAC, district assignments, fleet driver-to-vehicle allocation & audit trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAuditOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision User</span>
          </button>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
        >
          <option value="">All Roles</option>
          <option value="DRIVER">Driver</option>
          <option value="FIELD_OFFICER">Field Officer</option>
          <option value="DISTRICT_ADMIN">District Admin</option>
          <option value="CENTRAL_ADMIN">Super Admin</option>
          <option value="CITIZEN">Citizen</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono outline-none"
        >
          <option value="">All Districts</option>
          <option value="Khordha">Khordha</option>
          <option value="Cuttack">Cuttack</option>
          <option value="Balasore">Balasore</option>
          <option value="Sambalpur">Sambalpur</option>
        </select>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        onSelectUser={(u) => {
          setSelectedUser(u);
          setIsDetailOpen(true);
        }}
        onAssignVehicle={(u) => {
          setSelectedDriver(u);
          setIsVehicleOpen(true);
        }}
        onApprove={handleApprove}
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadUsers}
      />

      <UserDetailModal
        user={selectedUser}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={loadUsers}
      />

      <VehicleAssignmentModal
        driver={selectedDriver}
        isOpen={isVehicleOpen}
        onClose={() => {
          setIsVehicleOpen(false);
          setSelectedDriver(null);
        }}
        onSuccess={loadUsers}
      />

      <AuditLogViewer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
    </div>
  );
};
