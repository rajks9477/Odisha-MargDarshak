from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.master_data import (
    MasterEntitySummary,
    MasterFacilityCreateRequest,
    MasterFacilityUpdateRequest,
    MasterFacilityResponse,
    BulkImportRequest,
    BulkImportResult,
)
from app.services.master_data.master_data_service import (
    compute_master_data_summary,
    list_master_facilities,
    create_master_facility,
    update_master_facility,
    archive_master_facility,
    restore_master_facility,
    bulk_import_master_facilities,
)

router = APIRouter(prefix="/master-data", tags=["Master Data Management"])

@router.get("/summary", response_model=MasterEntitySummary)
async def get_summary(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves foundational summary counts of all master data assets."""
    return await compute_master_data_summary(db)

@router.get("/facilities", response_model=List[MasterFacilityResponse])
async def get_facilities(
    facility_type: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists master facilities with type, state, district, and status filters."""
    # Scope isolation for District Admins
    if current_user.role == UserRole.DISTRICT_ADMIN and current_user.district:
        district = current_user.district

    return await list_master_facilities(
        db, facility_type=facility_type, state=state, district=district, status=status
    )

@router.post("/facilities", response_model=MasterFacilityResponse)
async def create_facility(
    payload: MasterFacilityCreateRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Creates a new master critical infrastructure facility."""
    if current_user.role == UserRole.DISTRICT_ADMIN and current_user.district:
        if payload.district != current_user.district:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"District Admin can only create facilities in assigned district ({current_user.district})",
            )

    return await create_master_facility(db, payload=payload)

@router.put("/facilities/{facility_id}", response_model=MasterFacilityResponse)
async def update_facility(
    facility_id: str,
    payload: MasterFacilityUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Updates master facility record and increments version."""
    updated = await update_master_facility(db, facility_id=facility_id, payload=payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Master facility record not found")
    return updated

@router.post("/facilities/{facility_id}/archive", response_model=MasterFacilityResponse)
async def archive_facility(
    facility_id: str,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Soft-archives facility without breaking historical references."""
    archived = await archive_master_facility(db, facility_id=facility_id)
    if not archived:
        raise HTTPException(status_code=404, detail="Master facility record not found")
    return archived

@router.post("/facilities/{facility_id}/restore", response_model=MasterFacilityResponse)
async def restore_facility(
    facility_id: str,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Restores an archived facility back to active state."""
    restored = await restore_master_facility(db, facility_id=facility_id)
    if not restored:
        raise HTTPException(status_code=404, detail="Master facility record not found")
    return restored

@router.post("/bulk-import", response_model=BulkImportResult)
async def bulk_import(
    payload: BulkImportRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Safely ingests batch master data items with duplicate checks and error reporting."""
    return await bulk_import_master_facilities(db, payload=payload)
