import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Boolean
from app.db.session import Base

class ExternalConnectorRecord(Base):
    __tablename__ = "external_connectors"

    id = Column(String(50), primary_key=True, default=lambda: f"CONN-{uuid.uuid4().hex[:8].upper()}", index=True)
    name = Column(String(150), nullable=False, index=True)
    connector_type = Column(String(50), nullable=False, default="WEATHER_API") # WEATHER_API, SATELLITE_CATALOG, GIS_VECTOR, DISASTER_FEED, POLICE_CLOSURES
    endpoint_url = Column(String(255), nullable=False)
    auth_type = Column(String(50), default="BEARER_TOKEN", nullable=False)
    refresh_interval_minutes = Column(Integer, default=30, nullable=False)

    geographic_coverage = Column(String(150), default="NER 8 States (Assam, Meghalaya, AP, Mizoram, Nagaland, Manipur, Tripura, Sikkim)", nullable=False)
    license_type = Column(String(100), default="Open Government Data (OGD) India / Commercial API", nullable=False)

    status = Column(String(30), default="HEALTHY", nullable=False) # HEALTHY, DEGRADED, SYNCING, INACTIVE
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_success_at = Column(DateTime(timezone=True), nullable=True)

    total_records_ingested = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    data_provenance = Column(String(150), default="NER-MargDarshak Integration Hub [DEMO / SIMULATED ADAPTER]", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class IngestionBatchRecord(Base):
    __tablename__ = "ingestion_batches"

    id = Column(String(50), primary_key=True, default=lambda: f"BATCH-{uuid.uuid4().hex[:8].upper()}", index=True)
    connector_id = Column(String(50), nullable=False, index=True)
    connector_name = Column(String(150), nullable=False)

    status = Column(String(30), default="SUCCESS", nullable=False) # SUCCESS, PARTIAL_FAILURE, FAILED
    records_received = Column(Integer, default=0, nullable=False)
    records_promoted = Column(Integer, default=0, nullable=False)
    records_failed = Column(Integer, default=0, nullable=False)

    error_summary = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=240, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
