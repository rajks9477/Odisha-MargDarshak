export interface DigitalTwinNode {
  id: string;
  node_type: string;
  name: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  current_status: string;
  connected_road_ids: string[];
}

export interface DigitalTwinEdge {
  road_id: string;
  road_name: string;
  start_node_id: string;
  end_node_id: string;
  status: string;
  risk_score: number;
  current_speed_kmh: number;
}

export interface DigitalTwinState {
  timestamp: string;
  network_health_index: number;
  nodes: DigitalTwinNode[];
  edges: DigitalTwinEdge[];
  active_incidents_count: number;
  active_shipments_count: number;
  active_vehicles_count: number;
  data_provenance: string;
}

export interface EntityDependency {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  current_status: string;
  dependency_chain: Array<{
    layer: string;
    id: string;
    name: string;
    status: string;
  }>;
}
