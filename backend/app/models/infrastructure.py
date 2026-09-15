import uuid
from datetime import datetime, timezone
import enum
from typing import Optional
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from app.db.session import Base

class InfrastructureType(str, enum.Enum):
    HOSPITAL = "HOSPITAL"
    WAREHOUSE = "WAREHOUSE"
    RELIEF_CENTER = "RELIEF_CENTER"
    BRIDGE = "BRIDGE"
    EMERGENCY_FACILITY = "EMERGENCY_FACILITY"
    FUEL_STATION = "FUEL_STATION"
    POLICE_POST = "POLICE_POST"
    PWD_DEPOT = "PWD_DEPOT"

class InfrastructureStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    HIGH_CAPACITY = "HIGH_CAPACITY"
    LIMITED_SERVICE = "LIMITED_SERVICE"
    CLOSED = "CLOSED"

class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id = Column(String(50), primary_key=True, default=lambda: f"INFRA-{uuid.uuid4().hex[:8].upper()}", index=True)
    name = Column(String(150), nullable=False, index=True)
    type = Column(Enum(InfrastructureType), nullable=False, index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    district_name = Column(String(100), nullable=False, index=True)
    district_id = Column(String(50), nullable=True)
    state = Column(String(100), nullable=False, index=True)
    
    status = Column(Enum(InfrastructureStatus), nullable=False, default=InfrastructureStatus.OPERATIONAL, index=True)
    capacity_metric = Column(String(100), nullable=True) # e.g. "450 Beds", "5000 MT Rice Storage", "30,000 Litres Diesel"
    contact_number = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    
    is_emergency_critical = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_inspected = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
