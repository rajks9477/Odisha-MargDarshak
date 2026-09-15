from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class SatelliteSceneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    satellite_source: str
    sensor_type: str
    acquisition_date: datetime
    cloud_cover_pct: float
    resolution_meters: float
    target_district: str
    state: str
    data_provenance: str

class SatelliteChangeDetectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    road_id: str
    road_name: str
    pre_event_date: datetime
    post_event_date: datetime
    anomaly_type: str
    affected_area_sqm: float
    confidence_score: float
    verification_status: str
    detected_at: datetime
    model_version: str
    summary: str

class CustomSatelliteAnalysisRequest(BaseModel):
    road_id: str
    pre_event_date: Optional[str] = "2026-08-15"
    post_event_date: Optional[str] = "2026-08-28"
    sensitivity: float = 0.85
