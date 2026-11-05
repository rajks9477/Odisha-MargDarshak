import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, Text, Boolean, ForeignKey
from app.db.session import Base

class CargoPriorityEnum(str, enum.Enum):
    NORMAL = "NORMAL"
    IMPORTANT = "IMPORTANT"
    CRITICAL = "CRITICAL"

class CargoCategoryEnum(str, enum.Enum):
    MEDICINES_MEDICAL = "MEDICINES_MEDICAL"
    EMERGENCY_FOOD_RATIONS = "EMERGENCY_FOOD_RATIONS"
    DISASTER_RECOVERY_EQUIPMENT = "DISASTER_RECOVERY_EQUIPMENT"
    PETROLEUM_FUEL = "PETROLEUM_FUEL"
    GENERAL_CIVIL_CARGO = "GENERAL_CIVIL_CARGO"

class ShipmentStatusEnum(str, enum.Enum):
    DISPATCH_PENDING = "DISPATCH_PENDING"
    IN_TRANSIT = "IN_TRANSIT"
    CORRIDOR_DELAYED = "CORRIDOR_DELAYED"
    DELIVERED = "DELIVERED"
    REROUTED_SAFETY = "REROUTED_SAFETY"

class WarehouseHub(Base):
    __tablename__ = "warehouse_hubs"

    id = Column(String(50), primary_key=True, default=lambda: f"WH-{uuid.uuid4().hex[:8].upper()}", index=True)
    name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    capacity_tonnes = Column(Float, default=500.0, nullable=False)
    current_occupancy_tonnes = Column(Float, default=120.0, nullable=False)
    contact_officer = Column(String(100), default="NODAL_LOGISTICS_OFFICER")
    hub_type = Column(String(50), default="CENTRAL_DEPOT") # CENTRAL_DEPOT, DISTRICT_WAREHOUSE, FIELD_STAGING_CAMP

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String(50), primary_key=True, default=lambda: f"SHP-{uuid.uuid4().hex[:8].upper()}", index=True)
    title = Column(String(200), nullable=False)
    cargo_category = Column(Enum(CargoCategoryEnum), nullable=False, default=CargoCategoryEnum.MEDICINES_MEDICAL)
    cargo_description = Column(Text, nullable=False)
    priority = Column(Enum(CargoPriorityEnum), nullable=False, default=CargoPriorityEnum.CRITICAL)

    weight_kg = Column(Float, default=2500.0, nullable=False)

    origin_hub_id = Column(String(50), ForeignKey("warehouse_hubs.id"), nullable=True)
    destination_hub_id = Column(String(50), ForeignKey("warehouse_hubs.id"), nullable=True)
    origin_name = Column(String(150), nullable=False, default="Bhubaneswar Central Medical & Relief Depot")
    destination_name = Column(String(150), nullable=False, default="Balasore District Headquarters Hospital & Relief Base")

    assigned_driver_id = Column(String(50), ForeignKey("users.id"), nullable=True, index=True)
    assigned_vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=True)
    active_trip_id = Column(String(50), ForeignKey("trips.id"), nullable=True)
    active_route_id = Column(String(50), ForeignKey("planned_routes.id"), nullable=True)

    status = Column(Enum(ShipmentStatusEnum), nullable=False, default=ShipmentStatusEnum.IN_TRANSIT)
    progress_pct = Column(Float, default=45.0, nullable=False) # 0 to 100

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    estimated_arrival = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    risk_impact_summary = Column(Text, default="Corridor monitored. Baitarani river flood alert active along NH-16.", nullable=True)

class ShipmentAuditLog(Base):
    __tablename__ = "shipment_audit_logs"

    id = Column(String(50), primary_key=True, default=lambda: f"SAL-{uuid.uuid4().hex[:8].upper()}", index=True)
    shipment_id = Column(String(50), ForeignKey("shipments.id"), nullable=False, index=True)
    action_type = Column(String(80), nullable=False) # CREATED, DRIVER_ASSIGNED, STATUS_UPDATED, REROUTED
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    performed_by_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    notes = Column(Text, nullable=True)
