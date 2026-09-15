from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole, UserStatus

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: str
    role: UserRole
    status: UserStatus
    department: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    permissions: List[str] = []

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse

class UserUpdateProfile(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
