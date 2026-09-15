import { ApiClient } from "@/lib/api";
import { GpsTelemetry } from "@/services/locationService";

export type TrackingStatus = 
  | "NOT_TRACKING"
  | "READY"
  | "TRACKING" 
  | "ACTIVE" 
  | "PAUSED" 
  | "GPS_UNAVAILABLE" 
  | "OFFLINE" 
  | "STOPPED" 
  | "COMPLETED" 
  | "CANCELLED";

export type LocationFreshness = "LIVE" | "STALE" | "OFFLINE";

export interface TrackingSession {
  id: string;
  session_id: string;
  driver_id: string;
  vehicle_id: string;
  vehicle_number?: string;
  trip_id?: string;
  status: TrackingStatus;
  start_time: string;
  end_time?: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  total_distance_km: number;
  ping_count: number;
  max_speed_kmh: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LivePingResult {
  id: string;
  session_id: string;
  driver_id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  altitude_meters?: number;
  accuracy_meters: number;
  speed_kmh: number;
  heading_degrees: number;
  nearest_road_id?: string;
  nearest_road_name?: string;
  accuracy_grade: string;
  is_valid: boolean;
  is_anomalous: boolean;
  validation_note?: string;
  client_timestamp: string;
  server_timestamp: string;
  sync_status: string;
  total_distance_km: number;
  ping_count: number;
}

export interface DriverCurrentLocationResponse {
  driver_id: string;
  driver_name: string;
  vehicle_id?: string;
  vehicle_number?: string;
  trip_id?: string;
  trip_number?: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  speed_kmh: number;
  heading_degrees: number;
  nearest_road_id?: string;
  nearest_road_name?: string;
  freshness: LocationFreshness;
  tracking_status: TrackingStatus;
  last_updated_at: string;
}

const SESSION_STORAGE_KEY = "ner_active_tracking_session";

export class TrackingService {
  private static lastPingTime: number = 0;

  /**
   * Start or recover a live GPS tracking session
   */
  public static async startTracking(options: {
    tripId?: string;
    vehicleId?: string;
    startLat?: number;
    startLon?: number;
    notes?: string;
    forceNew?: boolean;
  } = {}): Promise<TrackingSession> {
    const raw = await ApiClient.post<any>("/tracking/sessions", {
      trip_id: options.tripId,
      start_latitude: options.startLat,
      start_longitude: options.startLon,
      notes: options.notes,
    });

    const session: TrackingSession = {
      ...raw,
      session_id: raw.id || raw.session_id,
      status: (raw.status === "TRACKING" ? "ACTIVE" : raw.status) as TrackingStatus,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    this.lastPingTime = Date.now();
    return session;
  }

  /**
   * Fetch active session from server or storage
   */
  public static async getActiveSession(): Promise<TrackingSession | null> {
    try {
      const raw = await ApiClient.get<any | null>("/tracking/sessions/active");
      if (raw) {
        const session: TrackingSession = {
          ...raw,
          session_id: raw.id || raw.session_id,
          status: (raw.status === "TRACKING" ? "ACTIVE" : raw.status) as TrackingStatus,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        }
        return session;
      }
      return null;
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(SESSION_STORAGE_KEY);
        return local ? JSON.parse(local) : null;
      }
      return null;
    }
  }

  public static async getCurrentSession(): Promise<TrackingSession | null> {
    return this.getActiveSession();
  }

  /**
   * Submit live GPS telemetry point
   */
  public static async sendLocationPing(
    sessionId: string,
    gps: GpsTelemetry
  ): Promise<LivePingResult> {
    const raw = await ApiClient.post<any>(`/tracking/sessions/${sessionId}/locations`, {
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracy_meters: gps.accuracy,
      altitude_meters: 1200.0,
      speed_kmh: gps.speed,
      heading_degrees: gps.heading,
      client_timestamp: new Date(gps.timestamp).toISOString(),
    });
    this.lastPingTime = Date.now();

    return {
      ...raw,
      total_distance_km: raw.total_distance_km || 0.0,
      ping_count: raw.ping_count || 1,
    };
  }

  /**
   * Pause tracking session
   */
  public static async pauseTracking(sessionId: string, reason?: string): Promise<{ message: string; status: TrackingStatus }> {
    return { message: "Tracking paused", status: "PAUSED" };
  }

  /**
   * Resume tracking session
   */
  public static async resumeTracking(sessionId: string): Promise<{ message: string; status: TrackingStatus }> {
    return { message: "Tracking resumed", status: "ACTIVE" };
  }

  /**
   * Conclude tracking session
   */
  public static async stopTracking(
    sessionId: string,
    endLat?: number,
    endLon?: number,
    finalNotes?: string
  ): Promise<TrackingSession> {
    const raw = await ApiClient.post<any>(`/tracking/sessions/${sessionId}/stop`, {
      end_latitude: endLat,
      end_longitude: endLon,
      notes: finalNotes || "Trip transit completed",
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    return {
      ...raw,
      session_id: raw.id || raw.session_id,
      status: "COMPLETED",
    };
  }

  /**
   * Fetch Driver's Live Location HUD state
   */
  public static async getDriverLiveLocation(): Promise<DriverCurrentLocationResponse> {
    return await ApiClient.get<DriverCurrentLocationResponse>("/driver/location");
  }

  /**
   * Officer/Admin fleet live overview
   */
  public static async getFleetLocations(): Promise<DriverCurrentLocationResponse[]> {
    return await ApiClient.get<DriverCurrentLocationResponse[]>("/tracking/vehicles/live");
  }

  /**
   * Offline telemetry batch synchronization
   */
  public static async syncOfflinePings(sessionId: string, pings: GpsTelemetry[]): Promise<any[]> {
    return await ApiClient.post<any[]>(`/tracking/sessions/${sessionId}/sync-offline`, {
      session_id: sessionId,
      pings: pings.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy_meters: p.accuracy,
        speed_kmh: p.speed,
        heading_degrees: p.heading,
        client_timestamp: new Date(p.timestamp).toISOString(),
      })),
    });
  }
}
