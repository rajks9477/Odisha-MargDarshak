import uuid
import json
from datetime import datetime, timezone
import enum
from typing import Any, Dict, List
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from app.db.session import Base

class RoadStatus(str, enum.Enum):
    GREEN = "GREEN"    # Accessible - Fully operational
    YELLOW = "YELLOW"  # Caution - Minor disruption / single lane / rain
    ORANGE = "ORANGE"  # Major Disruption - High risk / mud accumulation
    RED = "RED"        # Blocked / Inaccessible - Impassable / active landslide

class IncidentType(str, enum.Enum):
    LANDSLIDE = "LANDSLIDE"
    ROAD_DAMAGE = "ROAD_DAMAGE"
    FLOOD_WATER = "FLOOD_WATER"
    TREE_FALL = "TREE_FALL"
    AVALANCHE_SNOW = "AVALANCHE_SNOW"
    BRIDGE_SCOUR = "BRIDGE_SCOUR"

class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    CRITICAL = "CRITICAL"

class Road(Base):
    __tablename__ = "roads"

    id = Column(String(50), primary_key=True, index=True) # e.g. "NH-16-BAITARANI-01"
    road_name = Column(String(150), nullable=False, index=True) # e.g. "NH-16 Coastal Trunk Corridor (Bhubaneswar - Balasore)"
    road_number = Column(String(30), nullable=False, index=True) # e.g. "NH-16"
    road_type = Column(String(50), nullable=False, default="National Highway") # e.g. National Highway, State Highway, Border Road
    
    # Stored as GeoJSON LineString string format: [[lon, lat], [lon, lat], ...]
    geometry_json = Column(Text, nullable=False)
    
    district_id = Column(String(50), nullable=True, index=True)
    district_name = Column(String(100), nullable=False, index=True) # e.g. "Bhadrak"
    state = Column(String(100), nullable=False, index=True) # e.g. "Odisha"
    
    status = Column(Enum(RoadStatus), nullable=False, default=RoadStatus.GREEN, index=True)
    status_reason = Column(String(255), nullable=True) # e.g. "Single-lane traffic near Baitarani bridge"
    average_speed_kmh = Column(Float, nullable=False, default=40.0)
    is_bridge_section = Column(Boolean, default=False)
    
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def get_coordinates(self) -> List[List[float]]:
        try:
            return json.loads(self.geometry_json)
        except Exception:
            return []

class Bridge(Base):
    __tablename__ = "bridges"

    id = Column(String(50), primary_key=True, index=True) # e.g. "BRG-BAITARANI-01"
    bridge_name = Column(String(150), nullable=False) # e.g. "Baitarani River Bridge"
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=True, index=True)
    
    # GeoJSON Point [lon, lat]
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    district_name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    
    status = Column(Enum(RoadStatus), nullable=False, default=RoadStatus.GREEN)
    capacity_tonnes = Column(Float, nullable=False, default=40.0)
    water_level_status = Column(String(50), nullable=True, default="NORMAL") # NORMAL, HIGH, OVERFLOW
    last_inspected = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class District(Base):
    __tablename__ = "districts"

    id = Column(String(50), primary_key=True, index=True) # e.g. "DIST-ODI-KHO"
    district_name = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    headquarters = Column(String(100), nullable=False)
    
    # GeoJSON Polygon string: [[[lon, lat], [lon, lat], ...]]
    boundary_json = Column(Text, nullable=False)
    
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)

    def get_polygon(self) -> List[List[List[float]]]:
        try:
            return json.loads(self.boundary_json)
        except Exception:
            return []

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, default=lambda: f"INC-{uuid.uuid4().hex[:8].upper()}", index=True)
    incident_type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False, default=IncidentSeverity.MODERATE)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    road_id = Column(String(50), nullable=True)
    road_name = Column(String(150), nullable=False)
    district_name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    
    status = Column(String(50), nullable=False, default="ACTIVE") # ACTIVE, RESOLVED, VERIFYING
    description = Column(Text, nullable=False)
    reported_by_role = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class DriverCurrentLocation(Base):
    __tablename__ = "driver_current_locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    driver_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    vehicle_id = Column(String(36), nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_meters = Column(Float, nullable=False, default=5.0)
    speed_kmh = Column(Float, nullable=True, default=0.0)
    heading_degrees = Column(Float, nullable=True, default=0.0)
    
    is_moving = Column(Boolean, default=False)
    nearest_road_name = Column(String(150), nullable=True)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class LocationHistory(Base):
    __tablename__ = "location_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    driver_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(String(36), nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_meters = Column(Float, nullable=False)
    speed_kmh = Column(Float, nullable=True)
    heading_degrees = Column(Float, nullable=True)
    
    client_timestamp = Column(DateTime(timezone=True), nullable=False)
    server_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    sync_status = Column(String(20), default="SYNCED", nullable=False) # SYNCED, OFFLINE_BATCH
