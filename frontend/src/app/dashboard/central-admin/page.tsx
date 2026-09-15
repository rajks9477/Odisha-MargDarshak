"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { ApiClient } from "@/lib/api";
import { 
  Globe2, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  CheckCircle2, 
  RefreshCw, 
  Activity,
  Layers,
  Map as MapIcon
} from "lucide-react";
import { GovernmentCommandCenterView } from "@/features/command_center/components/GovernmentCommandCenterView";
import { AdminDashboardView } from "@/features/admin/components/AdminDashboardView";
import { CentralAdminRegionalRiskMap } from "@/features/map/components/CentralAdminRegionalRiskMap";

export default function CentralAdminDashboard() {
  const { user } = useAuth();
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [apiTesting, setApiTesting] = useState(false);

  // Tabs: "REGIONAL_MAP" | "COMMAND_CENTER" | "APPROVALS" | "USERS" | "AUDIT_LOGS"
  const [activeTab, setActiveTab] = useState<"REGIONAL_MAP" | "COMMAND_CENTER" | "APPROVALS" | "USERS" | "AUDIT_LOGS">("REGIONAL_MAP");

  // Data states
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Search & Filter state for Users tab
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [pendingRes, usersRes, auditRes] = await Promise.all([
        ApiClient.get("/admin/users/pending"),
        ApiClient.get(`/admin/users?search=${encodeURIComponent(searchQuery)}`),
        ApiClient.get("/admin/audit-logs?limit=50"),
      ]);

      setPendingUsers(pendingRes.users || []);
      setAllUsers(usersRes.users || []);
      setAuditLogs(auditRes.logs || []);
    } catch (err: any) {
      console.error("Failed to load central admin telemetry", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const handleTestApi = async () => {
    setApiTesting(true);
    try {
      const data = await ApiClient.get("/rbac-test/central-admin-zone");
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
      setActionMessage(`Approved ${userName} successfully! Account is now ACTIVE.`);
      fetchData();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.detail || "Approval failed");
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    const reason = prompt(`Enter rejection reason for ${userName}:`, "Administrative eligibility verification not met");
    if (reason === null) return;

    try {
      await ApiClient.post(`/admin/users/${userId}/reject`, {
        approve: false,
        rejection_reason: reason
      });
      setActionMessage(`Rejected registration application for ${userName}.`);
      fetchData();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.detail || "Rejection failed");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Central Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Globe2 className="w-4 h-4 text-rose-700" /> NER Central Command & Ministry Directorate
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            NER–MargDarshak Central Administration Console
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Regional cross-state oversight, user lifecycle verification, and cryptographic audit monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loadingData}
            className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-[#E8E2D8] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-emerald-700" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleTestApi}
            disabled={apiTesting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-rose-800 border border-rose-200 text-xs font-bold shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-rose-700" />
            <span>{apiTesting ? "Testing..." : "Verify Central Admin RBAC"}</span>
          </button>
        </div>
      </div>

      {/* Backend API Verification Response */}
      {apiTestResult && (
        <div className={`p-4 rounded-2xl border text-xs font-mono animate-in fade-in ${
          apiTestResult.success 
            ? "bg-[#E9F5ED] border-[#C2E2CC] text-[#1B4332]" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <div className="flex items-center justify-between mb-1 font-bold">
            <span>Central Admin Protected API Response:</span>
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

      {/* Regional Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs space-y-1">
          <div className="text-[11px] text-stone-500 font-bold">Pending Approvals</div>
          <div className="text-2xl font-black text-amber-700">{pendingUsers.length}</div>
          <div className="text-[10px] text-stone-400">Awaiting department sign-off</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs space-y-1">
          <div className="text-[11px] text-stone-500 font-bold">Total Registered Users</div>
          <div className="text-2xl font-black text-emerald-800">{allUsers.length}</div>
          <div className="text-[10px] text-stone-400">Across all 5 platform roles</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs space-y-1">
          <div className="text-[11px] text-stone-500 font-bold">NER States Integrated</div>
          <div className="text-2xl font-black text-blue-800">8 / 8</div>
          <div className="text-[10px] text-stone-400">Complete regional coverage</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs space-y-1">
          <div className="text-[11px] text-stone-500 font-bold">Audit Security Logs</div>
          <div className="text-2xl font-black text-purple-800">{auditLogs.length}</div>
          <div className="text-[10px] text-stone-400">Logged security & auth events</div>
        </div>
      </div>

      {/* Main Console Tabs */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl shadow-xs overflow-hidden">
        {/* Navigation Tab Header */}
        <div className="flex border-b border-[#E8E2D8] bg-[#FAF8F5] p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("REGIONAL_MAP")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "REGIONAL_MAP"
                ? "bg-white text-emerald-900 border border-[#C2E2CC] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <MapIcon className="w-4 h-4 text-emerald-800" />
            <span>Regional Highway GIS Risk Map</span>
          </button>

          <button
            onClick={() => setActiveTab("COMMAND_CENTER")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "COMMAND_CENTER"
                ? "bg-white text-emerald-900 border border-[#C2E2CC] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Regional Command Center</span>
          </button>

          <button
            onClick={() => setActiveTab("APPROVALS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "APPROVALS"
                ? "bg-amber-50 text-amber-900 border border-amber-200 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pending Approvals ({pendingUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("USERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "USERS"
                ? "bg-white text-stone-900 border border-[#E8E2D8] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("AUDIT_LOGS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "AUDIT_LOGS"
                ? "bg-purple-50 text-purple-900 border border-purple-200 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Security Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab 0: REGIONAL HIGHWAY GIS RISK MAP */}
        {activeTab === "REGIONAL_MAP" && (
          <div className="p-4 sm:p-6 space-y-4">
            <CentralAdminRegionalRiskMap />
          </div>
        )}

        {/* Tab 1: UNIFIED COMMAND CENTER */}
        {activeTab === "COMMAND_CENTER" && (
          <div className="p-6 space-y-4">
            <GovernmentCommandCenterView />
          </div>
        )}

        {/* Tab 1: PENDING APPROVALS */}
        {activeTab === "APPROVALS" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">NER Regional Verification Queue</h3>
                <p className="text-[11px] text-stone-500">
                  Government accounts awaiting official activation across all 8 North Eastern states
                </p>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <div className="text-sm font-bold text-stone-900">No Pending Approvals</div>
                <p className="text-xs text-stone-500">
                  All officer and admin accounts across the region are verified and active.
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
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Jurisdiction</th>
                      <th className="p-3 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE1]">
                    {pendingUsers.map((pUser) => (
                      <tr key={pUser.id} className="hover:bg-[#FAF8F5]">
                        <td className="p-3">
                          <div className="font-bold text-stone-900">{pUser.name}</div>
                          <div className="text-[11px] text-stone-500 font-mono">{pUser.email}</div>
                          <div className="text-[10px] text-stone-400">{pUser.phone}</div>
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
                          {pUser.district ? `${pUser.district}, ` : ""}{pUser.state}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleApprove(pUser.id, pUser.name)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Approve Account
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
        )}

        {/* Tab 2: ALL USERS DIRECTORY & RBAC CONTROLS */}
        {activeTab === "USERS" && (
          <div className="p-4">
            <AdminDashboardView />
          </div>
        )}

        {/* Tab 3: AUDIT LOGS */}
        {activeTab === "AUDIT_LOGS" && (
          <div className="p-6 space-y-4">
            <div className="border-b border-[#F0EAE1] pb-2">
              <h3 className="text-sm font-bold text-stone-900">Live Cryptographic Audit Trail</h3>
              <p className="text-[11px] text-stone-500">
                Immutable security logs tracking logins, failed attempts, token revocations, and approval decisions.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-stone-500 border-b border-[#E8E2D8] uppercase text-[10px] font-mono">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">User Email</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1] font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF8F5]">
                      <td className="p-3 text-stone-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          log.action === "LOGIN_SUCCESS"
                            ? "bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC]"
                            : log.action.includes("FAILED") || log.action.includes("BLOCKED")
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-purple-50 text-purple-800 border border-purple-200"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-stone-900 font-bold">{log.user_email || "System"}</td>
                      <td className="p-3 text-stone-500">{log.ip_address || "127.0.0.1"}</td>
                      <td className="p-3 text-stone-700 font-sans text-xs">{log.details || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
