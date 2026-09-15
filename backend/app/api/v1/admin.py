from datetime import datetime, timezone
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, desc

from app.core.rbac import require_roles, require_permissions, PERMISSIONS
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.audit import AuditLog
from app.schemas.user import UserResponse
from app.schemas.admin import (
    UserApprovalRequest,
    PaginatedUsersResponse,
    PaginatedAuditLogsResponse,
    AuditLogResponse,
)

router = APIRouter(prefix="/admin", tags=["Administration & Approvals"])

def build_user_response(user: User) -> UserResponse:
    perms = PERMISSIONS.get(user.role, [])
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        status=user.status,
        department=user.department,
        state=user.state,
        district=user.district,
        employee_id=user.employee_id,
        designation=user.designation,
        verified_at=user.verified_at,
        created_at=user.created_at,
        permissions=perms
    )

@router.get("/users/pending", response_model=PaginatedUsersResponse)
async def list_pending_users(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    query = select(User).filter(User.status == UserStatus.PENDING_APPROVAL)
    
    # District Admins can only see pending users in their assigned district
    if current_user.role == UserRole.DISTRICT_ADMIN:
        if current_user.district:
            query = query.filter(User.district == current_user.district)
        # District admins only approve Field Officers
        query = query.filter(User.role == UserRole.FIELD_OFFICER)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Pagination
    query = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedUsersResponse(
        total=total,
        users=[build_user_response(u) for u in users]
    )

@router.get("/users", response_model=PaginatedUsersResponse)
async def list_all_users(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    role: Optional[UserRole] = None,
    user_status: Optional[UserStatus] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> Any:
    query = select(User)

    if current_user.role == UserRole.DISTRICT_ADMIN:
        if current_user.district:
            query = query.filter(User.district == current_user.district)
    else:
        if district:
            query = query.filter(User.district == district)
        if state:
            query = query.filter(User.state == state)

    if role:
        query = query.filter(User.role == role)
    if user_status:
        query = query.filter(User.status == user_status)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(User.name).like(s),
                func.lower(User.email).like(s),
                User.phone.like(s),
                func.lower(User.employee_id).like(s)
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedUsersResponse(
        total=total,
        users=[build_user_response(u) for u in users]
    )

@router.post("/users/{user_id}/approve", response_model=UserResponse)
async def approve_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).filter(User.id == user_id))
    target_user = result.scalars().first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Permission boundaries: District Admin can only approve Field Officers in their district
    if current_user.role == UserRole.DISTRICT_ADMIN:
        if target_user.role != UserRole.FIELD_OFFICER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="District Admins can only approve Field Officers",
            )
        if target_user.district != current_user.district:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot approve officer outside your assigned district ({current_user.district})",
            )

    target_user.status = UserStatus.ACTIVE
    target_user.verified_by = current_user.id
    target_user.verified_at = datetime.now(timezone.utc)
    target_user.rejection_reason = None

    audit = AuditLog(
        user_id=target_user.id,
        user_email=target_user.email,
        action="USER_APPROVED",
        details=f"Approved by {current_user.name} ({current_user.role.value})"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(target_user)

    return build_user_response(target_user)

@router.post("/users/{user_id}/reject", response_model=UserResponse)
async def reject_user(
    user_id: str,
    payload: UserApprovalRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).filter(User.id == user_id))
    target_user = result.scalars().first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if current_user.role == UserRole.DISTRICT_ADMIN:
        if target_user.role != UserRole.FIELD_OFFICER or target_user.district != current_user.district:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to reject this user",
            )

    target_user.status = UserStatus.REJECTED
    target_user.rejection_reason = payload.rejection_reason or "Department verification criteria not fulfilled"
    target_user.verified_by = current_user.id
    target_user.verified_at = datetime.now(timezone.utc)

    audit = AuditLog(
        user_id=target_user.id,
        user_email=target_user.email,
        action="USER_REJECTED",
        details=f"Rejected by {current_user.name} ({current_user.role.value}). Reason: {target_user.rejection_reason}"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(target_user)

    return build_user_response(target_user)

@router.post("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    new_status: UserStatus,
    current_user: User = Depends(require_roles([UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).filter(User.id == user_id))
    target_user = result.scalars().first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    target_user.status = new_status
    audit = AuditLog(
        user_id=target_user.id,
        user_email=target_user.email,
        action="USER_STATUS_UPDATE",
        details=f"Status changed to {new_status.value} by Central Admin {current_user.name}"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(target_user)

    return build_user_response(target_user)

from app.core.security import get_password_hash
from app.models.driver import Vehicle
from app.schemas.admin import (
    UserApprovalRequest,
    UserCreateAdminRequest,
    UserUpdateRoleDistrictRequest,
    VehicleAssignmentRequest,
    VehicleResponse,
    PaginatedUsersResponse,
    PaginatedAuditLogsResponse,
    AuditLogResponse,
)

@router.get("/audit-logs", response_model=PaginatedAuditLogsResponse)
async def list_audit_logs(
    current_user: User = Depends(require_roles([UserRole.CENTRAL_ADMIN, UserRole.DISTRICT_ADMIN])),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> Any:
    count_query = select(func.count(AuditLog.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = select(AuditLog).order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    return PaginatedAuditLogsResponse(
        total=total,
        logs=[AuditLogResponse.model_validate(l) for l in logs]
    )

@router.post("/users/create", response_model=UserResponse)
async def create_user_admin(
    payload: UserCreateAdminRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Provisions a new authorized user under administrative oversight."""
    # Hierarchy validation
    if current_user.role == UserRole.DISTRICT_ADMIN:
        if payload.role not in [UserRole.DRIVER, UserRole.FIELD_OFFICER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="District Admins can only create Drivers and Field Officers",
            )
        if payload.district != current_user.district:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot provision user outside assigned district ({current_user.district})",
            )

    # Check email / phone duplicates
    existing = await db.execute(
        select(User).filter(or_(User.email == payload.email, User.phone == payload.phone))
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or phone number already exists",
        )

    new_user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        status=UserStatus.ACTIVE,
        state=payload.state,
        district=payload.district,
        department=payload.department,
        employee_id=payload.employee_id,
        designation=payload.designation,
        verified_by=current_user.id,
        verified_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    await db.flush()

    audit = AuditLog(
        user_id=new_user.id,
        user_email=new_user.email,
        action="USER_PROVISIONED_BY_ADMIN",
        details=f"User {new_user.name} ({new_user.role.value}) created by {current_user.name}",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)

    return build_user_response(new_user)

@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role_or_scope(
    user_id: str,
    payload: UserUpdateRoleDistrictRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Updates role, state, or district for an existing user."""
    res = await db.execute(select(User).filter(User.id == user_id))
    target_user = res.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent self privilege escalation
    if target_user.id == current_user.id and payload.role and payload.role != current_user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-privilege escalation is strictly forbidden",
        )

    if current_user.role == UserRole.DISTRICT_ADMIN:
        if target_user.district != current_user.district:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify users outside your district",
            )
        if payload.role and payload.role not in [UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.CITIZEN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="District Admins cannot assign administrative roles",
            )

    if payload.role:
        target_user.role = payload.role
    if payload.state:
        target_user.state = payload.state
    if payload.district:
        target_user.district = payload.district
    if payload.department:
        target_user.department = payload.department

    audit = AuditLog(
        user_id=target_user.id,
        user_email=target_user.email,
        action="USER_ROLE_SCOPE_UPDATED",
        details=f"Scope updated by {current_user.name}: Role={target_user.role.value}, Dist={target_user.district}",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(target_user)

    return build_user_response(target_user)

@router.post("/users/{user_id}/suspend", response_model=UserResponse)
async def suspend_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Suspends user access immediately."""
    res = await db.execute(select(User).filter(User.id == user_id))
    target = res.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own account")

    target.status = UserStatus.SUSPENDED
    audit = AuditLog(
        user_id=target.id,
        user_email=target.email,
        action="USER_SUSPENDED",
        details=f"Suspended by {current_user.name} ({current_user.role.value})",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(target)
    return build_user_response(target)

@router.post("/users/{user_id}/reactivate", response_model=UserResponse)
async def reactivate_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Reactivates suspended user account."""
    res = await db.execute(select(User).filter(User.id == user_id))
    target = res.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.status = UserStatus.ACTIVE
    audit = AuditLog(
        user_id=target.id,
        user_email=target.email,
        action="USER_REACTIVATED",
        details=f"Reactivated by {current_user.name} ({current_user.role.value})",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(target)
    return build_user_response(target)

@router.get("/vehicles", response_model=List[VehicleResponse])
async def list_fleet_vehicles(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists fleet vehicles available for driver assignment."""
    stmt = select(Vehicle)
    if current_user.role == UserRole.DISTRICT_ADMIN and current_user.district:
        stmt = stmt.filter(Vehicle.district == current_user.district)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.put("/drivers/{driver_id}/assign-vehicle", response_model=VehicleResponse)
async def assign_vehicle_to_driver(
    driver_id: str,
    payload: VehicleAssignmentRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Assigns or unassigns a vehicle to a driver."""
    # Find driver
    u_res = await db.execute(select(User).filter(User.id == driver_id))
    driver = u_res.scalars().first()
    if not driver or driver.role != UserRole.DRIVER:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Unassign existing vehicles assigned to this driver
    un_stmt = select(Vehicle).filter(Vehicle.assigned_driver_id == driver_id)
    un_res = await db.execute(un_stmt)
    for v in un_res.scalars().all():
        v.assigned_driver_id = None

    if not payload.vehicle_id:
        await db.commit()
        raise HTTPException(status_code=200, detail="Vehicle unassigned successfully")

    # Find requested vehicle
    v_res = await db.execute(select(Vehicle).filter(Vehicle.id == payload.vehicle_id))
    target_vehicle = v_res.scalars().first()
    if not target_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    target_vehicle.assigned_driver_id = driver_id

    audit = AuditLog(
        user_id=driver.id,
        user_email=driver.email,
        action="VEHICLE_ASSIGNED",
        details=f"Assigned vehicle {target_vehicle.vehicle_number} to {driver.name} by {current_user.name}",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(target_vehicle)

    return target_vehicle

