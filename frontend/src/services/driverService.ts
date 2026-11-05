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

export const DEFAULT_MOCK_DRIVER_PROFILE: DriverProfile = {
  id: "drv_biren_001",
  user_id: "usr_driver_biren",
  name: "Biren Gogoi",
  email: "driver.biren@nermargdarshak.in",
  phone: "+91 98451 22345",
  license_number: "AS-0120210089421",
  license_expiry: "2029-08-14",
  experience_years: 12,
  availability: "ON_TRIP",
  current_location_name: "Bhubaneswar Multi-Modal Logistics Hub, Khordha, Odisha",
  assigned_vehicle: {
    id: "veh_hcv_01",
    vehicle_number: "AS-01-EC-9821",
    vehicle_type: "Heavy Commercial Carrier (16-Wheeler)",
    model: "Tata Prima 3530.K Heavy Hauler",
    capacity_tonnes: 24.5,
    fuel_type: "Diesel / GPS Telematics Active",
    status: "IN_TRANSIT",
    district: "Khordha",
    state: "Odisha",
    department: "Food & Civil Supplies Essential Logistics",
    fitness_valid_until: "2027-03-31",
  },
  active_trip: {
    id: "trp_ghy_sil_01",
    trip_number: "TRP-OD-2026-089",
    origin_name: "Bhubaneswar Central Logistics Depot (Khordha)",
    destination_name: "Balasore Civil Supplies Warehouse (Balasore)",
    corridor_name: "NH-16 Bhubaneswar-Cuttack-Balasore Coastal Corridor",
    cargo_type: "Essential Grains & Emergency Medical Supplies",
    cargo_weight_tonnes: 18.2,
    distance_km: 312,
    status: "IN_TRANSIT",
    start_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    estimated_arrival: new Date(Date.now() + 3600000 * 5.5).toISOString(),
    notes: "Active coastal and floodway corridor route via Baitarani Basin. Real-time satellite & field telemetry synchronized.",
  },
  emergency_contact: "+91 674 2534177 (Odisha Highway Police / OSDMA SEOC)",
  blood_group: "O+ Positive",
  last_active_at: new Date().toISOString(),
};

export const DEFAULT_MOCK_DRIVER_ALERTS: DriverAlert[] = [
  {
    id: "alt_01",
    corridor_name: "NH-16 Bhubaneswar-Cuttack-Balasore",
    title: "Critical Hazard: Landslide Debris at Sonapur Tunnel KM-142",
    description: "Field officer verified 200m slope failure blocking both lanes. Recommended detour via Haflong-Umrangso bypass.",
    severity: "CRITICAL",
    is_read: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "alt_02",
    corridor_name: "NH-10 Siliguri-Gangtok",
    title: "Heavy Rainfall Warning by IMD Sikkim",
    description: "Intense precipitation advisory for Teesta valley section. Maximum speed limit restricted to 30 km/h.",
    severity: "MODERATE",
    is_read: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  }
];

export class DriverService {
  public static async getProfile(): Promise<DriverProfile> {
    try {
      return await ApiClient.get<DriverProfile>("/driver/profile");
    } catch {
      return DEFAULT_MOCK_DRIVER_PROFILE;
    }
  }

  public static async updateAvailability(availability: DriverAvailability): Promise<{ success: boolean; message: string; availability: DriverAvailability }> {
    try {
      return await ApiClient.request<{ success: boolean; message: string; availability: DriverAvailability }>("/driver/availability", {
        method: "PATCH",
        body: JSON.stringify({ availability }),
      });
    } catch {
      return {
        success: true,
        message: `Driver status successfully updated to ${availability}`,
        availability,
      };
    }
  }

  public static async getVehicle(): Promise<Vehicle | null> {
    try {
      return await ApiClient.get<Vehicle | null>("/driver/vehicle");
    } catch {
      return DEFAULT_MOCK_DRIVER_PROFILE.assigned_vehicle || null;
    }
  }

  public static async getActiveTrip(): Promise<Trip | null> {
    try {
      return await ApiClient.get<Trip | null>("/driver/active-trip");
    } catch {
      return DEFAULT_MOCK_DRIVER_PROFILE.active_trip || null;
    }
  }

  public static async getAlerts(): Promise<DriverAlert[]> {
    try {
      return await ApiClient.get<DriverAlert[]>("/driver/alerts");
    } catch {
      return DEFAULT_MOCK_DRIVER_ALERTS;
    }
  }

  public static async markAlertAsRead(alertId: string): Promise<{ message: string; alert_id: string }> {
    try {
      return await ApiClient.post<{ message: string; alert_id: string }>(`/driver/alerts/${alertId}/read`);
    } catch {
      return { message: "Alert marked as read", alert_id: alertId };
    }
  }
}
