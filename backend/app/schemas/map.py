from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.infrastructure import InfrastructureType, InfrastructureStatus
from app.models.gis import RoadStatus

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class InfrastructureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: InfrastructureType
    latitude: float
    longitude: float
    district_name: str
    state: str
    status: InfrastructureStatus
    capacity_metric: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    is_emergency_critical: bool

class MapLayerConfig(BaseModel):
    id: str
    name: str
    category: str
    default_visible: bool
    requires_role: Optional[str] = None
    icon: Optional[str] = None
    description: str

class MapSearchItem(BaseModel):
    id: str
    name: str
    type: str # PLACE, ROAD, DISTRICT, INFRASTRUCTURE, INCIDENT
    latitude: float
    longitude: float
    district: str
    state: str
    subtitle: Optional[str] = None

class RoadMatchResponse(BaseModel):
    latitude: float
    longitude: float
    matched_road_id: Optional[str] = None
    matched_road_name: str
    road_type: Optional[str] = None
    road_status: Optional[RoadStatus] = None
    distance_to_road_km: float
    district_name: Optional[str] = None
    state: Optional[str] = None
