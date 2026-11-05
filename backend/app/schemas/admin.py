from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole, UserStatus
from app.schemas.user import UserResponse

class UserApprovalRequest(BaseModel):
    approve: bool
    rejection_reason: Optional[str] = None

class UserFilterQuery(BaseModel):
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    district: Optional[str] = None
    state: Optional[str] = None
    search: Optional[str] = None

class UserCreateAdminRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    role: UserRole
    state: Optional[str] = "Odisha"
    district: Optional[str] = "Khordha"
    department: Optional[str] = "Logistics & Transport"
    employee_id: Optional[str] = None
    designation: Optional[str] = None

class UserUpdateRoleDistrictRequest(BaseModel):
    role: Optional[UserRole] = None
    state: Optional[str] = None
    district: Optional[str] = None
    department: Optional[str] = None

class VehicleAssignmentRequest(BaseModel):
    vehicle_id: Optional[str] = None # None to unassign

class VehicleResponse(BaseModel):
    id: str
    vehicle_number: str
    vehicle_type: str
    model: str
    capacity_tonnes: float
    status: str
    district: Optional[str] = None
    state: Optional[str] = None
    assigned_driver_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedUsersResponse(BaseModel):
    total: int
    users: List[UserResponse]

class PaginatedAuditLogsResponse(BaseModel):
    total: int
    logs: List[AuditLogResponse]

