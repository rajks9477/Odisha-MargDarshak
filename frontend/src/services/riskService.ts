import { ApiClient } from "@/lib/api";

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface RiskFactor {
  name: string;
  category: "WEATHER" | "TERRAIN" | "HISTORICAL" | "FIELD_REPORT" | "ROAD_CONDITION" | "TRAFFIC";
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

export interface ModelRegistryEntry {
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

export const RiskService = {
  async predictRoadRisk(
    roadId: string,
    horizonHours: number = 6,
    rainfallOverrideMm?: number
  ): Promise<RiskPrediction> {
    return await ApiClient.post<RiskPrediction>("/risk/predict", {
      road_id: roadId,
      prediction_horizon_hours: horizonHours,
      custom_rainfall_override_mm: rainfallOverrideMm,
    });
  },

  async getRoadRisk(roadId: string): Promise<RiskPrediction> {
    return await ApiClient.get<RiskPrediction>(`/risk/road/${roadId}`);
  },

  async getCorridorRiskSummary(): Promise<RoadRiskSummary[]> {
    return await ApiClient.get<RoadRiskSummary[]>("/risk/corridor-summary");
  },

  async getModelRegistry(): Promise<ModelRegistryEntry[]> {
    return await ApiClient.get<ModelRegistryEntry[]>("/risk/models");
  },
};
