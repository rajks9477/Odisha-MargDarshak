import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Enum, DateTime, Integer, Text, Boolean
from app.db.session import Base

class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    DRIVER = "DRIVER"
    FIELD_OFFICER = "FIELD_OFFICER"
    DISTRICT_ADMIN = "DISTRICT_ADMIN"
    CENTRAL_ADMIN = "CENTRAL_ADMIN"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    SUSPENDED = "SUSPENDED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CITIZEN, index=True)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE, index=True)
    
    # Government & Field assignment fields
    department = Column(String(100), nullable=True) # e.g. "Public Works Department", "Disaster Management Authority", "Food & Civil Supplies"
    state = Column(String(100), nullable=True, default="Odisha") # e.g. "Odisha"
    district = Column(String(100), nullable=True, default="Khordha") # e.g. "Khordha", "Cuttack", "Puri", etc.
    employee_id = Column(String(50), nullable=True) # Government / Driver ID
    designation = Column(String(100), nullable=True) # e.g. "Assistant Executive Engineer", "Zonal Transport Officer"
    
    # Verification and approval info
    verified_by = Column(String(36), nullable=True) # User ID of the admin who approved
    verified_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Security tracking
    failed_logins = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
