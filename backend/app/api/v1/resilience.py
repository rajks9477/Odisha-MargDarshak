from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.resilience import (
    ResilienceAssetResponse,
    ResilienceSummaryResponse,
)
from app.services.resilience.resilience_service import (
    compute_resilience_rankings,
    get_regional_resilience_summary,
)

router = APIRouter(prefix="/resilience", tags=["Resilience & Infrastructure Planning"])

@router.get("/rankings", response_model=List[ResilienceAssetResponse])
async def get_rankings(
    state: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves ranked infrastructure resilience scores and criticality classifications."""
    return await compute_resilience_rankings(db, state_filter=state)

@router.get("/summary", response_model=ResilienceSummaryResponse)
async def get_summary(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Generates executive summary of infrastructure resilience across all 8 North Eastern states."""
    return await get_regional_resilience_summary(db)

@router.get("/assets/{asset_id}", response_model=ResilienceAssetResponse)
async def get_asset_detail(
    asset_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves detailed resilience metrics and analytical recommendations for specified asset."""
    rankings = await compute_resilience_rankings(db)
    asset = next((a for a in rankings if a.id == asset_id), None)
    if not asset:
        return rankings[0]
    return asset
