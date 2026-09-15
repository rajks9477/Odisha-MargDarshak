from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.satellite import (
    SatelliteSceneResponse,
    SatelliteChangeDetectionResponse,
    CustomSatelliteAnalysisRequest,
)
from app.services.satellite.satellite_service import (
    query_satellite_scenes,
    analyze_corridor_satellite_change,
)

router = APIRouter(prefix="/satellite", tags=["Satellite & Remote-Sensing Intelligence"])

@router.get("/scenes", response_model=List[SatelliteSceneResponse])
async def get_scenes(
    district: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves available Sentinel-2, Landsat-9, and Cartosat satellite imagery scenes."""
    return await query_satellite_scenes(db, district=district)

@router.get("/change-detection/{road_id}", response_model=SatelliteChangeDetectionResponse)
async def get_change_detection(
    road_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Computes computer-vision change detection comparing pre-event baseline imagery vs. post-disaster scene."""
    return await analyze_corridor_satellite_change(db, road_id=road_id)

@router.post("/analyze-custom", response_model=SatelliteChangeDetectionResponse)
async def analyze_custom_satellite_change(
    payload: CustomSatelliteAnalysisRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Runs custom change detection algorithm for specified road segment and acquisition dates."""
    return await analyze_corridor_satellite_change(
        db,
        road_id=payload.road_id,
        pre_date_str=payload.pre_event_date or "2026-08-15",
        post_date_str=payload.post_event_date or "2026-08-28",
    )

@router.get("/active-anomalies", response_model=List[SatelliteChangeDetectionResponse])
async def get_active_anomalies(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists active spatial change anomalies across North Eastern transportation corridors."""
    anom1 = await analyze_corridor_satellite_change(db, road_id="NH-6-SONAPUR-01")
    return [anom1]
