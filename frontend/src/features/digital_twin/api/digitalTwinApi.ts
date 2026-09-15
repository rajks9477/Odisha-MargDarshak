import { DigitalTwinState, EntityDependency } from "../types/digitalTwinTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const digitalTwinApi = {
  /**
   * Fetch real-time digital twin network topology and status
   */
  async getNetworkState(): Promise<DigitalTwinState> {
    const res = await fetch(`${API_BASE}/digital-twin/state`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch digital twin state: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Trace entity dependency chain (Road -> Route -> Vehicle -> Shipment -> Hospital Service)
   */
  async getEntityDependencies(entityId: string): Promise<EntityDependency> {
    const res = await fetch(`${API_BASE}/digital-twin/entity/${encodeURIComponent(entityId)}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to trace entity dependencies");
    }

    return res.json();
  },

  /**
   * Create an isolated historical snapshot of the current network state
   */
  async takeSnapshot(snapshotTitle?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/digital-twin/snapshot`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        snapshot_title: snapshotTitle || "Command Center State Snapshot",
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to create digital twin snapshot");
    }

    return res.json();
  },

  /**
   * List historical network state snapshots
   */
  async listSnapshots(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/digital-twin/snapshots`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  },
};
