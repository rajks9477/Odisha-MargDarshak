import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(150), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True) # e.g. LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, USER_APPROVED, USER_REJECTED
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(Text, nullable=True) # JSON or descriptive string
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
