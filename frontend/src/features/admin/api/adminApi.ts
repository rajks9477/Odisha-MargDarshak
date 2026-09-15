import { AdminUser, FleetVehicle, AuditLogItem, UserRole, UserStatus } from "../types/adminTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const adminApi = {
  /**
   * List all users with optional filters
   */
  async listUsers(params?: {
    role?: string;
    status?: string;
    district?: string;
    state?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; users: AdminUser[] }> {
    const query = new URLSearchParams();
    if (params?.role) query.append("role", params.role);
    if (params?.status) query.append("user_status", params.status);
    if (params?.district) query.append("district", params.district);
    if (params?.state) query.append("state", params.state);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/admin/users?${query.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to list users");
    }

    return res.json();
  },

  /**
   * List pending user registrations
   */
  async listPendingUsers(): Promise<{ total: number; users: AdminUser[] }> {
    const res = await fetch(`${API_BASE}/admin/users/pending`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      return { total: 0, users: [] };
    }
    return res.json();
  },

  /**
   * Approve a pending user
   */
  async approveUser(userId: string): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Approval failed");
    return res.json();
  },

  /**
   * Reject a pending user
   */
  async rejectUser(userId: string, reason?: string): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/reject`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ approve: false, rejection_reason: reason }),
    });
    if (!res.ok) throw new Error("Rejection failed");
    return res.json();
  },

  /**
   * Provision a new user directly
   */
  async createUser(payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    state?: string;
    district?: string;
    department?: string;
    employee_id?: string;
    designation?: string;
  }): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "User creation failed");
    }
    return res.json();
  },

  /**
   * Update role or district scope for a user
   */
  async updateRoleOrScope(
    userId: string,
    payload: {
      role?: UserRole;
      state?: string;
      district?: string;
      department?: string;
    }
  ): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Update failed");
    }
    return res.json();
  },

  /**
   * Suspend user
   */
  async suspendUser(userId: string): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Suspension failed");
    return res.json();
  },

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/reactivate`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Reactivation failed");
    return res.json();
  },

  /**
   * List fleet vehicles
   */
  async listVehicles(): Promise<FleetVehicle[]> {
    const res = await fetch(`${API_BASE}/admin/vehicles`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Assign vehicle to driver
   */
  async assignVehicle(driverId: string, vehicleId: string | null): Promise<FleetVehicle> {
    const res = await fetch(`${API_BASE}/admin/drivers/${driverId}/assign-vehicle`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ vehicle_id: vehicleId }),
    });
    if (!res.ok) throw new Error("Vehicle assignment failed");
    return res.json();
  },

  /**
   * List audit logs
   */
  async listAuditLogs(): Promise<{ total: number; logs: AuditLogItem[] }> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { total: 0, logs: [] };
    return res.json();
  },
};
