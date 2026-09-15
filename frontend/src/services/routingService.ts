import { ApiClient } from "@/lib/api";

export enum RouteType {
  RECOMMENDED = "RECOMMENDED",
  FASTEST = "FASTEST",
  ALTERNATE = "ALTERNATE",
}

export enum RouteRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface RouteSegment {
  id: string;
  route_id: string;
  road_id?: string;
  sequence_order: number;
  road_name: string;
  distance_km: number;
  estimated_time_minutes: number;
  status: string;
  risk_penalty: number;
  has_active_incident: boolean;
  incident_description?: string;
}

export interface PlannedRoute {
  id: string;
  trip_id?: string;
  driver_id: string;
  vehicle_id?: string;
  origin_name: string;
  destination_name: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  route_type: RouteType;
  corridor_title: string;
  geometry_geojson: string;
  distance_km: number;
  estimated_time_minutes: number;
  route_score: number;
  risk_level: RouteRiskLevel;
  risk_score: number;
  risk_reasons: string[];
  is_selected: boolean;
  route_version: number;
  generated_at: string;
  selected_at?: string;
  segments?: RouteSegment[];
}

export interface CalculateRoutePayload {
  trip_id?: string;
  origin_latitude?: number;
  origin_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  mission_priority?: string; // ESSENTIAL_SAFETY, BALANCED_LOGISTICS, FASTEST_TRANSIT
  avoid_unverified_incidents?: boolean;
}

export interface DeviationCheckResult {
  route_id: string;
  is_deviated: boolean;
  distance_from_route_km: number;
  threshold_km: number;
  status: "ON_TRACK" | "CAUTION" | "OFF_ROUTE";
  message: string;
}

const CACHED_ACTIVE_ROUTE_KEY = "ner_cached_active_route";

export const RoutingService = {
  async calculateRoutes(payload: CalculateRoutePayload): Promise<PlannedRoute[]> {
    const isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;

    if (!isOnline) {
      const cached = this.getCachedActiveRoute();
      return cached ? [cached] : [];
    }

    try {
      const routes = await ApiClient.post<PlannedRoute[]>("/routes/calculate", payload);
      if (routes && routes.length > 0) {
        this.cacheActiveRoute(routes[0]);
      }
      return routes;
    } catch (err) {
      console.warn("Route calculation failed, checking cache", err);
      const cached = this.getCachedActiveRoute();
      return cached ? [cached] : [];
    }
  },

  async getRouteDetails(routeId: string): Promise<PlannedRoute> {
    return await ApiClient.get<PlannedRoute>(`/routes/${routeId}`);
  },

  async selectRoute(routeId: string): Promise<{ route_id: string; status: string; message: string }> {
    const res = await ApiClient.post<{ route_id: string; status: string; message: string }>(
      `/routes/${routeId}/select`
    );
    return res;
  },

  async getTripRoutes(tripId: string): Promise<PlannedRoute[]> {
    return await ApiClient.get<PlannedRoute[]>(`/trips/${tripId}/routes`);
  },

  async checkDeviation(
    routeId: string,
    currentLat: number,
    currentLon: number,
    thresholdKm: number = 1.5
  ): Promise<DeviationCheckResult> {
    return await ApiClient.post<DeviationCheckResult>(`/routes/${routeId}/check-deviation`, {
      current_latitude: currentLat,
      current_longitude: currentLon,
      deviation_threshold_km: thresholdKm,
    });
  },

  cacheActiveRoute(route: PlannedRoute) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CACHED_ACTIVE_ROUTE_KEY, JSON.stringify(route));
    } catch (e) {
      console.error("Failed to cache route", e);
    }
  },

  getCachedActiveRoute(): PlannedRoute | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(CACHED_ACTIVE_ROUTE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
