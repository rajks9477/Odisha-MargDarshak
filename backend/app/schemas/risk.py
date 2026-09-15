from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.risk import RiskLevelEnum, ModelStatusEnum

class RiskFactorResponse(BaseModel):
    name: str
    category: str # "WEATHER", "TERRAIN", "HISTORICAL", "FIELD_REPORT", "TRAFFIC"
    contribution_pts: float
    observed_value: str
    impact_direction: str # "INCREASES_RISK" | "BENIGN"

class RiskPredictionRequest(BaseModel):
    road_id: str
    prediction_horizon_hours: Optional[int] = Field(default=6, ge=1, le=72)
    custom_rainfall_override_mm: Optional[float] = None

class RiskPredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    prediction_id: str
    road_id: str
    road_name: str
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: RiskLevelEnum
    confidence_pct: float = Field(..., ge=0.0, le=100.0)
    model_version: str
    predicted_at: datetime
    prediction_horizon_hours: int
    contributing_factors: List[RiskFactorResponse]
    explanation_summary: str
    data_sources: List[str]

class RoadRiskSummaryResponse(BaseModel):
    road_id: str
    road_name: str
    status: str
    risk_score: float
    risk_level: RiskLevelEnum
    confidence_pct: float
    primary_hazard: str
    last_evaluated_at: datetime

class ModelRegistryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    model_name: str
    model_version: str
    algorithm: str
    training_dataset_version: str
    trained_at: datetime
    roc_auc: float
    pr_auc: float
    f1_score: float
    recall: float
    precision: float
    status: ModelStatusEnum

class RouteRiskPredictionResponse(BaseModel):
    route_id: str
    composite_risk_score: float
    composite_risk_level: RiskLevelEnum
    max_hazard_segment_name: str
    max_hazard_risk_score: float
    confidence_pct: float
    model_version: str
    predicted_at: datetime
    top_contributing_factors: List[RiskFactorResponse]
    explanation_summary: str
    segment_risks: List[RoadRiskSummaryResponse] = []

