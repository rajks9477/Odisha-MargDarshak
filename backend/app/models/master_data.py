import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Boolean, Enum
from app.db.session import Base

class MasterFacilityType(str):
    HOSPITAL = "HOSPITAL"
    RELIEF_CENTER = "RELIEF_CENTER"
    WAREHOUSE = "WAREHOUSE"
    FUEL_STATION = "FUEL_STATION"
    EMERGENCY_HELIPAD = "EMERGENCY_HELIPAD"

class MasterFacilityStatus(str):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"

class MasterFacilityRecord(Base):
    __tablename__ = "master_facilities"

    id = Column(String(50), primary_key=True, default=lambda: f"FAC-{uuid.uuid4().hex[:8].upper()}", index=True)
    name = Column(String(150), nullable=False, index=True)
    facility_type = Column(String(50), nullable=False, default="HOSPITAL", index=True) # HOSPITAL, RELIEF_CENTER, WAREHOUSE, FUEL_STATION, EMERGENCY_HELIPAD

    state = Column(String(100), nullable=False, default="Assam")
    district = Column(String(100), nullable=False, default="Khordha", index=True)
    address = Column(String(255), nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    capacity_metric = Column(String(100), nullable=True) # e.g. "500 Beds", "12000 MT Storage", "25000 Liters"
    contact_phone = Column(String(30), nullable=True)
    nodal_officer = Column(String(100), nullable=True)

    status = Column(String(30), nullable=False, default="ACTIVE", index=True) # ACTIVE, ARCHIVED, UNDER_MAINTENANCE
    data_provenance = Column(String(150), default="Odisha MargDarshak MDM Engine [DEMO / SIMULATED MASTER DATA]", nullable=False)
    version = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
