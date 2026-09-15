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
  status: "GREEN" | "YELLOW" | "ORANGE" | "RED";
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
  geometry_geojson: string; // JSON string array of [lon, lat]
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
  disaster_type?: string;
  disaster_title?: string;
  threat_time_window?: string;
  precipitation_mm?: number;
  slope_gradient_deg?: number;
  soil_saturation_pct?: number;
  historical_landslides?: number;
}

export interface LogisticsHub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
}

export interface RouteCalculateParams {
  trip_id?: string;
  origin_name?: string;
  destination_name?: string;
  origin_latitude?: number;
  origin_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  mission_priority?: "ESSENTIAL_SAFETY" | "BALANCED_LOGISTICS" | "FASTEST_TRANSIT";
  avoid_unverified_incidents?: boolean;
}

export interface RouteSelectResult {
  route_id: string;
  trip_id?: string;
  status: string;
  message: string;
  selected_at: string;
}
