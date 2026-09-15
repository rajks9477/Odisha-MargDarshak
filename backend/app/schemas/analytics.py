from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class AnalyticsOverviewResponse(BaseModel):
    total_verified_incidents: int
    critical_disruptions_count: int
    average_corridor_delay_hours: float
    active_critical_shipments: int
    critical_infrastructure_vulnerabilities: int
    network_health_index_pct: float

    # Period comparison (+/- % compared to previous 30-day baseline)
    incident_change_pct: float
    delay_change_pct: float

    state_distribution: Dict[str, int]
    severity_breakdown: Dict[str, int]
    data_provenance: str

class TrendDataPoint(BaseModel):
    period: str
    incidents_count: int
    blocked_corridors_count: int
    average_delay_hours: float

class DecisionSupportItem(BaseModel):
    id: str
    title: str
    category: str # INFRASTRUCTURE, LOGISTICS, WEATHER_PREPAREDNESS
    urgency: str # CRITICAL, HIGH, MODERATE
    affected_corridor: str
    analytical_recommendation: str
    justification: str

class GenerateReportRequest(BaseModel):
    report_title: Optional[str] = "Monthly Regional Infrastructure & Route Disruption Audit"
    report_type: str = "CORRIDOR_DISRUPTION_SUMMARY"
    state_filter: Optional[str] = "ALL"

class GeneratedReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    report_title: str
    report_type: str
    state_filter: str
    generated_by_user_id: Optional[str]
    created_at: datetime
    data_provenance: str
    summary_data: Dict[str, Any]
