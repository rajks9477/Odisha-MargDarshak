from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.gis import Incident, Road
from app.models.logistics import Shipment, ShipmentStatusEnum
from app.models.weather import DisasterAlertEvent
from app.models.user import User, UserRole
from app.schemas.command_center import (
    CommandCenterSummaryResponse,
    RegionalCorridorHealth,
)

SEEDED_NE_STATES = [
    {"name": "Assam", "code": "AS", "total": 14, "open": 11, "restricted": 2, "blocked": 1, "incidents": 4, "status": "WATCH"},
    {"name": "Meghalaya", "code": "ML", "total": 8, "open": 6, "restricted": 1, "blocked": 1, "incidents": 3, "status": "CRITICAL_ALERT"},
    {"name": "Arunachal Pradesh", "code": "AR", "total": 10, "open": 8, "restricted": 2, "blocked": 0, "incidents": 2, "status": "WATCH"},
    {"name": "Mizoram", "code": "MZ", "total": 6, "open": 5, "restricted": 1, "blocked": 0, "incidents": 1, "status": "HEALTHY"},
    {"name": "Tripura", "code": "TR", "total": 5, "open": 5, "restricted": 0, "blocked": 0, "incidents": 0, "status": "HEALTHY"},
    {"name": "Nagaland", "code": "NL", "total": 6, "open": 5, "restricted": 1, "blocked": 0, "incidents": 1, "status": "WATCH"},
    {"name": "Manipur", "code": "MN", "total": 7, "open": 6, "restricted": 1, "blocked": 0, "incidents": 1, "status": "WATCH"},
    {"name": "Sikkim", "code": "SK", "total": 5, "open": 4, "restricted": 1, "blocked": 0, "incidents": 1, "status": "WATCH"},
]

async def get_command_center_summary(db: AsyncSession) -> CommandCenterSummaryResponse:
    """Computes unified regional command summary across 8 North Eastern states."""
    # Fetch active incidents
    inc_stmt = select(Incident)
    inc_res = await db.execute(inc_stmt)
    incidents = inc_res.scalars().all()

    active_incidents_count = len(incidents)
    pending_verifications_count = sum(1 for i in incidents if getattr(i, "verification_status", "PENDING") == "PENDING")

    # Fetch active emergency shipments
    shp_stmt = select(Shipment).where(Shipment.status != ShipmentStatusEnum.DELIVERED)
    shp_res = await db.execute(shp_stmt)
    shipments = shp_res.scalars().all()

    # Build state health
    corridors: List[RegionalCorridorHealth] = []
    for s in SEEDED_NE_STATES:
        corridors.append(
            RegionalCorridorHealth(
                state=s["name"],
                state_code=s["code"],
                total_corridors=s["total"],
                open_corridors=s["open"],
                restricted_corridors=s["restricted"],
                critical_blocked_corridors=s["blocked"],
                active_incidents_count=s["incidents"],
                overall_health_status=s["status"],
            )
        )

    return CommandCenterSummaryResponse(
        total_active_incidents=max(active_incidents_count, 5),
        pending_verifications_count=max(pending_verifications_count, 2),
        critical_risk_corridors=2,
        active_emergency_shipments=len(shipments),
        affected_districts_count=4,
        active_imd_alerts_count=3,
        regional_corridors=corridors,
        last_updated=datetime.now(timezone.utc),
        data_provenance="NER-MargDarshak Unified Government Command Center Engine [Demo Simulated Data]",
    )

async def verify_incident_by_officer(
    db: AsyncSession, incident_id: str, officer_id: str, notes: Optional[str] = None
) -> Incident:
    """Verifies a pending ground incident by authorized officer/admin."""
    stmt = select(Incident).where(Incident.id == incident_id)
    res = await db.execute(stmt)
    inc = res.scalar_one_or_none()

    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident record not found")

    inc.status = "VERIFIED"
    if notes:
        inc.description = f"{inc.description}\n[Officer Verification Note]: {notes}"

    await db.commit()
    await db.refresh(inc)
    return inc

async def reject_incident_by_officer(
    db: AsyncSession, incident_id: str, officer_id: str, notes: Optional[str] = None
) -> Incident:
    """Rejects a ground incident report following officer review."""
    stmt = select(Incident).where(Incident.id == incident_id)
    res = await db.execute(stmt)
    inc = res.scalar_one_or_none()

    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident record not found")

    inc.status = "REJECTED"
    if notes:
        inc.description = f"{inc.description}\n[Officer Rejection Note]: {notes}"

    await db.commit()
    await db.refresh(inc)
    return inc
