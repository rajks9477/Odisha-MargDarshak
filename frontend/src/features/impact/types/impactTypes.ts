export interface ImpactNode {
  id: string;
  node_type: "INCIDENT" | "ROAD" | "ROUTE" | "VEHICLE" | "SHIPMENT" | "DISTRICT";
  name: string;
  status: string;
  risk_score: number;
  details?: string;
}

export interface ImpactEdge {
  source_id: string;
  target_id: string;
  relationship: "DISRUPTS" | "TRAVERSES" | "CARRIES" | "SUPPLIES";
}

export interface ImpactAnalysis {
  analysis_id: string;
  incident_id?: string;
  road_id: string;
  road_name: string;
  hazard_type: string;
  severity: string;
  total_affected_vehicles: number;
  total_affected_shipments: number;
  critical_supplies_exposed: number;
  total_estimated_delay_hours: number;
  affected_districts: string[];
  nodes: ImpactNode[];
  edges: ImpactEdge[];
  summary_chain: string;
  calculated_at: string;
  model_version: string;
}
