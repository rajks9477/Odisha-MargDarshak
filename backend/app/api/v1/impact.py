from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.gis import Incident
from app.schemas.impact import (
    ImpactAnalysisResponse,
    CustomImpactSimulationRequest,
)
from app.services.impact.impact_engine import calculate_cascading_impact

router = APIRouter(prefix="/impact", tags=["Impact & Cascading Impact Engine"])

@router.get("/corridor/{road_id}", response_model=ImpactAnalysisResponse)
async def get_corridor_impact(
    road_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Computes cascading impact graph linking road blockage -> route disruption -> vehicle & medicine delays -> district risk."""
    return await calculate_cascading_impact(db, road_id=road_id)

@router.get("/incident/{incident_id}", response_model=ImpactAnalysisResponse)
async def get_incident_impact(
    incident_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Computes cascading impact for a specific verified incident."""
    stmt = select(Incident).where(Incident.id == incident_id)
    res = await db.execute(stmt)
    inc = res.scalar_one_or_none()

    road_id = inc.road_id if inc and inc.road_id else "NH-16-BAITARANI-01"
    hazard_type = inc.incident_type if inc else "RIVER_FLOOD_OVERTOPPING"
    severity = inc.severity if inc else "HIGH"

    return await calculate_cascading_impact(
        db, road_id=road_id, incident_id=incident_id, hazard_type=hazard_type, severity=severity
    )

@router.post("/calculate-custom", response_model=ImpactAnalysisResponse)
async def calculate_custom_impact(
    payload: CustomImpactSimulationRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Calculates cascading impact graph for custom What-If simulated incident parameters."""
    return await calculate_cascading_impact(
        db,
        road_id=payload.road_id,
        hazard_type=payload.hazard_type,
        severity=payload.severity,
        blockage_hours=payload.estimated_blockage_hours,
    )

@router.get("/active-disruptions", response_model=List[ImpactAnalysisResponse])
async def get_active_disruptions(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns active regional cascading impact analyses across key Odisha arterial corridors."""
    res1 = await calculate_cascading_impact(db, road_id="NH-16-BAITARANI-01", hazard_type="RIVER_FLOOD_OVERTOPPING", severity="CRITICAL", blockage_hours=6.0)
    res2 = await calculate_cascading_impact(db, road_id="NH-20-KANJIPANI-01", hazard_type="LANDSLIDE_DEBRIS", severity="HIGH", blockage_hours=3.5)
    return [res1, res2]
