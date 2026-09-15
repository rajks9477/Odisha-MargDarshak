import { MasterEntitySummary, MasterFacility, BulkImportResult } from "../types/masterDataTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const masterDataApi = {
  /**
   * Fetch master data summary KPI counts
   */
  async getSummary(): Promise<MasterEntitySummary> {
    const res = await fetch(`${API_BASE}/master-data/summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch master data summary");
    return res.json();
  },

  /**
   * List master facilities with optional filters
   */
  async getFacilities(params?: {
    facility_type?: string;
    state?: string;
    district?: string;
    status?: string;
  }): Promise<MasterFacility[]> {
    const query = new URLSearchParams();
    if (params?.facility_type) query.append("facility_type", params.facility_type);
    if (params?.state) query.append("state", params.state);
    if (params?.district) query.append("district", params.district);
    if (params?.status) query.append("status", params.status);

    const res = await fetch(`${API_BASE}/master-data/facilities?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Create a new facility
   */
  async createFacility(data: Partial<MasterFacility>): Promise<MasterFacility> {
    const res = await fetch(`${API_BASE}/master-data/facilities`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create facility");
    }
    return res.json();
  },

  /**
   * Update facility
   */
  async updateFacility(id: string, data: Partial<MasterFacility>): Promise<MasterFacility> {
    const res = await fetch(`${API_BASE}/master-data/facilities/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update facility");
    }
    return res.json();
  },

  /**
   * Soft-archive facility
   */
  async archiveFacility(id: string): Promise<MasterFacility> {
    const res = await fetch(`${API_BASE}/master-data/facilities/${id}/archive`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Archive failed");
    return res.json();
  },

  /**
   * Restore archived facility
   */
  async restoreFacility(id: string): Promise<MasterFacility> {
    const res = await fetch(`${API_BASE}/master-data/facilities/${id}/restore`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Restore failed");
    return res.json();
  },

  /**
   * Bulk import facilities
   */
  async bulkImport(items: any[], overwrite: boolean = false): Promise<BulkImportResult> {
    const res = await fetch(`${API_BASE}/master-data/bulk-import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ items, overwrite_existing: overwrite }),
    });
    if (!res.ok) throw new Error("Bulk import failed");
    return res.json();
  },
};
