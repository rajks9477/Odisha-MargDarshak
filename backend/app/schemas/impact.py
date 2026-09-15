from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class ImpactNodeResponse(BaseModel):
    id: str
    node_type: str # "INCIDENT" | "ROAD" | "ROUTE" | "VEHICLE" | "SHIPMENT" | "DISTRICT"
    name: str
    status: str
    risk_score: float
    details: Optional[str] = None

class ImpactEdgeResponse(BaseModel):
    source_id: str
    target_id: str
    relationship: str # "DISRUPTS" | "TRAVERSES" | "CARRIES" | "SUPPLIES"

class ImpactAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    analysis_id: str
    incident_id: Optional[str] = None
    road_id: str
    road_name: str
    hazard_type: str
    severity: str
    total_affected_vehicles: int
    total_affected_shipments: int
    critical_supplies_exposed: int
    total_estimated_delay_hours: float
    affected_districts: List[str]
    nodes: List[ImpactNodeResponse]
    edges: List[ImpactEdgeResponse]
    summary_chain: str
    calculated_at: datetime
    model_version: str

class CustomImpactSimulationRequest(BaseModel):
    road_id: str
    hazard_type: str = "LANDSLIDE"
    severity: str = "CRITICAL"
    estimated_blockage_hours: float = 6.0
