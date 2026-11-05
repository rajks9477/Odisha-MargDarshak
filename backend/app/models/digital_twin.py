import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Boolean
from app.db.session import Base

class DigitalTwinNetworkNode(Base):
    __tablename__ = "digital_twin_network_nodes"

    id = Column(String(50), primary_key=True, default=lambda: f"NODE-{uuid.uuid4().hex[:8].upper()}", index=True)
    node_type = Column(String(50), nullable=False, default="WAREHOUSE_HUB") # WAREHOUSE_HUB, HOSPITAL, JUNCTION, BRIDGE
    name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    current_status = Column(String(50), default="OPERATIONAL", nullable=False) # OPERATIONAL, AT_RISK, ISOLATED

    connected_road_ids_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class DigitalTwinSnapshotRecord(Base):
    __tablename__ = "digital_twin_snapshots"

    id = Column(String(50), primary_key=True, default=lambda: f"SNP-{uuid.uuid4().hex[:8].upper()}", index=True)
    snapshot_title = Column(String(150), nullable=False, default="Routine State Snapshot")
    created_by_user_id = Column(String(50), nullable=True)

    active_incidents_count = Column(Integer, default=0, nullable=False)
    active_shipments_count = Column(Integer, default=0, nullable=False)
    total_corridors_count = Column(Integer, default=0, nullable=False)
    network_health_index = Column(Float, default=84.5, nullable=False) # 0 to 100%

    state_payload_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    data_provenance = Column(String(150), default="Odisha MargDarshak Digital Twin Engine V1.6 [DEMO STATE]", nullable=False)
