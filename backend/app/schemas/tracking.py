from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.tracking import TrackingStatus, LocationFreshness, GPSAccuracyGrade

class LocationPingCreate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_meters: float = Field(..., ge=0.0)
    altitude_meters: Optional[float] = None
    speed_kmh: Optional[float] = 0.0
    heading_degrees: Optional[float] = 0.0
    client_timestamp: datetime

class LocationPingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    driver_id: str
    vehicle_id: str
    latitude: float
    longitude: float
    altitude_meters: Optional[float] = None
    accuracy_meters: float
    speed_kmh: float
    heading_degrees: float
    nearest_road_id: Optional[str] = None
    nearest_road_name: Optional[str] = None
    accuracy_grade: str
    is_valid: bool
    is_anomalous: bool
    validation_note: Optional[str] = None
    client_timestamp: datetime
    server_timestamp: datetime
    sync_status: str

class TrackingSessionCreate(BaseModel):
    trip_id: Optional[str] = None
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    notes: Optional[str] = None

class TrackingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    driver_id: str
    vehicle_id: str
    trip_id: Optional[str] = None
    status: TrackingStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    total_distance_km: float
    ping_count: int
    max_speed_kmh: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TrackingSessionStopRequest(BaseModel):
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    notes: Optional[str] = "Driver completed scheduled freight transit"

class DriverCurrentLocationResponse(BaseModel):
    driver_id: str
    driver_name: str
    vehicle_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    trip_id: Optional[str] = None
    trip_number: Optional[str] = None
    latitude: float
    longitude: float
    accuracy_meters: float
    speed_kmh: float
    heading_degrees: float
    nearest_road_id: Optional[str] = None
    nearest_road_name: Optional[str] = None
    freshness: LocationFreshness
    tracking_status: TrackingStatus
    last_updated_at: datetime

class OfflineLocationBatchSync(BaseModel):
    session_id: str
    pings: List[LocationPingCreate]
