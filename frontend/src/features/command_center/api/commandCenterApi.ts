import {
  CommandCenterSummary,
  RegionalCorridorHealth,
  CommandCenterIncident,
} from "../types/commandCenterTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const commandCenterApi = {
  /**
   * Get unified command center summary
   */
  async getSummary(): Promise<CommandCenterSummary> {
    const res = await fetch(`${API_BASE}/command-center/summary`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch command center summary: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Get active ground incidents pending verification or active
   */
  async getActiveIncidents(): Promise<CommandCenterIncident[]> {
    const res = await fetch(`${API_BASE}/command-center/incidents/active`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch active command incidents");
    }

    return res.json();
  },

  /**
   * Verify ground incident report (Officer / Admin restricted action)
   */
  async verifyIncident(id: string, notes?: string): Promise<CommandCenterIncident> {
    const res = await fetch(`${API_BASE}/command-center/incidents/${id}/verify`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!res.ok) {
      throw new Error("Failed to verify incident");
    }

    return res.json();
  },

  /**
   * Reject ground incident report (Officer / Admin restricted action)
   */
  async rejectIncident(id: string, notes?: string): Promise<CommandCenterIncident> {
    const res = await fetch(`${API_BASE}/command-center/incidents/${id}/reject`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!res.ok) {
      throw new Error("Failed to reject incident");
    }

    return res.json();
  },

  /**
   * Get corridor health matrix across 8 NE states
   */
  async getCorridorsStatus(): Promise<RegionalCorridorHealth[]> {
    const res = await fetch(`${API_BASE}/command-center/corridors/status`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch corridors status");
    }

    return res.json();
  },
};
