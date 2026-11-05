import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.alert import DriverAlert

class DriverAvailability(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ON_TRIP = "ON_TRIP"
    OFFLINE = "OFFLINE"

class VehicleStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    IN_TRANSIT = "IN_TRANSIT"
    MAINTENANCE = "MAINTENANCE"
    IDLE = "IDLE"

class TripStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    READY = "READY"
    STARTED = "STARTED"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class TripPriority(str, enum.Enum):
    CRITICAL_EMERGENCY = "CRITICAL_EMERGENCY"
    HIGH_PRIORITY = "HIGH_PRIORITY"
    STANDARD = "STANDARD"

class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    CRITICAL = "CRITICAL"

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    vehicle_number = Column(String(30), unique=True, index=True, nullable=False) # e.g. AS-01-GC-9104
    vehicle_type = Column(String(80), nullable=False) # e.g. Heavy Commercial Carrier, Reefer Truck
    model = Column(String(80), nullable=False) # e.g. Tata Prima 2830.K / BharatBenz 1617
    capacity_tonnes = Column(Float, nullable=False, default=10.0)
    fuel_type = Column(String(30), nullable=False, default="Diesel")
    status = Column(Enum(VehicleStatus), nullable=False, default=VehicleStatus.OPERATIONAL)
    
    # Registration & Department details
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True) # e.g. Food & Civil Supplies / Medical Supply Cell
    fitness_valid_until = Column(DateTime(timezone=True), nullable=True)
    
    assigned_driver_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    license_number = Column(String(50), nullable=False) # e.g. DL-0120200049182
    license_expiry = Column(DateTime(timezone=True), nullable=True)
    experience_years = Column(Integer, default=5, nullable=False)
    
    availability = Column(Enum(DriverAvailability), nullable=False, default=DriverAvailability.AVAILABLE)
    assigned_vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=True)
    
    # Current telemetric location placeholder
    current_location_name = Column(String(150), nullable=True) # e.g. Bhubaneswar Central Logistics Yard
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    
    last_active_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(36), primary_key=True, default=lambda: f"TRIP-{uuid.uuid4().hex[:8].upper()}", index=True)
    trip_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. TRIP-ODI-2026-0891
    driver_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False, index=True)
    shipment_id = Column(String(50), nullable=True, default=lambda: f"SHP-{uuid.uuid4().hex[:8].upper()}")
    
    origin_name = Column(String(150), nullable=False)
    destination_name = Column(String(150), nullable=False)
    corridor_name = Column(String(150), nullable=False) # e.g. NH-6 / NH-306 South NER Spine
    
    priority = Column(Enum(TripPriority), nullable=False, default=TripPriority.HIGH_PRIORITY)
    cargo_type = Column(String(100), nullable=False) # e.g. Essential Medicines & Baby Food
    cargo_weight_tonnes = Column(Float, nullable=False, default=5.0)
    
    distance_km = Column(Float, nullable=False, default=100.0)
    status = Column(Enum(TripStatus), nullable=False, default=TripStatus.ASSIGNED)
    
    scheduled_start = Column(DateTime(timezone=True), nullable=True)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)
    
    actual_distance_km = Column(Float, nullable=False, default=0.0)
    actual_duration_minutes = Column(Float, nullable=False, default=0.0)
    
    pause_started_at = Column(DateTime(timezone=True), nullable=True)
    pause_reason = Column(String(255), nullable=True)
    pause_duration_seconds = Column(Integer, nullable=False, default=0)
    
    route_id = Column(String(50), nullable=True, index=True)
    
    estimated_arrival = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class TripEvent(Base):
    __tablename__ = "trip_events"

    id = Column(String(50), primary_key=True, default=lambda: f"TEV-{uuid.uuid4().hex[:8].upper()}", index=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True) # TRIP_ASSIGNED, TRIP_STARTED, TRIP_PAUSED, TRIP_RESUMED, ROUTE_DEVIATION, TRIP_COMPLETED, TRIP_CANCELLED
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    details = Column(String(255), nullable=True)
    created_by = Column(String(36), nullable=False) # user_id or "SYSTEM"
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class TripStatusHistory(Base):
    __tablename__ = "trip_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    old_status = Column(String(30), nullable=False)
    new_status = Column(String(30), nullable=False)
    changed_by = Column(String(36), nullable=False) # user_id or system
    reason = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
