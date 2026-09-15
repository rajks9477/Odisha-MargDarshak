from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class MasterEntitySummary(BaseModel):
    total_roads: int
    total_bridges: int
    total_facilities: int
    total_warehouses: int
    total_vehicles: int
    active_facilities_count: int
    archived_facilities_count: int
    data_provenance: str

class MasterFacilityCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    facility_type: str = "HOSPITAL" # HOSPITAL, RELIEF_CENTER, WAREHOUSE, FUEL_STATION, EMERGENCY_HELIPAD
    state: str = "Assam"
    district: str = "Kamrup"
    address: Optional[str] = None
    latitude: float = Field(..., ge=20.0, le=32.0)
    longitude: float = Field(..., ge=88.0, le=98.0)
    capacity_metric: Optional[str] = "500 Beds"
    contact_phone: Optional[str] = "+91361200100"
    nodal_officer: Optional[str] = "Dr. B. K. Sarma"

class MasterFacilityUpdateRequest(BaseModel):
    name: Optional[str] = None
    facility_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity_metric: Optional[str] = None
    contact_phone: Optional[str] = None
    nodal_officer: Optional[str] = None
    status: Optional[str] = None

class MasterFacilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    facility_type: str
    state: str
    district: str
    address: Optional[str]
    latitude: float
    longitude: float
    capacity_metric: Optional[str]
    contact_phone: Optional[str]
    nodal_officer: Optional[str]
    status: str
    data_provenance: str
    version: int
    created_at: datetime
    updated_at: datetime

class BulkImportItem(BaseModel):
    name: str
    facility_type: str = "HOSPITAL"
    state: str = "Assam"
    district: str = "Kamrup"
    latitude: float
    longitude: float
    capacity_metric: Optional[str] = None
    contact_phone: Optional[str] = None

class BulkImportRequest(BaseModel):
    items: List[BulkImportItem]
    overwrite_existing: bool = False

class BulkImportResult(BaseModel):
    total_processed: int
    created_count: int
    skipped_duplicates: int
    errors: List[str]
