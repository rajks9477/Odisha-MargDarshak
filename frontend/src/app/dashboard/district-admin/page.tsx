"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { ApiClient } from "@/lib/api";
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw
} from "lucide-react";
import { GovernmentCommandCenterView } from "@/features/command_center/components/GovernmentCommandCenterView";
import { AdminDashboardView } from "@/features/admin/components/AdminDashboardView";

export default function DistrictAdminDashboard() {
  const { user } = useAuth();
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [apiTesting, setApiTesting] = useState(false);

  // Pending users queue from backend
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const res = await ApiClient.get("/admin/users/pending");
      setPendingUsers(res.users || []);
    } catch (err: any) {
      console.error("Failed to fetch pending users", err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleTestApi = async () => {
    setApiTesting(true);
    try {
      const data = await ApiClient.get("/rbac-test/district-admin-zone");
      setApiTestResult({ success: true, data });
    } catch (err: any) {
      setApiTestResult({ success: false, error: err.detail });
    } finally {
      setApiTesting(false);
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    try {
      await ApiClient.post(`/admin/users/${userId}/approve`);
      setActionMessage(`Approved Field Officer ${userName} successfully! Account is now ACTIVE.`);
      fetchPendingUsers();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.detail || "Approval failed");
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    const reason = prompt(`Enter rejection reason for ${userName}:`, "Official identity could not be verified with DDMA roster");
    if (reason === null) return;

    try {
      await ApiClient.post(`/admin/users/${userId}/reject`, {
        approve: false,
        rejection_reason: reason
      });
      setActionMessage(`Rejected application for ${userName}.`);
      fetchPendingUsers();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.detail || "Rejection failed");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Unified Government Command Center */}
      <GovernmentCommandCenterView />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2 text-purple-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-purple-700" /> District Disaster & Logistics Administration (DDMA)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            District Command: {user?.district || "Khordha"} ({user?.state || "Odisha"})
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            District-wide essential supply corridor oversight, local road diversion clearances, and Field Officer approvals.
          </p>
        </div>

        <button
          onClick={handleTestApi}
          disabled={apiTesting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-purple-800 border border-purple-200 text-xs font-bold shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-purple-700" />
          <span>{apiTesting ? "Testing..." : "Verify District Admin RBAC"}</span>
        </button>
      </div>

      {/* Backend API Verification Response */}
      {apiTestResult && (
        <div className={`p-4 rounded-2xl border text-xs font-mono animate-in fade-in ${
          apiTestResult.success 
            ? "bg-purple-50 border-purple-200 text-purple-900" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <div className="flex items-center justify-between mb-1 font-bold">
            <span>District Admin Protected API Response:</span>
            <span>{apiTestResult.success ? "200 OK" : "403 Forbidden"}</span>
          </div>
          <pre className="overflow-x-auto text-[11px] pt-1">
            {JSON.stringify(apiTestResult.data || apiTestResult.error, null, 2)}
          </pre>
        </div>
      )}

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-[#E9F5ED] border border-[#C2E2CC] text-[#1B4332] text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* District Pending Approvals Queue */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-700" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Live Field Officer Verification & Approval Queue
              </h3>
              <p className="text-[11px] text-stone-500">
                Review and activate pending Field Officer registrations within your district
              </p>
            </div>
          </div>

          <button
            onClick={fetchPendingUsers}
            disabled={loadingPending}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingPending ? (
          <div className="py-8 text-center text-xs text-stone-500">Loading pending applications...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <div className="text-xs font-bold text-stone-900">No Pending Applications</div>
            <p className="text-[11px] text-stone-500">
              All Field Officer accounts in this district are verified and active.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-stone-500 border-b border-[#E8E2D8] uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3">Applicant Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Employee / Badge ID</th>
                  <th className="p-3">Jurisdiction</th>
                  <th className="p-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {pendingUsers.map((pUser) => (
                  <tr key={pUser.id} className="hover:bg-[#FAF8F5]">
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{pUser.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{pUser.email}</div>
                    </td>
                    <td className="p-3">
                      <RoleBadge role={pUser.role} size="sm" />
                    </td>
                    <td className="p-3 text-stone-700">
                      <div>{pUser.department || "PWD Roads"}</div>
                      <div className="text-[11px] text-stone-500">{pUser.designation}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-purple-800">
                      {pUser.employee_id || "N/A"}
                    </td>
                    <td className="p-3 text-stone-700 font-medium">
                      {pUser.district}, {pUser.state}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(pUser.id, pUser.name)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(pUser.id, pUser.name)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* District User & Fleet Management Console */}
      <div className="pt-4 border-t border-[#E8E2D8]">
        <AdminDashboardView />
      </div>
    </div>
  );
}
