from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.weather import DisasterTypeEnum, DisasterSeverityEnum, DisasterStatusEnum

class WeatherObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    location_name: str
    district: Optional[str] = "Bhadrak"
    state: Optional[str] = "Odisha"
    latitude: float
    longitude: float
    rainfall_1h_mm: float
    rainfall_6h_mm: float
    rainfall_24h_mm: float
    rainfall_7d_mm: float
    temperature_c: float
    humidity_pct: float
    wind_speed_kmh: float = 18.5
    visibility_meters: int = 1500
    weather_warning_level: str = "ORANGE" # GREEN, YELLOW, ORANGE, RED
    recorded_at: datetime
    source: str
    data_quality: str

class DisasterAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    hazard_type: DisasterTypeEnum
    severity: DisasterSeverityEnum
    status: DisasterStatusEnum
    district: str
    state: str
    affected_highway: str
    description: str
    recommended_action: Optional[str] = None
    latitude: float
    longitude: float
    issued_by: str
    issued_at: datetime
    valid_until: Optional[datetime] = None
    source: str
    data_quality: str

class RegionalWeatherSummaryResponse(BaseModel):
    state: str
    district: str
    primary_condition: str
    temperature_range_c: str
    max_rainfall_24h_mm: float
    active_warning_level: str
    active_disasters_count: int
    data_source: str
    last_updated: datetime

class IngestFeedRequest(BaseModel):
    source_id: str
    feed_type: str # "WEATHER_AWS" | "DISASTER_ALERT"
    location_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    rainfall_24h_mm: Optional[float] = 0.0
    temperature_c: Optional[float] = 22.0
    hazard_title: Optional[str] = None
    hazard_type: Optional[DisasterTypeEnum] = None
    severity: Optional[DisasterSeverityEnum] = None
    description: Optional[str] = None
