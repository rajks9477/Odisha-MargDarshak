from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.core.security import decode_token

security_scheme = HTTPBearer(auto_error=False)

# Fine-grained Permissions
PERMISSIONS = {
    UserRole.CITIZEN: [
        "view:public_roads",
        "report:incident",
        "view:alerts",
    ],
    UserRole.DRIVER: [
        "view:public_roads",
        "report:incident",
        "view:alerts",
        "view:assigned_routes",
        "update:driver_status",
        "view:emergency_diversions",
    ],
    UserRole.FIELD_OFFICER: [
        "view:public_roads",
        "report:incident",
        "view:alerts",
        "view:district_incidents",
        "verify:incident_reports",
        "update:road_clearance",
        "manage:checkpoints",
    ],
    UserRole.DISTRICT_ADMIN: [
        "view:public_roads",
        "report:incident",
        "view:alerts",
        "view:district_incidents",
        "verify:incident_reports",
        "update:road_clearance",
        "manage:checkpoints",
        "view:district_logistics",
        "approve:field_officers",
        "manage:district_routes",
    ],
    UserRole.CENTRAL_ADMIN: [
        "view:public_roads",
        "report:incident",
        "view:alerts",
        "view:district_incidents",
        "verify:incident_reports",
        "update:road_clearance",
        "manage:checkpoints",
        "view:district_logistics",
        "approve:field_officers",
        "manage:district_routes",
        "view:ner_command_center",
        "manage:all_users",
        "approve:district_admins",
        "view:audit_logs",
        "system:manage",
    ],
}

async def get_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not auth_credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_credentials.credentials
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token was not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.status == UserStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is currently pending administrative verification. Please contact your department administrator.",
        )
    elif current_user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact the NER-MargDarshak administrative desk.",
        )
    elif current_user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account registration was rejected. Reason: {current_user.rejection_reason or 'Verification criteria not met'}",
        )
    elif current_user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active.",
        )
    
    # Check if account is temporarily locked due to failed attempts
    if current_user.locked_until and current_user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked due to multiple failed login attempts.",
        )
    
    return current_user

def require_roles(allowed_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in {[r.value for r in allowed_roles]}, but user has role '{current_user.role.value}'",
            )
        return current_user
    return role_checker

def require_permissions(required_permissions: List[str]):
    async def permission_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_perms = PERMISSIONS.get(current_user.role, [])
        for perm in required_permissions:
            if perm not in user_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Missing required permission: {perm}",
                )
        return current_user
    return permission_checker
