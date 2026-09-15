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
        { id: "GUWAHATI", name: "Guwahati Central Hub, Assam", latitude: 26.18, longitude: 91.73 },
        { id: "SHILLONG", name: "Shillong Nodal Depot, Meghalaya", latitude: 25.57, longitude: 91.88 },
        { id: "SILCHAR", name: "Silchar Food & Medical Depot, Assam", latitude: 24.83, longitude: 92.79 },
        { id: "AIZAWL", name: "Aizawl Central Granary, Mizoram", latitude: 23.73, longitude: 92.71 },
        { id: "AGARTALA", name: "Agartala Supply Hub, Tripura", latitude: 23.83, longitude: 91.28 },
        { id: "TEZPUR", name: "Tezpur Military Gateway, Assam", latitude: 26.65, longitude: 92.79 },
        { id: "TAWANG", name: "Tawang Strategic Depot, Arunachal Pradesh", latitude: 27.58, longitude: 91.86 },
        { id: "ITANAGAR", name: "Itanagar Capital Hub, Arunachal Pradesh", latitude: 27.08, longitude: 93.60 },
        { id: "DIMAPUR", name: "Dimapur Commercial Railhead, Nagaland", latitude: 25.90, longitude: 93.72 },
        { id: "KOHIMA", name: "Kohima Mountain Ridge, Nagaland", latitude: 25.67, longitude: 94.10 },
        { id: "IMPHAL", name: "Imphal Valley Supply Center, Manipur", latitude: 24.81, longitude: 93.93 },
        { id: "GANGTOK", name: "Gangtok Hill Depot, Sikkim", latitude: 27.33, longitude: 88.61 },
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
