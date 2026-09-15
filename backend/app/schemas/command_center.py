from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class RegionalCorridorHealth(BaseModel):
    state: str
    state_code: str
    total_corridors: int
    open_corridors: int
    restricted_corridors: int
    critical_blocked_corridors: int
    active_incidents_count: int
    overall_health_status: str # "HEALTHY" | "WATCH" | "CRITICAL_ALERT"

class CommandCenterSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_active_incidents: int
    pending_verifications_count: int
    critical_risk_corridors: int
    active_emergency_shipments: int
    affected_districts_count: int
    active_imd_alerts_count: int
    regional_corridors: List[RegionalCorridorHealth]
    last_updated: datetime
    data_provenance: str

class IncidentActionRequest(BaseModel):
    notes: Optional[str] = "Officer verification following on-ground inspection."
