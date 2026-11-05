import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from app.db.session import Base

class ImpactAnalysisRecord(Base):
    __tablename__ = "impact_analysis_records"

    id = Column(String(50), primary_key=True, default=lambda: f"IMP-{uuid.uuid4().hex[:8].upper()}", index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=True, index=True)
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=False, index=True)

    hazard_type = Column(String(80), nullable=False, default="LANDSLIDE_MUDFLOW")
    severity = Column(String(30), nullable=False, default="HIGH")

    total_affected_vehicles = Column(Integer, default=12, nullable=False)
    total_affected_shipments = Column(Integer, default=3, nullable=False)
    critical_supplies_exposed = Column(Integer, default=2, nullable=False)
    total_estimated_delay_hours = Column(Float, default=4.5, nullable=False)

    affected_districts_json = Column(Text, default='["East Jaintia Hills", "Cachar", "Aizawl"]', nullable=False)
    impact_graph_json = Column(Text, nullable=False) # Serialized JSON of nodes and edges

    calculated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    model_version = Column(String(50), default="ODISHA-CASCADING-GRAPH-ENGINE-V1", nullable=False)
