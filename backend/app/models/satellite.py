import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from app.db.session import Base

class SatelliteSceneRecord(Base):
    __tablename__ = "satellite_scene_records"

    id = Column(String(50), primary_key=True, default=lambda: f"SAT-{uuid.uuid4().hex[:8].upper()}", index=True)
    satellite_source = Column(String(80), nullable=False, default="COPERNICUS_SENTINEL_2B")
    sensor_type = Column(String(50), nullable=False, default="MSI_MULTISPECTRAL")
    acquisition_date = Column(DateTime(timezone=True), nullable=False)
    cloud_cover_pct = Column(Float, nullable=False, default=4.2)
    resolution_meters = Column(Float, nullable=False, default=10.0)

    target_district = Column(String(100), nullable=False, default="Bhadrak")
    state = Column(String(100), nullable=False, default="Odisha")
    bounding_box_json = Column(Text, nullable=False, default='{"min_lat": 20.9, "max_lat": 21.2, "min_lng": 86.4, "max_lng": 86.8}')
    tile_url = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    data_provenance = Column(String(150), default="ESA Copernicus Open Access Hub [Simulated Sample Data]", nullable=False)

class SatelliteChangeDetectionRecord(Base):
    __tablename__ = "satellite_change_detections"

    id = Column(String(50), primary_key=True, default=lambda: f"SCD-{uuid.uuid4().hex[:8].upper()}", index=True)
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=False, index=True)
    road_name = Column(String(150), nullable=False, default="NH-16 Baitarani River Bridge")

    pre_event_date = Column(DateTime(timezone=True), nullable=False)
    post_event_date = Column(DateTime(timezone=True), nullable=False)

    anomaly_type = Column(String(80), nullable=False, default="FLOOD_INUNDATION_WASHOUT")
    affected_area_sqm = Column(Float, nullable=False, default=14500.0) # Area in square meters
    confidence_score = Column(Float, nullable=False, default=91.4)

    verification_status = Column(String(50), nullable=False, default="PENDING_OFFICER_VERIFICATION")
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    model_version = Column(String(80), default="ODISHA-SATELLITE-CV-CHANGE-ENGINE-V2.1", nullable=False)
