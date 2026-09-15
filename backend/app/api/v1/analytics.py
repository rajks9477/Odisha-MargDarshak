from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.analytics import GeneratedReportRecord
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    TrendDataPoint,
    DecisionSupportItem,
    GenerateReportRequest,
    GeneratedReportResponse,
)
from app.services.analytics.analytics_engine import (
    compute_overview_analytics,
    compute_trend_analytics,
    compute_decision_support_recommendations,
    create_generated_report,
    list_generated_reports,
)

router = APIRouter(prefix="/analytics", tags=["Analytics, Reports & Government Decision Support"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_overview(
    state: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves high-level aggregated operational KPIs and period-over-period trend changes."""
    return await compute_overview_analytics(db, state_filter=state)

@router.get("/trends", response_model=List[TrendDataPoint])
async def get_trends(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves multi-week incident frequency and corridor delay trends."""
    return await compute_trend_analytics(db)

@router.get("/decision-support", response_model=List[DecisionSupportItem])
async def get_decision_support(
    state: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Delivers key strategic findings, recurring bottlenecks, and engineering recommendations."""
    return await compute_decision_support_recommendations(db, state_filter=state)

@router.post("/reports/generate", response_model=GeneratedReportResponse)
async def generate_report(
    payload: GenerateReportRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Generates and archives a formal government analytics & corridor audit report."""
    return await create_generated_report(db, payload=payload, user_id=current_user.id)

@router.get("/reports", response_model=List[GeneratedReportResponse])
async def get_reports(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists generated government analytics reports."""
    return await list_generated_reports(db)

@router.get("/reports/{report_id}/download-csv")
async def download_report_csv(
    report_id: str,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Downloads report contents as a standard CSV format file."""
    stmt = select(GeneratedReportRecord).where(GeneratedReportRecord.id == report_id)
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Report not found")

    return Response(
        content=rec.csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={rec.id}.csv"},
    )
