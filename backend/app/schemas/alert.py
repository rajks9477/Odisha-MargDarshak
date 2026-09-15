from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.alert import AlertSeverity, AlertType, AlertStatus

class DriverAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    message: str
    severity: AlertSeverity
    type: AlertType
    source: str
    driver_id: Optional[str] = None
    trip_id: Optional[str] = None
    incident_id: Optional[str] = None
    road_id: Optional[str] = None
    road_name: Optional[str] = None
    location_name: Optional[str] = None
    status: AlertStatus
    is_read: bool
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None

class NotificationPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    driver_id: str
    language: str
    allow_traffic_updates: bool
    allow_trip_updates: bool
    allow_weather_warnings: bool
    push_enabled: bool
    sms_enabled: bool
    voice_enabled: bool

class NotificationPreferenceUpdateRequest(BaseModel):
    language: Optional[str] = None
    allow_traffic_updates: Optional[bool] = None
    allow_trip_updates: Optional[bool] = None
    allow_weather_warnings: Optional[bool] = None
    push_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    voice_enabled: Optional[bool] = None

class OfflineAlertActionItem(BaseModel):
    alert_id: str
    action: str = Field(..., description="READ or ACKNOWLEDGE")
    timestamp: datetime

class OfflineAlertSyncRequest(BaseModel):
    actions: List[OfflineAlertActionItem]

class OfflineAlertSyncResponse(BaseModel):
    synced_count: int
    message: str
