import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Boolean
from app.db.session import Base

class SimulationScenarioRecord(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(String(50), primary_key=True, default=lambda: f"SIM-{uuid.uuid4().hex[:8].upper()}", index=True)
    title = Column(String(150), nullable=False, default="Hypothetical Disaster Scenario")
    description = Column(Text, nullable=True)

    target_road_id = Column(String(50), ForeignKey("roads.id"), nullable=False, index=True)
    target_road_name = Column(String(150), nullable=False, default="NH-6 Sonapur Highway")

    disaster_type = Column(String(80), nullable=False, default="LANDSLIDE_BLOCKAGE") # LANDSLIDE_BLOCKAGE, BRIDGE_FAILURE, FLASH_FLOOD
    severity_level = Column(String(50), nullable=False, default="CRITICAL")
    duration_hours = Column(Float, nullable=False, default=12.0)

    created_by_user_id = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="EXECUTED") # EXECUTED, SAVED, ARCHIVED

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    data_provenance = Column(String(150), default="NER-MargDarshak What-If Engine V1.8 [HYPOTHETICAL SIMULATION]", nullable=False)

class SimulationResultRecord(Base):
    __tablename__ = "simulation_results"

    id = Column(String(50), primary_key=True, default=lambda: f"SRES-{uuid.uuid4().hex[:8].upper()}", index=True)
    scenario_id = Column(String(50), ForeignKey("simulation_scenarios.id"), nullable=False, index=True)

    affected_roads_count = Column(Integer, default=1, nullable=False)
    alternate_route_id = Column(String(50), nullable=False, default="RTE-GUW-NAG-SIL-02")
    alternate_route_name = Column(String(150), nullable=False, default="Guwahati-Nagaon-Silchar Alternate Trunk")

    delayed_shipments_count = Column(Integer, default=2, nullable=False)
    extra_delay_hours = Column(Float, default=4.5, nullable=False)
    affected_districts_json = Column(Text, nullable=False, default='["East Jaintia Hills", "Cachar", "Dima Hasao"]')

    summary_markdown = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
