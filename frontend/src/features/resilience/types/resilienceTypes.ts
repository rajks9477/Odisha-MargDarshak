export interface ResilienceAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  road_id: string;
  district: string;
  state: string;
  resilience_score: number;
  criticality_level: string;
  alternate_routes_count: number;
  dependent_districts_count: number;
  daily_freight_tonnage: number;
  planning_recommendation: string;
  last_evaluated_at: string;
  data_provenance: string;
}

export interface ResilienceSummary {
  total_assets_evaluated: number;
  critical_single_points_count: number;
  high_dependency_count: number;
  average_network_resilience_score: number;
  top_priority_corridors: ResilienceAsset[];
}
