from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.driver import DriverAvailability, VehicleStatus, TripStatus, AlertSeverity

class DriverAvailabilityUpdateRequest(BaseModel):
    availability: DriverAvailability

class VehicleResponse(BaseModel):
    id: str
    vehicle_number: str
    vehicle_type: str
    model: str
    capacity_tonnes: float
    fuel_type: str
    status: VehicleStatus
    district: Optional[str] = None
    state: Optional[str] = None
    department: Optional[str] = None
    fitness_valid_until: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TripResponse(BaseModel):
    id: str
    trip_number: str
    driver_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    origin_name: str
    destination_name: str
    corridor_name: str
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
    actual_distance_km: Optional[float] = 0.0
    actual_duration_minutes: Optional[float] = 0.0
    pause_started_at: Optional[datetime] = None
    pause_reason: Optional[str] = None
    pause_duration_seconds: Optional[int] = 0
    route_id: Optional[str] = None
    estimated_arrival: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TripStartRequest(BaseModel):
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    notes: Optional[str] = "Driver verified freight & safety checklist"

class TripPauseRequest(BaseModel):
    reason: str = "Driver mountain rest / convoy halt"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class TripResumeRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class TripCompleteRequest(BaseModel):
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    notes: Optional[str] = "Consignment delivered safely to destination depot"
    final_distance_km: Optional[float] = None

class TripEventResponse(BaseModel):
    id: str
    trip_id: str
    event_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    details: Optional[str] = None
    created_by: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class TripProgressResponse(BaseModel):
    trip_id: str
    trip_number: str
    status: TripStatus
    total_distance_km: float
    distance_completed_km: float
    distance_remaining_km: float
    progress_percentage: float
    estimated_remaining_minutes: float
    current_road_name: str
    is_deviated: bool
    deviation_distance_km: float

from app.schemas.alert import DriverAlertResponse

class DriverProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    email: str
    license_number: str
    license_expiry: Optional[datetime] = None
    experience_years: int
    availability: DriverAvailability
    current_location_name: Optional[str] = None
    assigned_vehicle: Optional[VehicleResponse] = None
    active_trip: Optional[TripResponse] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    last_active_at: datetime

    model_config = ConfigDict(from_attributes=True)
