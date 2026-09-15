import { MapApi } from "../api/mapApi";
import { MapSearchItem } from "../types/mapTypes";

export class SearchService {
  private static cachedQueries: Map<string, MapSearchItem[]> = new Map();

  public static async searchLocations(query: string): Promise<MapSearchItem[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 1) return [];

    const cacheKey = trimmed.toLowerCase();
    if (this.cachedQueries.has(cacheKey)) {
      return this.cachedQueries.get(cacheKey)!;
    }

    try {
      const results = await MapApi.search(trimmed);
      this.cachedQueries.set(cacheKey, results);
      return results;
    } catch (err) {
      console.error("[SearchService] Search query failed", err);
      return [];
    }
  }

  public static clearCache(): void {
    this.cachedQueries.clear();
  }
}
