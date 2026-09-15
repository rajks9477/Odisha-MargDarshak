from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.incident import IncidentReport, IncidentStatus
from app.core.spatial import haversine_distance_km

async def detect_duplicate_incident(
    db: AsyncSession,
    incident_type: str,
    latitude: float,
    longitude: float,
    threshold_km: float = 0.5,
    time_window_hours: int = 2,
) -> Tuple[bool, Optional[str]]:
    """
    Checks if an active incident of the same type was reported nearby within the time window.
    Returns (is_duplicate, parent_incident_id).
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)
    
    stmt = (
        select(IncidentReport)
        .where(
            IncidentReport.type == incident_type,
            IncidentReport.status.in_([
                IncidentStatus.SUBMITTED,
                IncidentStatus.PENDING_VERIFICATION,
                IncidentStatus.UNDER_REVIEW,
                IncidentStatus.VERIFIED,
            ]),
            IncidentReport.created_at >= cutoff_time,
        )
    )
    res = await db.execute(stmt)
    existing_reports = res.scalars().all()

    for report in existing_reports:
        dist_km = haversine_distance_km(latitude, longitude, report.latitude, report.longitude)
        if dist_km <= threshold_km:
            return True, report.id

    return False, None
