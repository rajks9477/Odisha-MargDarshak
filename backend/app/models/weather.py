import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, Text, Boolean, ForeignKey
from app.db.session import Base

class DisasterTypeEnum(str, enum.Enum):
    LANDSLIDE = "LANDSLIDE"
    FLASH_FLOOD = "FLASH_FLOOD"
    CLOUD_BURST = "CLOUD_BURST"
    RIVER_OVERFLOW = "RIVER_OVERFLOW"
    EARTHQUAKE = "EARTHQUAKE"
    CYCLONE_WIND = "CYCLONE_WIND"
    CYCLONE = "CYCLONE"

class DisasterSeverityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class DisasterStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MONITORED = "MONITORED"
    RESOLVED = "RESOLVED"

class DisasterAlertEvent(Base):
    __tablename__ = "disaster_alert_events"

    id = Column(String(50), primary_key=True, default=lambda: f"DST-{uuid.uuid4().hex[:8].upper()}", index=True)
    title = Column(String(200), nullable=False)
    hazard_type = Column(Enum(DisasterTypeEnum), nullable=False, default=DisasterTypeEnum.FLASH_FLOOD)
    severity = Column(Enum(DisasterSeverityEnum), nullable=False, default=DisasterSeverityEnum.HIGH)
    status = Column(Enum(DisasterStatusEnum), nullable=False, default=DisasterStatusEnum.ACTIVE)

    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    affected_highway = Column(String(100), nullable=False, default="NH-6")

    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)

    latitude = Column(Float, nullable=False, default=25.20)
    longitude = Column(Float, nullable=False, default=92.35)

    issued_by = Column(String(150), nullable=False, default="IMD Meteorological Centre, Bhubaneswar")
    issued_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=True)

    source = Column(String(100), default="IMD_NDMA_SIMULATION_FEED", nullable=False)
    data_quality = Column(String(50), default="VERIFIED_GOVT_SIMULATION", nullable=False)
