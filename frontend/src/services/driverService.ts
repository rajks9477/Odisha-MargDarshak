import { ApiClient } from "@/lib/api";

export type DriverAvailability = "AVAILABLE" | "ON_TRIP" | "OFFLINE";
export type VehicleStatus = "OPERATIONAL" | "IN_TRANSIT" | "MAINTENANCE" | "IDLE";
export type TripStatus = "SCHEDULED" | "IN_TRANSIT" | "PAUSED_WEATHER" | "COMPLETED" | "CANCELLED";
export type AlertSeverity = "LOW" | "MODERATE" | "CRITICAL";

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  capacity_tonnes: number;
  fuel_type: string;
  status: VehicleStatus;
  district?: string;
  state?: string;
  department?: string;
  fitness_valid_until?: string;
}

export interface Trip {
  id: string;
  trip_number: string;
  origin_name: string;
  destination_name: string;
  corridor_name: string;
  cargo_type: string;
  cargo_weight_tonnes: number;
  distance_km: number;
  status: TripStatus;
  start_time: string;
  estimated_arrival?: string;
  notes?: string;
}

export interface DriverAlert {
  id: string;
  corridor_name: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  is_read: boolean;
  created_at: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  license_number: string;
  license_expiry?: string;
  experience_years: number;
  availability: DriverAvailability;
  current_location_name?: string;
  assigned_vehicle?: Vehicle | null;
  active_trip?: Trip | null;
  emergency_contact?: string;
  blood_group?: string;
  last_active_at: string;
}

export class DriverService {
  public static async getProfile(): Promise<DriverProfile> {
    return await ApiClient.get<DriverProfile>("/driver/profile");
  }

  public static async updateAvailability(availability: DriverAvailability): Promise<{ success: boolean; message: string; availability: DriverAvailability }> {
    return await ApiClient.request<{ success: boolean; message: string; availability: DriverAvailability }>("/driver/availability", {
      method: "PATCH",
      body: JSON.stringify({ availability }),
    });
  }

  public static async getVehicle(): Promise<Vehicle | null> {
    return await ApiClient.get<Vehicle | null>("/driver/vehicle");
  }

  public static async getActiveTrip(): Promise<Trip | null> {
    return await ApiClient.get<Trip | null>("/driver/active-trip");
  }

  public static async getAlerts(): Promise<DriverAlert[]> {
    return await ApiClient.get<DriverAlert[]>("/driver/alerts");
  }

  public static async markAlertAsRead(alertId: string): Promise<{ message: string; alert_id: string }> {
    return await ApiClient.post<{ message: string; alert_id: string }>(`/driver/alerts/${alertId}/read`);
  }
}
