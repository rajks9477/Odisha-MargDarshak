import { ApiClient } from "@/lib/api";
import {
  MapIncidentItem,
  MapRoadItem,
  MapInfrastructureItem,
  MapVehicleItem,
  MapLayerConfigItem,
  MapSearchItem,
  RoadMatchResult,
} from "../types/mapTypes";

export class MapApi {
  public static async getIncidents(params?: {
    bbox?: string;
    status?: string;
    severity?: string;
    type?: string;
    format?: "json" | "geojson";
  }): Promise<MapIncidentItem[] | any> {
    const query = new URLSearchParams();
    if (params?.bbox) query.append("bbox", params.bbox);
    if (params?.status) query.append("status", params.status);
    if (params?.severity) query.append("severity", params.severity);
    if (params?.type) query.append("type", params.type);
    if (params?.format) query.append("format", params.format);

    const qs = query.toString();
    return await ApiClient.get<MapIncidentItem[] | any>(`/map/incidents${qs ? `?${qs}` : ""}`);
  }

  public static async getRoads(params?: {
    bbox?: string;
    state?: string;
    status?: string;
    format?: "json" | "geojson";
  }): Promise<MapRoadItem[] | any> {
    const query = new URLSearchParams();
    if (params?.bbox) query.append("bbox", params.bbox);
    if (params?.state) query.append("state", params.state);
    if (params?.status) query.append("status", params.status);
    if (params?.format) query.append("format", params.format);

    const qs = query.toString();
    return await ApiClient.get<MapRoadItem[] | any>(`/map/roads${qs ? `?${qs}` : ""}`);
  }

  public static async getInfrastructure(params?: {
    type?: string;
    state?: string;
    is_emergency_critical?: boolean;
  }): Promise<MapInfrastructureItem[]> {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    if (params?.state) query.append("state", params.state);
    if (params?.is_emergency_critical !== undefined) {
      query.append("is_emergency_critical", String(params.is_emergency_critical));
    }

    const qs = query.toString();
    return await ApiClient.get<MapInfrastructureItem[]>(`/map/infrastructure${qs ? `?${qs}` : ""}`);
  }

  public static async getVehicles(): Promise<MapVehicleItem[]> {
    return await ApiClient.get<MapVehicleItem[]>("/map/vehicles");
  }

  public static async getLayers(): Promise<MapLayerConfigItem[]> {
    return await ApiClient.get<MapLayerConfigItem[]>("/map/layers");
  }

  public static async getNearby(lat: number, lng: number, radiusKm: number = 25.0): Promise<{
    search_center: { latitude: number; longitude: number };
    radius_km: number;
    total_hazards: number;
    total_facilities: number;
    total_bridges: number;
    incidents: any[];
    infrastructure: any[];
    bridges: any[];
  }> {
    return await ApiClient.get<any>(`/map/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
  }

  public static async search(q: string): Promise<MapSearchItem[]> {
    return await ApiClient.get<MapSearchItem[]>(`/map/search?q=${encodeURIComponent(q)}`);
  }

  public static async matchRoad(lat: number, lng: number): Promise<RoadMatchResult> {
    return await ApiClient.get<RoadMatchResult>(`/map/road-match?lat=${lat}&lng=${lng}`);
  }
}
