from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.logistics import CargoPriorityEnum, CargoCategoryEnum, ShipmentStatusEnum

class WarehouseHubResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    capacity_tonnes: float
    current_occupancy_tonnes: float
    contact_officer: str
    hub_type: str

class ShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    cargo_category: CargoCategoryEnum
    cargo_description: str
    priority: CargoPriorityEnum
    weight_kg: float
    origin_name: str
    destination_name: str
    assigned_driver_id: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None
    active_trip_id: Optional[str] = None
    active_route_id: Optional[str] = None
    status: ShipmentStatusEnum
    progress_pct: float
    created_at: datetime
    dispatched_at: Optional[datetime] = None
    estimated_arrival: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    risk_impact_summary: Optional[str] = None

class CreateShipmentRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    cargo_category: CargoCategoryEnum = CargoCategoryEnum.MEDICINES_MEDICAL
    cargo_description: str
    priority: CargoPriorityEnum = CargoPriorityEnum.CRITICAL
    weight_kg: float = Field(default=1500.0, gt=0.0)
    origin_name: str = "Guwahati Central Depot"
    destination_name: str = "Silchar Civil Hospital & Relief Camp"
    assigned_driver_id: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None

class UpdateShipmentStatusRequest(BaseModel):
    status: ShipmentStatusEnum
    progress_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    notes: Optional[str] = None

class LogisticsMetricsResponse(BaseModel):
    active_shipments_count: int
    critical_relief_shipments_count: int
    delayed_corridors_count: int
    total_in_transit_tonnes: float
    delivered_today_count: int
    data_source: str
