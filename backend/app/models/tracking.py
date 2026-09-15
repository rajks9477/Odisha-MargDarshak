import uuid
from datetime import datetime, timezone
import enum
from typing import Optional
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from app.db.session import Base

class TrackingStatus(str, enum.Enum):
    NOT_TRACKING = "NOT_TRACKING"
    READY = "READY"
    TRACKING = "TRACKING"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    GPS_UNAVAILABLE = "GPS_UNAVAILABLE"
    OFFLINE = "OFFLINE"
    STOPPED = "STOPPED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class LocationFreshness(str, enum.Enum):
    LIVE = "LIVE"
    STALE = "STALE"
    OFFLINE = "OFFLINE"

class GPSAccuracyGrade(str, enum.Enum):
    VALID = "VALID"
    LOW_ACCURACY = "LOW_ACCURACY"
    INVALID = "INVALID"

class TrackingSession(Base):
    __tablename__ = "tracking_sessions"

    id = Column(String(50), primary_key=True, default=lambda: f"TRK-{uuid.uuid4().hex[:8].upper()}", index=True)
    driver_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    
    status = Column(Enum(TrackingStatus), nullable=False, default=TrackingStatus.TRACKING, index=True)
    
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)
    
    total_distance_km = Column(Float, default=0.0, nullable=False)
    ping_count = Column(Integer, default=0, nullable=False)
    max_speed_kmh = Column(Float, default=0.0, nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class SessionLocationPing(Base):
    __tablename__ = "session_location_pings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(50), ForeignKey("tracking_sessions.id"), nullable=False, index=True)
    driver_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False, index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude_meters = Column(Float, nullable=True)
    accuracy_meters = Column(Float, nullable=False)
    speed_kmh = Column(Float, nullable=True, default=0.0)
    heading_degrees = Column(Float, nullable=True, default=0.0)
    
    nearest_road_id = Column(String(50), nullable=True, index=True)
    nearest_road_name = Column(String(150), nullable=True)
    
    accuracy_grade = Column(String(30), default="VALID", nullable=False) # VALID, LOW_ACCURACY, INVALID
    is_valid = Column(Boolean, default=True, nullable=False)
    is_anomalous = Column(Boolean, default=False, nullable=False)
    validation_note = Column(String(255), nullable=True)
    
    client_timestamp = Column(DateTime(timezone=True), nullable=False)
    server_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    sync_status = Column(String(20), default="SYNCED", nullable=False) # SYNCED, OFFLINE_BATCH
