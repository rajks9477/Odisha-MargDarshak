import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from app.db.session import Base

class ResilienceAssetRecord(Base):
    __tablename__ = "resilience_asset_records"

    id = Column(String(50), primary_key=True, default=lambda: f"INF-{uuid.uuid4().hex[:8].upper()}", index=True)
    asset_name = Column(String(150), nullable=False)
    asset_type = Column(String(80), nullable=False, default="BRIDGE_AND_TUNNEL") # BRIDGE_AND_TUNNEL, MOUNTAIN_PASS, HIGHWAY_CORRIDOR
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=False, index=True)

    district = Column(String(100), nullable=False, default="East Jaintia Hills")
    state = Column(String(100), nullable=False, default="Meghalaya")

    resilience_score = Column(Float, nullable=False, default=32.5) # 0 to 100% (lower = more vulnerable)
    criticality_level = Column(String(50), nullable=False, default="CRITICAL_SINGLE_POINT") # CRITICAL_SINGLE_POINT, HIGH_DEPENDENCY, MODERATE_REDUNDANCY, RESILIENT

    alternate_routes_count = Column(Integer, default=0, nullable=False)
    dependent_districts_count = Column(Integer, default=4, nullable=False)
    daily_freight_tonnage = Column(Float, default=45000.0, nullable=False)

    planning_recommendation = Column(Text, nullable=False, default="High Priority for Slope Stabilization, Retaining Wall & Tunneling")
    last_evaluated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    data_provenance = Column(String(150), default="NER-MargDarshak Resilience Engine V2.0 [ANALYTICAL RECOMMENDATION]", nullable=False)
