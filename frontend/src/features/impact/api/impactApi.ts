import { ImpactAnalysis } from "../types/impactTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const impactApi = {
  /**
   * Get cascading impact analysis for a road corridor
   */
  async getCorridorImpact(roadId: string): Promise<ImpactAnalysis> {
    const res = await fetch(`${API_BASE}/impact/corridor/${roadId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch corridor impact: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Get cascading impact analysis for a specific verified incident
   */
  async getIncidentImpact(incidentId: string): Promise<ImpactAnalysis> {
    const res = await fetch(`${API_BASE}/impact/incident/${incidentId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch incident impact");
    }

    return res.json();
  },

  /**
   * Run custom What-If scenario simulation
   */
  async calculateCustomImpact(
    roadId: string,
    hazardType: string = "LANDSLIDE",
    severity: string = "CRITICAL",
    estimatedBlockageHours: number = 6.0
  ): Promise<ImpactAnalysis> {
    const res = await fetch(`${API_BASE}/impact/calculate-custom`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        road_id: roadId,
        hazard_type: hazardType,
        severity,
        estimated_blockage_hours: estimatedBlockageHours,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to simulate impact scenario");
    }

    return res.json();
  },

  /**
   * Get active regional disruptions
   */
  async getActiveDisruptions(): Promise<ImpactAnalysis[]> {
    const res = await fetch(`${API_BASE}/impact/active-disruptions`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch active disruptions");
    }

    return res.json();
  },
};
