export enum AlertSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO",
}

export enum AlertType {
  ROAD_BLOCKAGE = "ROAD_BLOCKAGE",
  BRIDGE_CLOSURE = "BRIDGE_CLOSURE",
  FLOOD_WARNING = "FLOOD_WARNING",
  LANDSLIDE_WARNING = "LANDSLIDE_WARNING",
  TRAFFIC_DISRUPTION = "TRAFFIC_DISRUPTION",
  ROUTE_DISRUPTION = "ROUTE_DISRUPTION",
  EMERGENCY_INSTRUCTION = "EMERGENCY_INSTRUCTION",
  TRIP_UPDATE = "TRIP_UPDATE",
  GOVERNMENT_DIRECTIVE = "GOVERNMENT_DIRECTIVE",
  SYSTEM_NOTICE = "SYSTEM_NOTICE",
}

export enum AlertStatus {
  UNREAD = "UNREAD",
  READ = "READ",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  EXPIRED = "EXPIRED",
}

export interface DriverAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  source: string;
  driver_id?: string;
  trip_id?: string;
  incident_id?: string;
  road_id?: string;
  road_name?: string;
  location_name?: string;
  status: AlertStatus;
  is_read: boolean;
  is_acknowledged: boolean;
  acknowledged_at?: string;
  read_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface UnreadAlertCount {
  unread_count: number;
  critical_count: number;
  last_sync: string;
}

export interface AlertFilterOptions {
  severity?: string;
  type?: string;
  status?: string;
  unread_only?: boolean;
}

export interface NotificationPreference {
  driver_id: string;
  language: string;
  allow_traffic_updates: boolean;
  allow_trip_updates: boolean;
  allow_weather_warnings: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  voice_enabled: boolean;
}

export interface OfflineAlertAction {
  alert_id: string;
  action: "READ" | "ACKNOWLEDGE";
  timestamp: string;
}
