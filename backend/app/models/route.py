import uuid
import json
from datetime import datetime, timezone
import enum
from typing import List, Optional
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from app.db.session import Base

class RouteType(str, enum.Enum):
    RECOMMENDED = "RECOMMENDED"
    FASTEST = "FASTEST"
    ALTERNATE = "ALTERNATE"

class RouteRiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class PlannedRoute(Base):
    __tablename__ = "planned_routes"

    id = Column(String(50), primary_key=True, default=lambda: f"RTE-{uuid.uuid4().hex[:8].upper()}", index=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    driver_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=True, index=True)
    
    origin_name = Column(String(150), nullable=False)
    destination_name = Column(String(150), nullable=False)
    origin_latitude = Column(Float, nullable=False)
    origin_longitude = Column(Float, nullable=False)
    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)
    
    route_type = Column(Enum(RouteType), nullable=False, default=RouteType.RECOMMENDED, index=True)
    corridor_title = Column(String(150), nullable=False) # e.g. "NH-16 Primary Spine via Baitarani Bridge"
    
    # GeoJSON LineString coordinates string: [[lon, lat], [lon, lat], ...]
    geometry_geojson = Column(Text, nullable=False)
    
    distance_km = Column(Float, nullable=False)
    estimated_time_minutes = Column(Float, nullable=False)
    route_score = Column(Float, nullable=False, default=1.0) # Lower is better / safer
    
    risk_level = Column(Enum(RouteRiskLevel), nullable=False, default=RouteRiskLevel.LOW, index=True)
    risk_score = Column(Float, nullable=False, default=15.0) # 0 to 100
    
    # Stored as JSON array of risk warning strings
    risk_reasons_json = Column(Text, nullable=True, default="[]")
    
    is_selected = Column(Boolean, default=False, nullable=False, index=True)
    route_version = Column(Integer, default=1, nullable=False)
    
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    selected_at = Column(DateTime(timezone=True), nullable=True)

    def get_coordinates(self) -> List[List[float]]:
        try:
            return json.loads(self.geometry_geojson)
        except Exception:
            return []

    def get_risk_reasons(self) -> List[str]:
        try:
            return json.loads(self.risk_reasons_json or "[]")
        except Exception:
            return []

class RouteSegment(Base):
    __tablename__ = "route_segments"

    id = Column(String(50), primary_key=True, default=lambda: f"RTS-{uuid.uuid4().hex[:8].upper()}", index=True)
    route_id = Column(String(50), ForeignKey("planned_routes.id"), nullable=False, index=True)
    road_id = Column(String(50), nullable=True, index=True)
    
    sequence_order = Column(Integer, nullable=False)
    road_name = Column(String(150), nullable=False)
    distance_km = Column(Float, nullable=False)
    estimated_time_minutes = Column(Float, nullable=False)
    
    status = Column(String(30), nullable=False, default="GREEN") # GREEN, YELLOW, ORANGE, RED
    risk_penalty = Column(Float, nullable=False, default=1.0)
    has_active_incident = Column(Boolean, default=False, nullable=False)
    incident_description = Column(String(255), nullable=True)

class RouteEvent(Base):
    __tablename__ = "route_events"

    id = Column(String(50), primary_key=True, default=lambda: f"REV-{uuid.uuid4().hex[:8].upper()}", index=True)
    route_id = Column(String(50), ForeignKey("planned_routes.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # ROUTE_CALCULATED, ROUTE_SELECTED, DEVIATION_DETECTED, REROUTED
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
