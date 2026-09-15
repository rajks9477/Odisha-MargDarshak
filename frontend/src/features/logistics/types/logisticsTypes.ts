export enum CargoPriority {
  NORMAL = "NORMAL",
  IMPORTANT = "IMPORTANT",
  CRITICAL = "CRITICAL",
}

export enum CargoCategory {
  MEDICINES_MEDICAL = "MEDICINES_MEDICAL",
  EMERGENCY_FOOD_RATIONS = "EMERGENCY_FOOD_RATIONS",
  DISASTER_RECOVERY_EQUIPMENT = "DISASTER_RECOVERY_EQUIPMENT",
  PETROLEUM_FUEL = "PETROLEUM_FUEL",
  GENERAL_CIVIL_CARGO = "GENERAL_CIVIL_CARGO",
}

export enum ShipmentStatus {
  DISPATCH_PENDING = "DISPATCH_PENDING",
  IN_TRANSIT = "IN_TRANSIT",
  CORRIDOR_DELAYED = "CORRIDOR_DELAYED",
  DELIVERED = "DELIVERED",
  REROUTED_SAFETY = "REROUTED_SAFETY",
}

export interface Shipment {
  id: string;
  title: string;
  cargo_category: CargoCategory;
  cargo_description: string;
  priority: CargoPriority;
  weight_kg: number;
  origin_name: string;
  destination_name: string;
  assigned_driver_id?: string;
  assigned_vehicle_id?: string;
  active_trip_id?: string;
  active_route_id?: string;
  status: ShipmentStatus;
  progress_pct: number;
  created_at: string;
  dispatched_at?: string;
  estimated_arrival?: string;
  delivered_at?: string;
  risk_impact_summary?: string;
}

export interface WarehouseHub {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity_tonnes: number;
  current_occupancy_tonnes: number;
  contact_officer: string;
  hub_type: string;
}

export interface LogisticsMetrics {
  active_shipments_count: number;
  critical_relief_shipments_count: number;
  delayed_corridors_count: number;
  total_in_transit_tonnes: number;
  delivered_today_count: number;
  data_source: string;
}
