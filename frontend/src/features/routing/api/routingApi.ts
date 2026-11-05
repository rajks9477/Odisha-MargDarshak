import {
  PlannedRoute,
  LogisticsHub,
  RouteCalculateParams,
  RouteSelectResult,
} from "../types/routingTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const routingApi = {
  /**
   * Fetch list of regional transit hubs & junctions
   */
  async getLogisticsHubs(): Promise<LogisticsHub[]> {
    try {
      const res = await fetch(`${API_BASE}/routes/hubs`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch logistics hubs");
      return res.json();
    } catch {
      // Fallback predefined hubs
      return [
        { id: "BHUBANESWAR", name: "Bhubaneswar Central Logistics Hub, Khordha", latitude: 20.296, longitude: 85.824 },
        { id: "CUTTACK", name: "Cuttack Twin City Distribution Depot, Cuttack", latitude: 20.462, longitude: 85.882 },
        { id: "BALASORE", name: "Balasore Industrial and Food Terminal, Balasore", latitude: 21.493, longitude: 86.933 },
        { id: "BHADRAK", name: "Bhadrak Baitarani Gateway Depot, Bhadrak", latitude: 21.054, longitude: 86.501 },
        { id: "PARADIP", name: "Paradip Major Deepwater Port, Jagatsinghpur", latitude: 20.264, longitude: 86.611 },
        { id: "SAMBALPUR", name: "Sambalpur Western Logistics Center, Sambalpur", latitude: 21.467, longitude: 83.977 },
        { id: "ROURKELA", name: "Rourkela Steel City Logistics Depot, Sundargarh", latitude: 22.260, longitude: 84.853 },
        { id: "BERHAMPUR", name: "Berhampur Southern Distribution Depot, Ganjam", latitude: 19.315, longitude: 84.794 },
        { id: "KORAPUT", name: "Koraput Tribal and Mountain Logistics Hub, Koraput", latitude: 18.813, longitude: 82.713 },
        { id: "ANGUL", name: "Angul Industrial Mineral Corridor, Angul", latitude: 20.844, longitude: 85.151 },
        { id: "JHARSUGUDA", name: "Jharsuguda Multi-Modal Rail-Road Hub, Jharsuguda", latitude: 21.855, longitude: 84.006 },
        { id: "PURI", name: "Puri Coastal Logistics Center, Puri", latitude: 19.813, longitude: 85.831 },
      ];
    }
  },

  /**
   * Calculate safety-first multi-candidate routes
   */
  async calculateRoutes(params: RouteCalculateParams): Promise<PlannedRoute[]> {
    const res = await fetch(`${API_BASE}/routes/calculate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Routing calculation failed with status ${res.status}`);
    }

    return res.json();
  },

  /**
   * Get detailed route information with segments and hazard overlays
   */
  async getRouteDetails(routeId: string): Promise<PlannedRoute> {
    const res = await fetch(`${API_BASE}/routes/${routeId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch route details");
    }

    return res.json();
  },

  /**
   * Formally select and activate a planned route for the active driver transit
   */
  async selectRoute(routeId: string): Promise<RouteSelectResult> {
    const res = await fetch(`${API_BASE}/routes/${routeId}/select`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to select route");
    }

    return res.json();
  },

  /**
   * Fetch candidate routes for a given trip
   */
  async getTripRoutes(tripId: string): Promise<PlannedRoute[]> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/routes`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch trip routes");
    }

    return res.json();
  },
};
