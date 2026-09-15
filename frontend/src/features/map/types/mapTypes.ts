export type IncidentSeverityType = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type IncidentTypeCategory = 
  | "LANDSLIDE"
  | "ROAD_DAMAGE"
  | "FLOOD_WATER"
  | "TREE_FALL"
  | "AVALANCHE_SNOW"
  | "BRIDGE_SCOUR"
  | "ROAD_BLOCKAGE"
  | "ACCIDENT"
  | "OTHER";

export interface MapIncidentItem {
  id: string;
  incident_type: IncidentTypeCategory;
  severity: IncidentSeverityType;
  latitude: number;
  longitude: number;
  road_name: string;
  district_name: string;
  state: string;
  status: "ACTIVE" | "VERIFIED" | "PENDING_VERIFICATION" | "RESOLVED";
  description: string;
  created_at: string;
  distance_km?: number;
}

export interface MapRoadItem {
  id: string;
  road_name: string;
  road_number: string;
  road_type: string;
  district_name: string;
  state: string;
  status: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  status_reason?: string;
  average_speed_kmh: number;
  is_bridge_section: boolean;
  coordinates: number[][]; // [[lon, lat], ...]
  last_updated: string;
}

export interface MapInfrastructureItem {
  id: string;
  name: string;
  type: "HOSPITAL" | "WAREHOUSE" | "RELIEF_CENTER" | "BRIDGE" | "EMERGENCY_FACILITY" | "FUEL_STATION" | "POLICE_POST" | "PWD_DEPOT";
  latitude: number;
  longitude: number;
  district_name: string;
  state: string;
  status: "OPERATIONAL" | "HIGH_CAPACITY" | "LIMITED_SERVICE" | "CLOSED";
  capacity_metric?: string;
  contact_number?: string;
  address?: string;
  is_emergency_critical: boolean;
  distance_km?: number;
}

export interface MapVehicleItem {
  id: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  speed_kmh: number;
  heading_degrees: number;
  is_moving: boolean;
  nearest_road_name?: string;
  freshness: "LIVE" | "STALE" | "OFFLINE";
  last_updated: string;
}

export interface MapLayerConfigItem {
  id: string;
  name: string;
  category: string;
  default_visible: boolean;
  requires_role?: string;
  icon?: string;
  description: string;
}

export interface MapSearchItem {
  id: string;
  name: string;
  type: "PLACE" | "ROAD" | "DISTRICT" | "INFRASTRUCTURE" | "INCIDENT";
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  subtitle?: string;
}

export interface RoadMatchResult {
  latitude: number;
  longitude: number;
  matched_road_id?: string;
  matched_road_name: string;
  road_type?: string;
  road_status?: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  distance_to_road_km: number;
  district_name?: string;
  state?: string;
}
