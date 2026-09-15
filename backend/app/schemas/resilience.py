from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class ResilienceAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_name: str
    asset_type: str
    road_id: str
    district: str
    state: str
    resilience_score: float
    criticality_level: str
    alternate_routes_count: int
    dependent_districts_count: int
    daily_freight_tonnage: float
    planning_recommendation: str
    last_evaluated_at: datetime
    data_provenance: str

class ResilienceSummaryResponse(BaseModel):
    total_assets_evaluated: int
    critical_single_points_count: int
    high_dependency_count: int
    average_network_resilience_score: float
    top_priority_corridors: List[ResilienceAssetResponse]
