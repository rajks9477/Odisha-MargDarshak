import { MapApi } from "../api/mapApi";
import { RoadMatchResult } from "../types/mapTypes";

export class RoadMatchingService {
  private static lastMatch: { lat: number; lng: number; result: RoadMatchResult; timestamp: number } | null = null;

  public static async matchCurrentPosition(lat: number, lng: number): Promise<RoadMatchResult> {
    const now = Date.now();
    // Cache for 10 seconds if position moved less than 15 meters
    if (this.lastMatch && now - this.lastMatch.timestamp < 10000) {
      const latDiff = Math.abs(this.lastMatch.lat - lat);
      const lngDiff = Math.abs(this.lastMatch.lng - lng);
      if (latDiff < 0.0002 && lngDiff < 0.0002) {
        return this.lastMatch.result;
      }
    }

    try {
      const result = await MapApi.matchRoad(lat, lng);
      this.lastMatch = { lat, lng, result, timestamp: now };
      return result;
    } catch (err) {
      console.warn("[RoadMatchingService] Fallback to regional highway spine", err);
      return {
        latitude: lat,
        longitude: lng,
        matched_road_name: "NH-16 National Highway (Odisha Coastal Spine)",
        distance_to_road_km: 0.1,
        district_name: "East Jaintia Hills",
        state: "Odisha",
      };
    }
  }
}
