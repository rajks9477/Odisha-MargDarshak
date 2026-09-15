export interface RegionalCorridorHealth {
  state: string;
  state_code: string;
  total_corridors: number;
  open_corridors: number;
  restricted_corridors: number;
  critical_blocked_corridors: number;
  active_incidents_count: number;
  overall_health_status: "HEALTHY" | "WATCH" | "CRITICAL_ALERT";
}

export interface CommandCenterIncident {
  id: string;
  incident_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  road_id?: string;
  road_name: string;
  district_name: string;
  state: string;
  status: string;
  description: string;
  created_at: string;
}

export interface CommandCenterSummary {
  total_active_incidents: number;
  pending_verifications_count: number;
  critical_risk_corridors: number;
  active_emergency_shipments: number;
  affected_districts_count: number;
  active_imd_alerts_count: number;
  regional_corridors: RegionalCorridorHealth[];
  last_updated: string;
  data_provenance: string;
}
