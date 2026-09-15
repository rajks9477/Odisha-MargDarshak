import { ApiClient } from "@/lib/api";

export type RoadStatus = "GREEN" | "YELLOW" | "ORANGE" | "RED";
export type IncidentType = "LANDSLIDE" | "ROAD_DAMAGE" | "FLOOD_WATER" | "TREE_FALL" | "AVALANCHE_SNOW" | "BRIDGE_SCOUR";
export type IncidentSeverity = "LOW" | "MODERATE" | "CRITICAL";

export interface RoadFeature {
  id: string;
  road_name: string;
  road_number: string;
  road_type: string;
  district_name: string;
  state: string;
  status: RoadStatus;
  status_reason?: string;
  average_speed_kmh: number;
  is_bridge_section: boolean;
  coordinates: [number, number][]; // [lon, lat]
  last_updated: string;
}

export interface RoadDetail extends RoadFeature {
  nearby_incidents: {
    id: string;
    type: string;
    severity: string;
    description: string;
    created_at: string;
  }[];
  nearby_bridges: {
    id: string;
    name: string;
    status: string;
    capacity_tonnes: number;
  }[];
}

export interface BridgeFeature {
  id: string;
  bridge_name: string;
  road_id?: string;
  latitude: number;
  longitude: number;
  district_name: string;
  state: string;
  status: RoadStatus;
  capacity_tonnes: number;
  water_level_status?: string;
  last_inspected: string;
}

export interface DistrictFeature {
  id: string;
  district_name: string;
  state: string;
  headquarters: string;
  center_latitude: number;
  center_longitude: number;
  polygon: [number, number][][]; // [[[lon, lat], ...]]
}

export interface IncidentFeature {
  id: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  road_name: string;
  district_name: string;
  state: string;
  status: string;
  description: string;
  created_at: string;
}

export interface DriverLocationData {
  driver_id: string;
  driver_name: string;
  vehicle_number?: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  speed_kmh?: number;
  heading_degrees?: number;
  is_moving: boolean;
  nearest_road_name?: string;
  last_updated: string;
}

export interface DriverLocationUpdatePayload {
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  speed_kmh?: number;
  heading_degrees?: number;
  client_timestamp?: string;
}

export interface OfflineLocationPing {
  local_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  speed_kmh?: number;
  heading_degrees?: number;
  client_timestamp: string;
}

export interface LocationBatchSyncResponse {
  synced_count: number;
  synced_local_ids: string[];
  message: string;
}

export class GisService {
  public static async getRoads(params?: { status?: RoadStatus; state?: string; district_name?: string }): Promise<RoadFeature[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.state) query.append("state", params.state);
    if (params?.district_name) query.append("district_name", params.district_name);

    const qs = query.toString() ? `?${query.toString()}` : "";
    return await ApiClient.get<RoadFeature[]>(`/map/roads${qs}`);
  }

  public static async getRoadDetail(roadId: string): Promise<RoadDetail> {
    return await ApiClient.get<RoadDetail>(`/map/roads/${roadId}`);
  }

  public static async getBridges(params?: { state?: string }): Promise<BridgeFeature[]> {
    const query = new URLSearchParams();
    if (params?.state) query.append("state", params?.state);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return await ApiClient.get<BridgeFeature[]>(`/map/bridges${qs}`);
  }

  public static async getDistricts(params?: { state?: string }): Promise<DistrictFeature[]> {
    const query = new URLSearchParams();
    if (params?.state) query.append("state", params?.state);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return await ApiClient.get<DistrictFeature[]>(`/map/districts${qs}`);
  }

  public static async getIncidents(params?: { status?: string; severity?: IncidentSeverity }): Promise<IncidentFeature[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.severity) query.append("severity", params.severity);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return await ApiClient.get<IncidentFeature[]>(`/map/incidents${qs}`);
  }

  public static async getDriverLocation(): Promise<DriverLocationData | null> {
    return await ApiClient.get<DriverLocationData | null>("/driver/location");
  }

  public static async updateDriverLocation(payload: DriverLocationUpdatePayload): Promise<DriverLocationData> {
    return await ApiClient.post<DriverLocationData>("/driver/location", payload);
  }

  public static async syncOfflineBatch(locations: OfflineLocationPing[]): Promise<LocationBatchSyncResponse> {
    return await ApiClient.post<LocationBatchSyncResponse>("/driver/location/sync-batch", { locations });
  }
}
