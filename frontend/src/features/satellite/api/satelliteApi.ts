import { SatelliteScene, SatelliteChangeDetection } from "../types/satelliteTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const satelliteApi = {
  /**
   * Get available satellite scenes metadata
   */
  async getScenes(district?: string): Promise<SatelliteScene[]> {
    const query = district ? `?district=${encodeURIComponent(district)}` : "";
    const res = await fetch(`${API_BASE}/satellite/scenes${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch satellite scenes: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Get computer-vision change detection analysis for a corridor
   */
  async getChangeDetection(roadId: string): Promise<SatelliteChangeDetection> {
    const res = await fetch(`${API_BASE}/satellite/change-detection/${roadId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch satellite change detection");
    }

    return res.json();
  },

  /**
   * Run custom before/after change detection
   */
  async analyzeCustom(
    roadId: string,
    preEventDate?: string,
    postEventDate?: string
  ): Promise<SatelliteChangeDetection> {
    const res = await fetch(`${API_BASE}/satellite/analyze-custom`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        road_id: roadId,
        pre_event_date: preEventDate,
        post_event_date: postEventDate,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to run custom satellite change detection");
    }

    return res.json();
  },

  /**
   * Get active spatial change anomalies
   */
  async getActiveAnomalies(): Promise<SatelliteChangeDetection[]> {
    const res = await fetch(`${API_BASE}/satellite/active-anomalies`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch active spatial anomalies");
    }

    return res.json();
  },
};
