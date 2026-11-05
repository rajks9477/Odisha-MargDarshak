import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, update

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.driver import Trip, DriverProfile, Vehicle
from app.models.gis import Road, District, RoadStatus
from app.models.incident import (
    IncidentReport,
    IncidentEvidence,
    IncidentAuditLog,
    IncidentType,
    IncidentSeverity,
    IncidentStatus,
)
from app.models.alert import DriverAlert, AlertSeverity, AlertType, AlertStatus as DriverAlertStatus
from app.schemas.incident import (
    IncidentReportCreate,
    IncidentReportResponse,
    IncidentDetailResponse,
    IncidentEvidenceResponse,
    IncidentAuditLogResponse,
    IncidentVerifyRequest,
    IncidentRejectRequest,
    IncidentRequestInfoRequest,
    IncidentResolveRequest,
    OfflineIncidentBatchSync,
)
from app.core.spatial import haversine_distance_km
from app.services.incidents.duplicate_detector import detect_duplicate_incident
from app.services.incidents.quality_evaluator import calculate_evidence_quality_score

router = APIRouter(tags=["Incident Reporting & Verification System"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "incidents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper: Auto-resolve spatial road & district from GPS coordinates
async def resolve_spatial_context(db: AsyncSession, lat: float, lon: float):
    # Find closest road segment
    r_stmt = select(Road)
    r_res = await db.execute(r_stmt)
    roads = r_res.scalars().all()
    
    nearest_road = None
    min_road_dist = float("inf")
    for r in roads:
        coords = r.get_coordinates()
        for pt in coords:
            # pt is [lon, lat]
            d = haversine_distance_km(lat, lon, pt[1], pt[0])
            if d < min_road_dist:
                min_road_dist = d
                nearest_road = r

    road_id = nearest_road.id if nearest_road and min_road_dist <= 25.0 else None
    road_name = nearest_road.road_name if nearest_road and min_road_dist <= 25.0 else "Odisha Highway Corridor"
    district_id = nearest_road.district_id if nearest_road else "DIST-ODI-KHO"
    district_name = nearest_road.district_name if nearest_road else "Khordha"
    state = nearest_road.state if nearest_road else "Odisha"

    return road_id, road_name, district_id, district_name, state

# ==========================================
# 1. DRIVER INCIDENT REPORTING APIS
# ==========================================

@router.post("/driver/incidents", response_model=IncidentReportResponse, status_code=status.HTTP_201_CREATED)
@router.post("/incidents", response_model=IncidentReportResponse, status_code=status.HTTP_200_OK)
async def create_incident_report(
    payload: IncidentReportCreate,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.CITIZEN, UserRole.DISTRICT_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Check Idempotency Key
    if payload.client_idempotency_key:
        stmt = select(IncidentReport).where(IncidentReport.client_idempotency_key == payload.client_idempotency_key)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            return existing

    now = datetime.now(timezone.utc)

    # 2. Derive Driver / Vehicle / Trip Context
    v_id = None
    v_num = None
    t_id = payload.trip_id

    # If reporter is DRIVER, resolve their profile and active trip
    d_stmt = select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    d_res = await db.execute(d_stmt)
    driver_profile = d_res.scalars().first()

    if driver_profile:
        v_id = driver_profile.assigned_vehicle_id
        if v_id:
            veh_stmt = select(Vehicle).where(Vehicle.id == v_id)
            veh_res = await db.execute(veh_stmt)
            veh = veh_res.scalars().first()
            if veh:
                v_num = veh.vehicle_number

        if not t_id:
            trip_stmt = select(Trip).where(Trip.driver_id == current_user.id, Trip.status.in_(["ACCEPTED", "STARTED", "PAUSED"])).order_by(desc(Trip.created_at))
            trip_res = await db.execute(trip_stmt)
            active_trip = trip_res.scalars().first()
            if active_trip:
                t_id = active_trip.id

    # 3. Spatial Resolution
    road_id, road_name, district_id, district_name, state = await resolve_spatial_context(
        db, payload.latitude, payload.longitude
    )

    # 4. Duplicate Incident Detection
    is_duplicate, parent_id = await detect_duplicate_incident(
        db, payload.type.value, payload.latitude, payload.longitude, threshold_km=0.5, time_window_hours=2
    )

    # 5. Non-AI Evidence Quality Scoring
    has_photo = bool(payload.evidence_urls and len(payload.evidence_urls) > 0)
    has_voice = bool(payload.voice_transcript and len(payload.voice_transcript.strip()) > 0)
    quality_score = calculate_evidence_quality_score(
        gps_accuracy=payload.gps_accuracy,
        has_photo_evidence=has_photo,
        has_voice_transcript=has_voice,
        has_trip_context=bool(t_id),
        is_duplicate_correlated=is_duplicate,
    )

    # 6. Save Incident Report Record
    report = IncidentReport(
        client_idempotency_key=payload.client_idempotency_key,
        reporter_id=current_user.id,
        reporter_name=current_user.name,
        vehicle_id=v_id,
        vehicle_number=v_num,
        trip_id=t_id,
        type=payload.type,
        severity=payload.severity,
        description=payload.description,
        voice_transcript=payload.voice_transcript,
        latitude=payload.latitude,
        longitude=payload.longitude,
        gps_accuracy=payload.gps_accuracy or 5.0,
        location_source=payload.location_source or "GPS",
        road_id=road_id,
        road_name=road_name,
        district_id=district_id,
        district_name=district_name,
        state=state,
        status=IncidentStatus.PENDING_VERIFICATION,
        evidence_quality_score=quality_score,
        is_offline_submission=payload.is_offline_submission or False,
        is_possible_duplicate=is_duplicate,
        parent_incident_id=parent_id,
        created_at=now,
        updated_at=now,
    )
    db.add(report)
    await db.flush()

    # 7. Add Attached Evidence Records
    for url in (payload.evidence_urls or []):
        ev = IncidentEvidence(
            incident_id=report.id,
            file_url=url,
            file_name=url.split("/")[-1],
            media_type="image/jpeg",
            file_size_bytes=1024 * 250,
            uploaded_by=current_user.id,
            uploaded_at=now,
        )
        db.add(ev)

    # 8. Record Initial Audit Log
    log = IncidentAuditLog(
        incident_id=report.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role.value,
        action="SUBMITTED",
        old_status=None,
        new_status=IncidentStatus.PENDING_VERIFICATION.value,
        notes=f"Field incident reported via {current_user.role.value} interface. Evidence quality: {quality_score}/100. Location source: {payload.location_source or 'GPS'}.",
        timestamp=now,
    )
    db.add(log)
    await db.commit()
    await db.refresh(report)
    return report

@router.get("/incidents/my", response_model=List[IncidentReportResponse])
@router.get("/driver/incidents", response_model=List[IncidentReportResponse])
async def get_driver_incident_reports(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.CITIZEN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns all incident reports submitted by the logged-in user."""
    stmt = (
        select(IncidentReport)
        .where(IncidentReport.reporter_id == current_user.id)
        .order_by(desc(IncidentReport.created_at))
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/incidents/{incident_id}/status")
async def get_incident_status(
    incident_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.CITIZEN, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(IncidentReport).where(IncidentReport.id == incident_id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident report not found")
    
    return {
        "id": report.id,
        "status": report.status,
        "type": report.type,
        "severity": report.severity,
        "road_name": report.road_name,
        "location_source": report.location_source,
        "review_notes": report.review_notes,
        "rejection_reason": report.rejection_reason,
        "resolution_notes": report.resolution_notes,
        "verified_by": report.verified_by,
        "verified_at": report.verified_at,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }

@router.get("/driver/incidents/{incident_id}", response_model=IncidentDetailResponse)
@router.get("/incidents/{incident_id}", response_model=IncidentDetailResponse)
async def get_driver_incident_detail(
    incident_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.CITIZEN, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(IncidentReport).where(IncidentReport.id == incident_id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident report not found")

    # Fetch Evidence
    ev_stmt = select(IncidentEvidence).where(IncidentEvidence.incident_id == incident_id)
    ev_res = await db.execute(ev_stmt)
    evidence = ev_res.scalars().all()

    # Fetch Audit Logs
    log_stmt = select(IncidentAuditLog).where(IncidentAuditLog.incident_id == incident_id).order_by(desc(IncidentAuditLog.timestamp))
    log_res = await db.execute(log_stmt)
    audit_logs = log_res.scalars().all()

    return IncidentDetailResponse(
        **report.__dict__,
        evidence=[IncidentEvidenceResponse.model_validate(e) for e in evidence],
        audit_logs=[IncidentAuditLogResponse.model_validate(l) for l in audit_logs],
        nearby_duplicate_count=1 if report.is_possible_duplicate else 0,
    )

@router.post("/incidents/{incident_id}/cancel", response_model=IncidentReportResponse)
async def cancel_incident(
    incident_id: str,
    payload: Optional[IncidentRejectRequest] = None,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    reason = payload.rejection_reason if payload and hasattr(payload, "rejection_reason") else "Cancelled by reporter"
    return await reject_incident(incident_id, IncidentRejectRequest(rejection_reason=reason), current_user, db)

@router.post("/driver/incidents/sync-offline")
@router.post("/incidents/sync-offline")
async def sync_offline_incidents(
    payload: dict,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Batch synchronizes incident reports recorded offline in remote mountain valley corridors."""
    raw_list = payload.get("reports") or payload.get("incidents") or []
    results = []
    for item in raw_list:
        rep_create = IncidentReportCreate(
            client_idempotency_key=item.get("client_idempotency_key"),
            type=item.get("type"),
            severity=item.get("severity", "MEDIUM"),
            description=item.get("description", "Offline field hazard report"),
            voice_transcript=item.get("voice_transcript"),
            latitude=item.get("latitude"),
            longitude=item.get("longitude"),
            gps_accuracy=item.get("gps_accuracy", 5.0),
            is_offline_submission=True,
        )
        synced = await create_incident_report(rep_create, current_user, db)
        results.append(IncidentReportResponse.model_validate(synced))
    return {"synced_count": len(results), "reports": results}

# ==========================================
# 2. OFFICER VERIFICATION & MANAGEMENT APIS
# ==========================================

@router.get("/officer/incidents/pending", response_model=List[IncidentReportResponse])
async def list_pending_incidents(
    current_user: User = Depends(require_roles([UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns queue of field incident reports awaiting authorized verification."""
    stmt = (
        select(IncidentReport)
        .where(IncidentReport.status.in_([
            IncidentStatus.SUBMITTED,
            IncidentStatus.PENDING_VERIFICATION,
            IncidentStatus.UNDER_REVIEW,
        ]))
        .order_by(desc(IncidentReport.created_at))
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/officer/incidents/{incident_id}/verify", response_model=IncidentReportResponse)
async def verify_incident(
    incident_id: str,
    payload: IncidentVerifyRequest,
    current_user: User = Depends(require_roles([UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Field Officer confirms and officially verifies a reported hazard on the highway corridor."""
    stmt = select(IncidentReport).where(IncidentReport.id == incident_id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    now = datetime.now(timezone.utc)
    old_status = report.status.value

    # Update Incident
    report.status = IncidentStatus.VERIFIED
    report.verified_by = current_user.name
    report.verified_at = now
    report.review_notes = payload.verification_notes
    report.action_taken = payload.action_taken
    if payload.correct_severity:
        report.severity = payload.correct_severity
    if payload.correct_road_id:
        report.road_id = payload.correct_road_id

    # Downstream: Update Road Accessibility Status
    if report.road_id:
        new_road_status = (
            RoadStatus.RED
            if report.severity == IncidentSeverity.CRITICAL
            else (RoadStatus.ORANGE if report.severity == IncidentSeverity.HIGH else RoadStatus.YELLOW)
        )
        await db.execute(
            update(Road)
            .where(Road.id == report.road_id)
            .values(status=new_road_status, status_reason=f"Verified {report.type.value}: {report.description[:100]}")
        )

        # Downstream: Generate Alert for Affected Corridor Drivers
        alert = DriverAlert(
            title=f"{report.severity.value}: Verified {report.type.value.replace('_', ' ')}",
            message=f"Official Notice ({report.road_name}): {payload.verification_notes}. Action: {payload.action_taken}.",
            severity=AlertSeverity.CRITICAL if report.severity == IncidentSeverity.CRITICAL else AlertSeverity.HIGH,
            type=AlertType.ROAD_BLOCKAGE if "BLOCKAGE" in report.type.value else AlertType.LANDSLIDE_WARNING,
            source=f"FIELD_OFFICER_{current_user.name.upper()}",
            driver_id=report.reporter_id,
            road_id=report.road_id,
            road_name=report.road_name,
            location_name=f"{report.district_name}, {report.state}",
            status=DriverAlertStatus.UNREAD,
            is_read=False,
            is_acknowledged=False,
            created_at=now,
        )
        db.add(alert)

    # Log Audit Entry
    log = IncidentAuditLog(
        incident_id=report.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role.value,
        action="VERIFIED",
        old_status=old_status,
        new_status=IncidentStatus.VERIFIED.value,
        notes=f"Verified by {current_user.name}. Action: {payload.action_taken}. Note: {payload.verification_notes}",
        timestamp=now,
    )
    db.add(log)
    await db.commit()
    await db.refresh(report)
    return report

@router.post("/officer/incidents/{incident_id}/reject", response_model=IncidentReportResponse)
async def reject_incident(
    incident_id: str,
    payload: IncidentRejectRequest,
    current_user: User = Depends(require_roles([UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Field Officer rejects a spurious, duplicate, or cleared incident report."""
    stmt = select(IncidentReport).where(IncidentReport.id == incident_id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    now = datetime.now(timezone.utc)
    old_status = report.status.value

    report.status = IncidentStatus.REJECTED
    report.rejection_reason = payload.rejection_reason

    log = IncidentAuditLog(
        incident_id=report.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role.value,
        action="REJECTED",
        old_status=old_status,
        new_status=IncidentStatus.REJECTED.value,
        notes=f"Rejected by {current_user.name}. Reason: {payload.rejection_reason}",
        timestamp=now,
    )
    db.add(log)
    await db.commit()
    await db.refresh(report)
    return report

@router.post("/officer/incidents/{incident_id}/request-info", response_model=IncidentReportResponse)
async def request_incident_info(
    incident_id: str,
    payload: IncidentRequestInfoRequest,
    current_user: User = Depends(require_roles([UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(IncidentReport).where(IncidentReport.id == incident_id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    now = datetime.now(timezone.utc)
    old_status = report.status.value

    report.status = IncidentStatus.UNDER_REVIEW
    report.review_notes = payload.inquiry_message

    log = IncidentAuditLog(
        incident_id=report.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role.value,
        action="INFO_REQUESTED",
        old_status=old_status,
        new_status=IncidentStatus.UNDER_REVIEW.value,
        notes=f"Inquiry sent by {current_user.name}: {payload.inquiry_message}",
        timestamp=now,
    )
    db.add(log)
    await db.commit()
    await db.refresh(report)
    return report

@router.post("/officer/incidents/{incident_id}/resolve", response_model=IncidentReportResponse)
async def resolve_incident(
    incident_id: str,
    payload: IncidentResolveRequest,
    current_user: User = Depends(require_roles([UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Field Officer closes out an incident once debris has been cleared and road is reopened."""
    stmt = select(IncidentReport).where(IncidentReport.id == incident_id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    now = datetime.now(timezone.utc)
    old_status = report.status.value

    report.status = IncidentStatus.RESOLVED
    report.resolved_by = current_user.name
    report.resolved_at = now
    report.resolution_notes = payload.resolution_notes

    # Restore Road Status
    if report.road_id:
        target_road_status = RoadStatus.GREEN if payload.reopened_road_status == "GREEN" else RoadStatus.YELLOW
        await db.execute(
            update(Road)
            .where(Road.id == report.road_id)
            .values(status=target_road_status, status_reason="Hazard cleared. Normal flow restored.")
        )

    log = IncidentAuditLog(
        incident_id=report.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role.value,
        action="RESOLVED",
        old_status=old_status,
        new_status=IncidentStatus.RESOLVED.value,
        notes=f"Resolved by {current_user.name}. Road reopened: {payload.reopened_road_status}. Note: {payload.resolution_notes}",
        timestamp=now,
    )
    db.add(log)
    await db.commit()
    await db.refresh(report)
    return report

# ==========================================
# 3. EVIDENCE UPLOAD & VOICE APIS
# ==========================================

@router.post("/incidents/upload", status_code=status.HTTP_201_CREATED)
async def upload_general_incident_media(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.CITIZEN, UserRole.DISTRICT_ADMIN])),
) -> Any:
    """Pre-upload endpoint for compressed photo or audio evidence."""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/m4a", "video/mp4"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Allowed: JPEG, PNG, WEBP, MP4, WEBM, WAV, OGG, M4A",
        )

    file_ext = os.path.splitext(file.filename or "media.jpg")[1]
    unique_filename = f"med_{uuid.uuid4().hex[:12]}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    file_size = 0
    with open(dest_path, "wb") as buffer:
        content = await file.read()
        file_size = len(content)
        buffer.write(content)

    file_url = f"/uploads/incidents/{unique_filename}"
    return {
        "url": file_url,
        "file_name": file.filename or unique_filename,
        "file_size": file_size,
        "media_type": file.content_type,
    }

@router.post("/incidents/{incident_id}/media", response_model=IncidentEvidenceResponse, status_code=status.HTTP_201_CREATED)
@router.post("/incidents/{incident_id}/evidence", response_model=IncidentEvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_incident_evidence(
    incident_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.CITIZEN, UserRole.DISTRICT_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Security Validation: Check allowed media types
    allowed_types = ["image/jpeg", "image/png", "image/webp", "audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/m4a", "video/mp4"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Allowed: JPEG, PNG, WEBP, MP4, WEBM, WAV, OGG, M4A",
        )

    file_ext = os.path.splitext(file.filename or "evidence.jpg")[1]
    unique_filename = f"evd_{uuid.uuid4().hex[:12]}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    file_size = 0
    with open(dest_path, "wb") as buffer:
        content = await file.read()
        file_size = len(content)
        buffer.write(content)

    file_url = f"/uploads/incidents/{unique_filename}"
    now = datetime.now(timezone.utc)

    ev = IncidentEvidence(
        incident_id=incident_id,
        file_url=file_url,
        file_name=file.filename or unique_filename,
        media_type=file.content_type,
        file_size_bytes=file_size,
        uploaded_by=current_user.id,
        uploaded_at=now,
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    return ev

@router.post("/incidents/{incident_id}/voice", response_model=IncidentReportResponse)
async def upload_incident_voice(
    incident_id: str,
    file: UploadFile = File(...),
    transcript: Optional[str] = Form(None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(IncidentReport).where(IncidentReport.id == incident_id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident report not found")

    file_ext = os.path.splitext(file.filename or "voice.webm")[1]
    unique_filename = f"voice_{uuid.uuid4().hex[:12]}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    file_size = 0
    with open(dest_path, "wb") as buffer:
        content = await file.read()
        file_size = len(content)
        buffer.write(content)

    file_url = f"/uploads/incidents/{unique_filename}"
    now = datetime.now(timezone.utc)

    ev = IncidentEvidence(
        incident_id=incident_id,
        file_url=file_url,
        file_name=file.filename or unique_filename,
        media_type=file.content_type or "audio/webm",
        file_size_bytes=file_size,
        uploaded_by=current_user.id,
        uploaded_at=now,
    )
    db.add(ev)

    # If transcript is provided or default audio note
    if transcript:
        report.voice_transcript = transcript.strip()
    
    await db.commit()
    await db.refresh(report)
    return report

@router.get("/incidents/{incident_id}/evidence", response_model=List[IncidentEvidenceResponse])
async def list_incident_evidence(
    incident_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.CITIZEN, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(IncidentEvidence).where(IncidentEvidence.incident_id == incident_id)
    res = await db.execute(stmt)
    return res.scalars().all()

