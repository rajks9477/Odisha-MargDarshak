export interface AnalyticsOverview {
  total_verified_incidents: number;
  critical_disruptions_count: number;
  average_corridor_delay_hours: number;
  active_critical_shipments: number;
  critical_infrastructure_vulnerabilities: number;
  network_health_index_pct: number;
  incident_change_pct: number;
  delay_change_pct: number;
  state_distribution: Record<string, number>;
  severity_breakdown: Record<string, number>;
  data_provenance: string;
}

export interface TrendDataPoint {
  period: string;
  incidents_count: number;
  blocked_corridors_count: number;
  average_delay_hours: number;
}

export interface DecisionSupportItem {
  id: string;
  title: string;
  category: string;
  urgency: string;
  affected_corridor: string;
  analytical_recommendation: string;
  justification: string;
}

export interface GeneratedReport {
  id: string;
  report_title: string;
  report_type: string;
  state_filter: string;
  generated_by_user_id?: string;
  created_at: string;
  data_provenance: string;
  summary_data: Record<string, any>;
}
