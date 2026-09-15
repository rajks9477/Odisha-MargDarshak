import uuid
from datetime import datetime, timezone
import enum
from typing import Optional, List
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from app.db.session import Base

class IncidentType(str, enum.Enum):
    FLOOD = "FLOOD"
    LANDSLIDE = "LANDSLIDE"
    ROAD_BLOCKAGE = "ROAD_BLOCKAGE"
    BRIDGE_DAMAGE = "BRIDGE_DAMAGE"
    ACCIDENT = "ACCIDENT"
    HEAVY_TRAFFIC = "HEAVY_TRAFFIC"
    ROAD_DAMAGE = "ROAD_DAMAGE"
    FALLEN_TREE = "FALLEN_TREE"
    DEBRIS = "DEBRIS"
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    WEATHER_HAZARD = "WEATHER_HAZARD"
    OTHER = "OTHER"

class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    DUPLICATE = "DUPLICATE"

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(String(50), primary_key=True, default=lambda: f"INC-{uuid.uuid4().hex[:8].upper()}", index=True)
    client_idempotency_key = Column(String(100), unique=True, index=True, nullable=True) # Duplicate prevention
    
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    reporter_name = Column(String(150), nullable=True)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=True, index=True)
    vehicle_number = Column(String(50), nullable=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    
    type = Column(Enum(IncidentType), nullable=False, index=True)
    severity = Column(Enum(IncidentSeverity), nullable=False, default=IncidentSeverity.MEDIUM, index=True)
    
    description = Column(Text, nullable=False)
    voice_transcript = Column(Text, nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    gps_accuracy = Column(Float, nullable=True, default=5.0)
    location_source = Column(String(20), default="GPS", nullable=False) # GPS or MANUAL
    
    # Auto-resolved spatial attributes
    road_id = Column(String(50), nullable=True, index=True)
    road_name = Column(String(150), nullable=True)
    district_id = Column(String(50), nullable=True, index=True)
    district_name = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    
    status = Column(Enum(IncidentStatus), nullable=False, default=IncidentStatus.PENDING_VERIFICATION, index=True)
    evidence_quality_score = Column(Float, default=75.0, nullable=False) # 0 to 100
    
    is_offline_submission = Column(Boolean, default=False, nullable=False)
    is_possible_duplicate = Column(Boolean, default=False, nullable=False)
    parent_incident_id = Column(String(50), nullable=True, index=True)
    
    # Officer Verification and Resolution
    review_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    verified_by = Column(String(150), nullable=True)
    resolved_by = Column(String(150), nullable=True)
    action_taken = Column(String(150), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    id = Column(String(50), primary_key=True, default=lambda: f"EVD-{uuid.uuid4().hex[:8].upper()}", index=True)
    incident_id = Column(String(50), ForeignKey("incident_reports.id"), nullable=False, index=True)
    
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    media_type = Column(String(80), nullable=False) # e.g. image/jpeg, image/png, audio/webm, video/mp4
    file_size_bytes = Column(Integer, nullable=False, default=0)
    
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class IncidentAuditLog(Base):
    __tablename__ = "incident_audit_logs"

    id = Column(String(50), primary_key=True, default=lambda: f"LOG-{uuid.uuid4().hex[:8].upper()}", index=True)
    incident_id = Column(String(50), ForeignKey("incident_reports.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user_name = Column(String(150), nullable=True)
    user_role = Column(String(50), nullable=False)
    
    action = Column(String(50), nullable=False) # SUBMITTED, VERIFIED, REJECTED, INFO_REQUESTED, RESOLVED, CLOSED, DUPLICATE_FLAGGED
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
