import { ResilienceAsset, ResilienceSummary } from "../types/resilienceTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const resilienceApi = {
  /**
   * Fetch ranked infrastructure resilience scores
   */
  async getRankings(state?: string): Promise<ResilienceAsset[]> {
    const query = state ? `?state=${encodeURIComponent(state)}` : "";
    const res = await fetch(`${API_BASE}/resilience/rankings${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch resilience rankings: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Fetch executive regional resilience summary
   */
  async getSummary(): Promise<ResilienceSummary> {
    const res = await fetch(`${API_BASE}/resilience/summary`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch resilience summary");
    }

    return res.json();
  },

  /**
   * Fetch detailed asset resilience metrics
   */
  async getAssetDetail(assetId: string): Promise<ResilienceAsset> {
    const res = await fetch(`${API_BASE}/resilience/assets/${encodeURIComponent(assetId)}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch asset detail");
    }

    return res.json();
  },
};
