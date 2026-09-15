from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class DigitalTwinNodeSchema(BaseModel):
    id: str
    node_type: str
    name: str
    latitude: float
    longitude: float
    district: str
    state: str
    current_status: str
    connected_road_ids: List[str]

class DigitalTwinEdgeSchema(BaseModel):
    road_id: str
    road_name: str
    start_node_id: str
    end_node_id: str
    status: str
    risk_score: float
    current_speed_kmh: float

class DigitalTwinNetworkStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime
    network_health_index: float
    nodes: List[DigitalTwinNodeSchema]
    edges: List[DigitalTwinEdgeSchema]
    active_incidents_count: int
    active_shipments_count: int
    active_vehicles_count: int
    data_provenance: str

class EntityDependencyResponse(BaseModel):
    entity_id: str
    entity_name: str
    entity_type: str
    current_status: str
    dependency_chain: List[Dict[str, Any]]

class CreateSnapshotRequest(BaseModel):
    snapshot_title: Optional[str] = "Command Center Manual Snapshot"

class DigitalTwinSnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    snapshot_title: str
    created_by_user_id: Optional[str]
    active_incidents_count: int
    active_shipments_count: int
    total_corridors_count: int
    network_health_index: float
    created_at: datetime
    data_provenance: str
