from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.incident import IncidentType, IncidentSeverity, IncidentStatus

class IncidentEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    file_url: str
    file_name: str
    media_type: str
    file_size_bytes: int
    uploaded_by: str
    uploaded_at: datetime

class IncidentAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    user_id: str
    user_name: Optional[str] = None
    user_role: str
    action: str
    old_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None
    timestamp: datetime

class IncidentReportCreate(BaseModel):
    client_idempotency_key: Optional[str] = None
    type: IncidentType
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    description: str = Field(..., min_length=3, max_length=2000)
    voice_transcript: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    gps_accuracy: Optional[float] = 5.0
    location_source: Optional[str] = "GPS"
    trip_id: Optional[str] = None
    is_offline_submission: Optional[bool] = False
    evidence_urls: Optional[List[str]] = []

class IncidentReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    client_idempotency_key: Optional[str] = None
    reporter_id: str
    reporter_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    trip_id: Optional[str] = None
    type: IncidentType
    severity: IncidentSeverity
    description: str
    voice_transcript: Optional[str] = None
    latitude: float
    longitude: float
    gps_accuracy: Optional[float] = None
    location_source: str = "GPS"
    road_id: Optional[str] = None
    road_name: Optional[str] = None
    district_id: Optional[str] = None
    district_name: Optional[str] = None
    state: Optional[str] = None
    status: IncidentStatus
    evidence_quality_score: float
    is_offline_submission: bool
    is_possible_duplicate: bool
    parent_incident_id: Optional[str] = None
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    resolution_notes: Optional[str] = None
    verified_by: Optional[str] = None
    resolved_by: Optional[str] = None
    action_taken: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    verified_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

class IncidentStatusResponse(BaseModel):
    id: str
    status: IncidentStatus
    type: IncidentType
    severity: IncidentSeverity
    road_name: Optional[str] = None
    location_source: str = "GPS"
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    resolution_notes: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class IncidentDetailResponse(IncidentReportResponse):
    evidence: List[IncidentEvidenceResponse] = []
    audit_logs: List[IncidentAuditLogResponse] = []
    nearby_duplicate_count: int = 0

class IncidentVerifyRequest(BaseModel):
    verification_notes: str = Field(..., min_length=3, max_length=1000)
    correct_road_id: Optional[str] = None
    correct_severity: Optional[IncidentSeverity] = None
    action_taken: Optional[str] = "PWD_EARTHMOVERS_DEPLOYED" # e.g. PWD_EARTHMOVERS_DEPLOYED, TRAFFIC_POLICE_DISPATCHED, SINGLE_LANE_REGULATED

class IncidentRejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=3, max_length=1000)

class IncidentRequestInfoRequest(BaseModel):
    inquiry_message: str = Field(..., min_length=3, max_length=1000)

class IncidentResolveRequest(BaseModel):
    resolution_notes: str = Field(..., min_length=3, max_length=1000)
    reopened_road_status: Optional[str] = "GREEN" # GREEN, YELLOW

class OfflineIncidentBatchSync(BaseModel):
    reports: List[IncidentReportCreate]
