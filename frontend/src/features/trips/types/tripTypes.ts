export type TripStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'READY'
  | 'STARTED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TripPriority =
  | 'CRITICAL_EMERGENCY'
  | 'HIGH_PRIORITY'
  | 'STANDARD';

export interface Trip {
  id: string;
  trip_number: string;
  driver_id?: string;
  vehicle_id?: string;
  vehicle_number?: string;
  origin_name: string;
  destination_name: string;
  corridor_name: string;
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
  actual_distance_km?: number;
  actual_duration_minutes?: number;
  pause_started_at?: string;
  pause_reason?: string;
  pause_duration_seconds?: number;
  route_id?: string;
  estimated_arrival?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RouteSegment {
  road_name: string;
  distance_km: number;
  estimated_time_minutes: number;
  status: string;
  has_incident?: boolean;
}

export interface TripRouteGeometry {
  trip_id: string;
  route_id: string;
  origin_name: string;
  destination_name: string;
  corridor_name: string;
  distance_km: number;
  estimated_duration_minutes: number;
  coordinates: [number, number][]; // [lon, lat]
  risk_score: number;
  risk_level: string;
  segments: RouteSegment[];
}

export interface TripProgress {
  trip_id: string;
  trip_number: string;
  status: TripStatus;
  total_distance_km: number;
  distance_completed_km: number;
  distance_remaining_km: number;
  progress_percentage: number;
  estimated_remaining_minutes: number;
  current_road_name: string;
  is_deviated: boolean;
  deviation_distance_km: number;
}

export interface TripEvent {
  id: string;
  trip_id: string;
  event_type: string;
  latitude?: number;
  longitude?: number;
  details?: string;
  created_by: string;
  timestamp: string;
}

export interface OfflineTripAction {
  local_action_id: string;
  trip_id: string;
  action_type: 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE';
  payload?: any;
  created_at: string;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
}
