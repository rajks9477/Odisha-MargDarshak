export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface RiskFactor {
  name: string;
  category: "WEATHER" | "TERRAIN" | "HISTORICAL" | "FIELD_REPORT" | "TRAFFIC";
  contribution_pts: number;
  observed_value: string;
  impact_direction: "INCREASES_RISK" | "BENIGN";
}

export interface RiskPrediction {
  prediction_id: string;
  road_id: string;
  road_name: string;
  risk_score: number;
  risk_level: RiskLevel;
  confidence_pct: number;
  model_version: string;
  predicted_at: string;
  prediction_horizon_hours: number;
  contributing_factors: RiskFactor[];
  explanation_summary: string;
  data_sources: string[];
}

export interface RoadRiskSummary {
  road_id: string;
  road_name: string;
  status: string;
  risk_score: number;
  risk_level: RiskLevel;
  confidence_pct: number;
  primary_hazard: string;
  last_evaluated_at: string;
}

export interface RouteRiskPrediction {
  route_id: string;
  composite_risk_score: number;
  composite_risk_level: RiskLevel;
  max_hazard_segment_name: string;
  max_hazard_risk_score: number;
  confidence_pct: number;
  model_version: string;
  predicted_at: string;
  top_contributing_factors: RiskFactor[];
  explanation_summary: string;
  segment_risks: RoadRiskSummary[];
}

export interface ModelInfo {
  id: string;
  model_name: string;
  model_version: string;
  algorithm: string;
  training_dataset_version: string;
  trained_at: string;
  roc_auc: number;
  pr_auc: number;
  f1_score: number;
  recall: number;
  precision: number;
  status: string;
}
