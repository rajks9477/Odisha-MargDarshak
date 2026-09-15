from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.route import RouteType, RouteRiskLevel

class RouteSegmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    route_id: str
    road_id: Optional[str] = None
    sequence_order: int
    road_name: str
    distance_km: float
    estimated_time_minutes: float
    status: str
    risk_penalty: float
    has_active_incident: bool
    incident_description: Optional[str] = None

class PlannedRouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: Optional[str] = None
    driver_id: str
    vehicle_id: Optional[str] = None
    origin_name: str
    destination_name: str
    origin_latitude: float
    origin_longitude: float
    destination_latitude: float
    destination_longitude: float
    route_type: RouteType
    corridor_title: str
    geometry_geojson: str
    distance_km: float
    estimated_time_minutes: float
    route_score: float
    risk_level: RouteRiskLevel
    risk_score: float
    risk_reasons: List[str] = []
    is_selected: bool
    route_version: int
    generated_at: datetime
    selected_at: Optional[datetime] = None

class PlannedRouteDetailResponse(PlannedRouteResponse):
    segments: List[RouteSegmentResponse] = []

class RouteCalculateRequest(BaseModel):
    trip_id: Optional[str] = None
    origin_name: Optional[str] = None
    destination_name: Optional[str] = None
    origin_latitude: Optional[float] = None
    origin_longitude: Optional[float] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    mission_priority: Optional[str] = "ESSENTIAL_SAFETY" # ESSENTIAL_SAFETY, BALANCED_LOGISTICS, FASTEST_TRANSIT
    avoid_unverified_incidents: Optional[bool] = False

class RouteSelectResponse(BaseModel):
    route_id: str
    trip_id: Optional[str] = None
    status: str
    message: str
    selected_at: datetime

class RouteDeviationCheckRequest(BaseModel):
    current_latitude: float = Field(..., ge=-90.0, le=90.0)
    current_longitude: float = Field(..., ge=-180.0, le=180.0)
    deviation_threshold_km: Optional[float] = 1.5

class RouteDeviationCheckResponse(BaseModel):
    route_id: str
    is_deviated: bool
    distance_from_route_km: float
    threshold_km: float
    status: str # ON_TRACK, CAUTION, OFF_ROUTE
    message: str

class RouteRecalculateRequest(BaseModel):
    current_latitude: float
    current_longitude: float
    reason: Optional[str] = "Live road disruption update"
