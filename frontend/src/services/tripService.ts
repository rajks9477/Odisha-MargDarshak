import { ApiClient } from "@/lib/api";

export type TripStatus = "ASSIGNED" | "ACCEPTED" | "READY" | "STARTED" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type TripPriority = "CRITICAL_EMERGENCY" | "HIGH_PRIORITY" | "STANDARD";

export interface TripStatusHistory {
  id: string;
  trip_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  reason?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}

export interface DriverTrip {
  id: string;
  trip_number: string;
  driver_id: string;
  vehicle_id: string;
  vehicle_number?: string;
  shipment_id?: string;
  origin_name: string;
  destination_name: string;
  corridor_name: string;
  priority: TripPriority;
  cargo_type: string;
  cargo_weight_tonnes: number;
  distance_km: number;
  status: TripStatus;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  estimated_arrival?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface DriverTripDetail extends DriverTrip {
  history: TripStatusHistory[];
  active_tracking_session_id?: string;
}

export class TripService {
  /**
   * Get all active and assigned trips for the current driver
   */
  public static async getActiveTrips(): Promise<DriverTrip[]> {
    return await ApiClient.get<DriverTrip[]>("/driver/trips");
  }

  /**
   * Get detailed trip information with historical status audit log
   */
  public static async getTripDetails(tripId: string): Promise<DriverTripDetail> {
    return await ApiClient.get<DriverTripDetail>(`/driver/trips/${tripId}`);
  }

  /**
   * Accept an assigned trip (ASSIGNED -> ACCEPTED)
   */
  public static async acceptTrip(tripId: string, notes?: string): Promise<DriverTrip> {
    return await ApiClient.post<DriverTrip>(`/driver/trips/${tripId}/accept`, { notes });
  }

  /**
   * Start transit dispatch (ACCEPTED -> STARTED), automatically initiating vehicle tracking
   */
  public static async startTrip(
    tripId: string,
    startLat?: number,
    startLon?: number,
    notes?: string
  ): Promise<DriverTrip> {
    return await ApiClient.post<DriverTrip>(`/driver/trips/${tripId}/start`, {
      start_latitude: startLat,
      start_longitude: startLon,
      notes,
    });
  }

  /**
   * Pause active trip (STARTED -> PAUSED) for mountain roadblock / rest halt
   */
  public static async pauseTrip(
    tripId: string,
    reason?: string,
    lat?: number,
    lon?: number
  ): Promise<DriverTrip> {
    return await ApiClient.post<DriverTrip>(`/driver/trips/${tripId}/pause`, {
      reason,
      latitude: lat,
      longitude: lon,
    });
  }

  /**
   * Resume paused trip (PAUSED -> STARTED)
   */
  public static async resumeTrip(
    tripId: string,
    reason?: string,
    lat?: number,
    lon?: number
  ): Promise<DriverTrip> {
    return await ApiClient.post<DriverTrip>(`/driver/trips/${tripId}/resume`, {
      reason,
      latitude: lat,
      longitude: lon,
    });
  }

  /**
   * Complete trip upon reaching destination (STARTED/PAUSED -> COMPLETED)
   */
  public static async completeTrip(
    tripId: string,
    endLat?: number,
    endLon?: number,
    finalNotes?: string
  ): Promise<DriverTrip> {
    return await ApiClient.post<DriverTrip>(`/driver/trips/${tripId}/complete`, {
      end_latitude: endLat,
      end_longitude: endLon,
      final_notes: finalNotes,
    });
  }

  /**
   * Fetch completed and cancelled historical trips
   */
  public static async getTripHistory(): Promise<DriverTrip[]> {
    return await ApiClient.get<DriverTrip[]>("/driver/trips/history");
  }
}
