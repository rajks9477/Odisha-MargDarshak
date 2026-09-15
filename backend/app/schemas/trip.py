from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.driver import TripStatus, TripPriority

class TripStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: str
    old_status: str
    new_status: str
    changed_by: str
    reason: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime

class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_number: str
    driver_id: str
    vehicle_id: str
    vehicle_number: Optional[str] = None
    shipment_id: Optional[str] = None
    origin_name: str
    destination_name: str
    corridor_name: str
    priority: TripPriority
    cargo_type: str
    cargo_weight_tonnes: float
    distance_km: float
    status: TripStatus
    scheduled_start: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    estimated_arrival: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class TripDetailResponse(TripResponse):
    history: List[TripStatusHistoryResponse] = []
    active_tracking_session_id: Optional[str] = None

class TripAcceptRequest(BaseModel):
    notes: Optional[str] = None

class TripStartRequest(BaseModel):
    start_latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    start_longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    notes: Optional[str] = None

class TripPauseRequest(BaseModel):
    reason: Optional[str] = "Driver rest / mountain roadblock halt"
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)

class TripResumeRequest(BaseModel):
    reason: Optional[str] = "Halt cleared, resuming transit"
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)

class TripCompleteRequest(BaseModel):
    end_latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    end_longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    final_notes: Optional[str] = "Consignment delivered successfully at designated depot"
