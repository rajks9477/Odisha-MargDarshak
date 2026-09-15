import { TripRouteGeometry, TripProgress } from '../types/tripTypes';
import { tripsApi } from '../api/tripsApi';

const OFFLINE_ROUTE_KEY = 'ner_offline_route_cache_';

export class RouteService {
  private static instance: RouteService;

  private constructor() {}

  public static getInstance(): RouteService {
    if (!RouteService.instance) {
      RouteService.instance = new RouteService();
    }
    return RouteService.instance;
  }

  public async fetchTripRoute(tripId: string): Promise<TripRouteGeometry | null> {
    try {
      const route = await tripsApi.getTripRoute(tripId);
      if (route && typeof window !== 'undefined') {
        localStorage.setItem(`${OFFLINE_ROUTE_KEY}${tripId}`, JSON.stringify(route));
      }
      return route;
    } catch (err) {
      console.warn('Failed to fetch live route, reading from cache:', err);
      return this.getCachedRoute(tripId);
    }
  }

  public getCachedRoute(tripId: string): TripRouteGeometry | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(`${OFFLINE_ROUTE_KEY}${tripId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public async fetchTripProgress(tripId: string): Promise<TripProgress | null> {
    try {
      return await tripsApi.getTripProgress(tripId);
    } catch (err) {
      console.warn('Failed to fetch live progress:', err);
      return null;
    }
  }

  public calculateDeviation(
    currentLat: number,
    currentLng: number,
    accuracyMeters: number,
    routeCoordinates: [number, number][],
    deviationThresholdKm = 1.5
  ): { isDeviated: boolean; deviationDistanceKm: number } {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      return { isDeviated: false, deviationDistanceKm: 0 };
    }

    // Only assess deviation if GPS accuracy is reliable (<= 25m)
    if (accuracyMeters > 25.0) {
      return { isDeviated: false, deviationDistanceKm: 0 };
    }

    let minDistance = Infinity;
    for (const pt of routeCoordinates) {
      const d = this.haversineDistanceKm(currentLat, currentLng, pt[1], pt[0]);
      if (d < minDistance) {
        minDistance = d;
      }
    }

    return {
      isDeviated: minDistance > deviationThresholdKm,
      deviationDistanceKm: Math.round(minDistance * 100) / 100,
    };
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const routeService = RouteService.getInstance();
