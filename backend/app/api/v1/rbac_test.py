from typing import Any
from fastapi import APIRouter, Depends
from app.core.rbac import require_roles, require_permissions
from app.models.user import User, UserRole

router = APIRouter(prefix="/rbac-test", tags=["RBAC Enforcement Verification"])

@router.get("/citizen-zone")
async def citizen_zone_endpoint(
    current_user: User = Depends(require_roles([
        UserRole.CITIZEN, UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN
    ]))
) -> Any:
    return {
        "status": "success",
        "message": "Authorized for Citizen Zone (Public Road Incidents & Status)",
        "user": current_user.name,
        "role": current_user.role.value
    }

@router.get("/driver-zone")
async def driver_zone_endpoint(
    current_user: User = Depends(require_roles([
        UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN
    ]))
) -> Any:
    return {
        "status": "success",
        "message": "Authorized for Driver Zone (Active Supply Route Navigation & Telemetry)",
        "user": current_user.name,
        "role": current_user.role.value
    }

@router.get("/officer-zone")
async def officer_zone_endpoint(
    current_user: User = Depends(require_roles([
        UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN
    ]))
) -> Any:
    return {
        "status": "success",
        "message": "Authorized for Field Officer Zone (Ground Verification & Checkposts)",
        "user": current_user.name,
        "role": current_user.role.value,
        "district": current_user.district
    }

@router.get("/district-admin-zone")
async def district_admin_zone_endpoint(
    current_user: User = Depends(require_roles([
        UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN
    ]))
) -> Any:
    return {
        "status": "success",
        "message": "Authorized for District Administration (District Logistics Oversight & Officer Approvals)",
        "user": current_user.name,
        "role": current_user.role.value,
        "district": current_user.district
    }

@router.get("/central-admin-zone")
async def central_admin_zone_endpoint(
    current_user: User = Depends(require_roles([UserRole.CENTRAL_ADMIN]))
) -> Any:
    return {
        "status": "success",
        "message": "Authorized for Central Administration (NER Command Center & System Oversight)",
        "user": current_user.name,
        "role": current_user.role.value
    }
