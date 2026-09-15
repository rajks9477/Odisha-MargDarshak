export interface SimulationScenario {
  id: string;
  title: string;
  target_road_id: string;
  target_road_name: string;
  disaster_type: string;
  severity_level: string;
  duration_hours: number;
  status: string;
  created_at: string;
  data_provenance: string;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  affected_roads_count: number;
  alternate_route_id: string;
  alternate_route_name: string;
  delayed_shipments_count: number;
  extra_delay_hours: number;
  affected_districts: string[];
  summary_markdown: string;
}

export interface CreateSimulationRequest {
  title?: string;
  target_road_id: string;
  disaster_type: string;
  severity_level: string;
  duration_hours: number;
}
