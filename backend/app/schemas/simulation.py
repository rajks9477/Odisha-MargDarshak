from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class CreateSimulationRequest(BaseModel):
    title: Optional[str] = "What-If Highway Failure Scenario"
    target_road_id: str = "NH-16-BAITARANI-01"
    disaster_type: str = "FLOOD_INUNDATION"
    severity_level: str = "CRITICAL"
    duration_hours: float = 12.0

class SimulationScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    target_road_id: str
    target_road_name: str
    disaster_type: str
    severity_level: str
    duration_hours: float
    status: str
    created_at: datetime
    data_provenance: str

class SimulationResultResponse(BaseModel):
    scenario: SimulationScenarioResponse
    affected_roads_count: int
    alternate_route_id: str
    alternate_route_name: str
    delayed_shipments_count: int
    extra_delay_hours: float
    affected_districts: List[str]
    summary_markdown: str

class CompareScenariosRequest(BaseModel):
    scenario_id_1: str
    scenario_id_2: str
