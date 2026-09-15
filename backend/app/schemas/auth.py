import re
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.models.user import UserRole, UserStatus

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    confirm_password: str
    role: UserRole = UserRole.CITIZEN
    
    # Government & role specific fields
    department: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters long")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean_phone = re.sub(r"[^\d+]", "", v.strip())
        # Check standard 10 digit Indian number or +91 format
        if not re.match(r"^(\+91)?[6-9]\d{9}$", clean_phone):
            raise ValueError("Enter a valid 10-digit mobile number")
        return clean_phone

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        
        # Validate government role mandatory metadata
        if self.role in [UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN]:
            if not self.department:
                raise ValueError(f"Department is required for {self.role.value} registration")
            if not self.state:
                raise ValueError(f"State assignment is required for {self.role.value} registration")
            if self.role != UserRole.CENTRAL_ADMIN and not self.district:
                raise ValueError(f"District assignment is required for {self.role.value} registration")
            if not self.employee_id:
                raise ValueError(f"Employee/Officer ID is required for {self.role.value} registration")
        return self

class UserLoginRequest(BaseModel):
    email_or_phone: str
    password: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email_or_phone: str

class ResetPasswordRequest(BaseModel):
    token: str
    otp_code: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
