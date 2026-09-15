import uuid
from datetime import datetime, timezone
import enum
from typing import Optional
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from app.db.session import Base

class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class AlertType(str, enum.Enum):
    ROAD_BLOCKAGE = "ROAD_BLOCKAGE"
    BRIDGE_CLOSURE = "BRIDGE_CLOSURE"
    FLOOD_WARNING = "FLOOD_WARNING"
    LANDSLIDE_WARNING = "LANDSLIDE_WARNING"
    TRAFFIC_DISRUPTION = "TRAFFIC_DISRUPTION"
    ROUTE_DISRUPTION = "ROUTE_DISRUPTION"
    EMERGENCY_INSTRUCTION = "EMERGENCY_INSTRUCTION"
    TRIP_UPDATE = "TRIP_UPDATE"
    GOVERNMENT_DIRECTIVE = "GOVERNMENT_DIRECTIVE"
    SYSTEM_NOTICE = "SYSTEM_NOTICE"

class AlertStatus(str, enum.Enum):
    UNREAD = "UNREAD"
    READ = "READ"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    EXPIRED = "EXPIRED"

class DriverAlert(Base):
    __tablename__ = "driver_alerts"
    __table_args__ = {'extend_existing': True}

    id = Column(String(50), primary_key=True, default=lambda: f"ALT-{uuid.uuid4().hex[:8].upper()}", index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    
    severity = Column(Enum(AlertSeverity), nullable=False, default=AlertSeverity.MEDIUM, index=True)
    type = Column(Enum(AlertType), nullable=False, default=AlertType.ROAD_BLOCKAGE, index=True)
    source = Column(String(100), nullable=False, default="DDMA_REGIONAL") # e.g. DDMA, PWD, DISPATCH
    
    driver_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True) # Null for regional broadcast
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    incident_id = Column(String(50), ForeignKey("incident_reports.id"), nullable=True, index=True)
    
    road_id = Column(String(50), nullable=True, index=True)
    road_name = Column(String(150), nullable=True)
    location_name = Column(String(150), nullable=True)
    
    status = Column(Enum(AlertStatus), nullable=False, default=AlertStatus.UNREAD, index=True)
    is_read = Column(Boolean, default=False, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(String(50), primary_key=True, default=lambda: f"NOTIF-{uuid.uuid4().hex[:8].upper()}", index=True)
    alert_id = Column(String(50), ForeignKey("driver_alerts.id"), nullable=False, index=True)
    channel = Column(String(30), nullable=False, default="IN_APP") # IN_APP, PUSH, SMS, VOICE
    delivery_status = Column(String(30), nullable=False, default="DELIVERED") # PENDING, SENT, DELIVERED, FAILED
    
    sent_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    delivered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

class DriverNotificationPreference(Base):
    __tablename__ = "driver_notification_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    driver_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    language = Column(String(10), nullable=False, default="en-IN") # en-IN, hi-IN, bn-IN, as-IN
    
    allow_traffic_updates = Column(Boolean, default=True, nullable=False)
    allow_trip_updates = Column(Boolean, default=True, nullable=False)
    allow_weather_warnings = Column(Boolean, default=True, nullable=False)
    
    push_enabled = Column(Boolean, default=True, nullable=False)
    sms_enabled = Column(Boolean, default=True, nullable=False)
    voice_enabled = Column(Boolean, default=False, nullable=False)
    
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
