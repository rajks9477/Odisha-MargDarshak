from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict
from app.models.gis import RoadStatus, IncidentType, IncidentSeverity

# GeoJSON Schemas
class GeoJSONLineStringGeometry(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]] # [[lon, lat], ...]

class GeoJSONPointGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [lon, lat]

class GeoJSONPolygonGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]] # [[[lon, lat], ...]]

class RoadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    road_name: str
    road_number: str
    road_type: str
    district_name: str
    state: str
    status: RoadStatus
    status_reason: Optional[str] = None
    average_speed_kmh: float
    is_bridge_section: bool
    coordinates: List[List[float]]
    last_updated: datetime

class RoadDetailResponse(RoadResponse):
    nearby_incidents: List[Dict[str, Any]] = []
    nearby_bridges: List[Dict[str, Any]] = []

class BridgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    bridge_name: str
    road_id: Optional[str] = None
    latitude: float
    longitude: float
    district_name: str
    state: str
    status: RoadStatus
    capacity_tonnes: float
    water_level_status: Optional[str] = "NORMAL"
    last_inspected: datetime

class DistrictResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    district_name: str
    state: str
    headquarters: str
    center_latitude: float
    center_longitude: float
    polygon: List[List[List[float]]]

class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    latitude: float
    longitude: float
    road_name: str
    district_name: str
    state: str
    status: str
    description: str
    created_at: datetime

class DriverLocationUpdateRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_meters: float = Field(..., ge=0.0)
    speed_kmh: Optional[float] = Field(0.0, ge=0.0)
    heading_degrees: Optional[float] = Field(0.0, ge=0.0, le=360.0)
    client_timestamp: Optional[datetime] = None

class DriverLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    driver_id: str
    driver_name: str
    vehicle_number: Optional[str] = None
    latitude: float
    longitude: float
    accuracy_meters: float
    speed_kmh: Optional[float] = 0.0
    heading_degrees: Optional[float] = 0.0
    is_moving: bool
    nearest_road_name: Optional[str] = None
    freshness: Optional[str] = "LIVE"
    tracking_status: Optional[str] = "TRACKING"
    last_updated: datetime

class OfflineLocationPing(BaseModel):
    local_id: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_meters: float = Field(..., ge=0.0)
    speed_kmh: Optional[float] = 0.0
    heading_degrees: Optional[float] = 0.0
    client_timestamp: datetime

class LocationBatchSyncRequest(BaseModel):
    locations: List[OfflineLocationPing]

class LocationBatchSyncResponse(BaseModel):
    synced_count: int
    synced_local_ids: List[str]
    message: str

