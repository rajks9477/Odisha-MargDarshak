import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from app.db.session import Base

class GeneratedReportRecord(Base):
    __tablename__ = "generated_reports"

    id = Column(String(50), primary_key=True, default=lambda: f"REP-{uuid.uuid4().hex[:8].upper()}", index=True)
    report_title = Column(String(150), nullable=False)
    report_type = Column(String(80), nullable=False, default="CORRIDOR_DISRUPTION_SUMMARY") # CORRIDOR_DISRUPTION_SUMMARY, LOGISTICS_RESILIENCE_REPORT, INCIDENT_SEVERITY_AUDIT

    state_filter = Column(String(100), nullable=False, default="ALL")
    date_range_start = Column(DateTime(timezone=True), nullable=True)
    date_range_end = Column(DateTime(timezone=True), nullable=True)

    generated_by_user_id = Column(String(50), nullable=True)
    summary_json = Column(Text, nullable=False, default="{}")
    csv_content = Column(Text, nullable=False, default="")

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    data_provenance = Column(String(150), default="Odisha MargDarshak Analytics Engine V1.0 [DEMO / SIMULATED REPORT]", nullable=False)
