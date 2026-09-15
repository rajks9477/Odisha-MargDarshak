from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.gis import Incident
from app.schemas.command_center import (
    CommandCenterSummaryResponse,
    IncidentActionRequest,
    RegionalCorridorHealth,
)
from app.schemas.gis import IncidentResponse
from app.services.command_center.command_center_service import (
    get_command_center_summary,
    verify_incident_by_officer,
    reject_incident_by_officer,
)

router = APIRouter(prefix="/command-center", tags=["Government Command Center"])

@router.get("/summary", response_model=CommandCenterSummaryResponse)
async def get_summary(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves executive command summary across North Eastern states for authorized decision-makers."""
    return await get_command_center_summary(db)

@router.get("/incidents/active", response_model=List[IncidentResponse])
async def get_active_command_incidents(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists ground incidents pending verification or active across regional highway corridors."""
    stmt = select(Incident).order_by(Incident.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/incidents/{id}/verify", response_model=IncidentResponse)
async def verify_incident(
    id: str,
    payload: IncidentActionRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Verifies a pending ground incident report (Officer / Admin restricted action with audit log)."""
    return await verify_incident_by_officer(db, incident_id=id, officer_id=current_user.id, notes=payload.notes)

@router.post("/incidents/{id}/reject", response_model=IncidentResponse)
async def reject_incident(
    id: str,
    payload: IncidentActionRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Rejects a ground incident report (Officer / Admin restricted action with audit log)."""
    return await reject_incident_by_officer(db, incident_id=id, officer_id=current_user.id, notes=payload.notes)

@router.get("/corridors/status", response_model=List[RegionalCorridorHealth])
async def get_corridors_status(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists regional highway corridor health matrix across 8 NE states."""
    summary = await get_command_center_summary(db)
    return summary.regional_corridors
