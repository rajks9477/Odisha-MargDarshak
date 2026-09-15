from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, or_, and_

from app.core.rbac import require_roles, get_current_active_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.driver import (
    DriverProfile,
    Vehicle,
    Trip,
    TripEvent,
    TripStatus,
    TripStatusHistory,
    TripPriority,
)
from app.models.route import PlannedRoute, RouteSegment, RouteType, RouteRiskLevel
from app.models.tracking import TrackingSession, TrackingStatus
from app.models.gis import DriverCurrentLocation, Road
from app.models.audit import AuditLog
from app.schemas.driver import (
    TripResponse,
    TripStartRequest,
    TripPauseRequest,
    TripResumeRequest,
    TripCompleteRequest,
    TripEventResponse,
    TripProgressResponse,
)
from app.schemas.trip import (
    TripDetailResponse,
    TripStatusHistoryResponse,
    TripAcceptRequest,
)
from app.core.spatial import haversine_distance_km
from app.services.map.spatial import find_nearest_road_segment

router = APIRouter(prefix="/driver/trips", tags=["My Route & Trip Management"])

# ==========================================
# 1. ACTIVE & ASSIGNED TRIP QUERIES
# ==========================================

@router.get("/current", response_model=Optional[TripResponse])
async def get_current_active_trip(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns the authenticated driver's currently active or assigned trip."""
    stmt = (
        select(Trip)
        .where(
            Trip.driver_id == current_user.id,
            Trip.status.in_([
                TripStatus.STARTED,
                TripStatus.PAUSED,
                TripStatus.ACCEPTED,
                TripStatus.READY,
                TripStatus.ASSIGNED,
            ]),
        )
        .order_by(
            desc(Trip.created_at),
        )
    )
    res = await db.execute(stmt)
    trips = res.scalars().all()
    if not trips:
        return None

    # Prioritize STARTED/PAUSED over ASSIGNED
    active_trip = next((t for t in trips if t.status in [TripStatus.STARTED, TripStatus.PAUSED]), trips[0])
    trip = active_trip

    v_stmt = select(Vehicle).where(Vehicle.id == trip.vehicle_id)
    v_res = await db.execute(v_stmt)
    veh = v_res.scalar_one_or_none()
    veh_num = veh.vehicle_number if veh else "AS-01-GC-9104"

    return TripResponse(
        id=trip.id,
        trip_number=trip.trip_number,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,
        origin_name=trip.origin_name,
        destination_name=trip.destination_name,
        corridor_name=trip.corridor_name,
        cargo_type=trip.cargo_type,
        cargo_weight_tonnes=trip.cargo_weight_tonnes,
        distance_km=trip.distance_km,
        status=trip.status,
        scheduled_start=trip.scheduled_start,
        actual_start=trip.actual_start,
        actual_end=trip.actual_end,
        start_latitude=trip.start_latitude,
        start_longitude=trip.start_longitude,
        end_latitude=trip.end_latitude,
        end_longitude=trip.end_longitude,
        actual_distance_km=trip.actual_distance_km or 0.0,
        actual_duration_minutes=trip.actual_duration_minutes or 0.0,
        pause_started_at=trip.pause_started_at,
        pause_reason=trip.pause_reason,
        pause_duration_seconds=trip.pause_duration_seconds or 0,
        route_id=trip.route_id,
        estimated_arrival=trip.estimated_arrival,
        notes=trip.notes,
        created_at=trip.created_at,
        updated_at=trip.updated_at,
    )

@router.get("", response_model=List[TripResponse])
async def get_driver_trips(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch all assigned or active trips for the authenticated driver."""
    stmt = select(Trip).where(Trip.driver_id == current_user.id)
    if status_filter:
        stmt = stmt.where(Trip.status == status_filter)
    else:
        stmt = stmt.where(
            Trip.status.in_([
                TripStatus.ASSIGNED,
                TripStatus.ACCEPTED,
                TripStatus.READY,
                TripStatus.STARTED,
                TripStatus.PAUSED,
            ])
        )

    stmt = stmt.order_by(desc(Trip.created_at))
    res = await db.execute(stmt)
    trips = res.scalars().all()

    return [
        TripResponse(
            id=t.id,
            trip_number=t.trip_number,
            driver_id=t.driver_id,
            vehicle_id=t.vehicle_id,
            origin_name=t.origin_name,
            destination_name=t.destination_name,
            corridor_name=t.corridor_name,
            cargo_type=t.cargo_type,
            cargo_weight_tonnes=t.cargo_weight_tonnes,
            distance_km=t.distance_km,
            status=t.status,
            scheduled_start=t.scheduled_start,
            actual_start=t.actual_start,
            actual_end=t.actual_end,
            start_latitude=t.start_latitude,
            start_longitude=t.start_longitude,
            end_latitude=t.end_latitude,
            end_longitude=t.end_longitude,
            actual_distance_km=t.actual_distance_km or 0.0,
            actual_duration_minutes=t.actual_duration_minutes or 0.0,
            pause_started_at=t.pause_started_at,
            pause_reason=t.pause_reason,
            pause_duration_seconds=t.pause_duration_seconds or 0,
            route_id=t.route_id,
            estimated_arrival=t.estimated_arrival,
            notes=t.notes,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in trips
    ]

@router.get("/history", response_model=List[TripResponse])
async def get_driver_trip_history(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch completed and cancelled historical trips for the driver."""
    stmt = select(Trip).where(
        Trip.driver_id == current_user.id,
        Trip.status.in_([TripStatus.COMPLETED, TripStatus.CANCELLED]),
    ).order_by(desc(Trip.actual_end), desc(Trip.created_at))
    res = await db.execute(stmt)
    trips = res.scalars().all()

    return [
        TripResponse(
            id=t.id,
            trip_number=t.trip_number,
            driver_id=t.driver_id,
            vehicle_id=t.vehicle_id,
            origin_name=t.origin_name,
            destination_name=t.destination_name,
            corridor_name=t.corridor_name,
            cargo_type=t.cargo_type,
            cargo_weight_tonnes=t.cargo_weight_tonnes,
            distance_km=t.distance_km,
            status=t.status,
            scheduled_start=t.scheduled_start,
            actual_start=t.actual_start,
            actual_end=t.actual_end,
            start_latitude=t.start_latitude,
            start_longitude=t.start_longitude,
            end_latitude=t.end_latitude,
            end_longitude=t.end_longitude,
            actual_distance_km=t.actual_distance_km or 0.0,
            actual_duration_minutes=t.actual_duration_minutes or 0.0,
            pause_started_at=t.pause_started_at,
            pause_reason=t.pause_reason,
            pause_duration_seconds=t.pause_duration_seconds or 0,
            route_id=t.route_id,
            estimated_arrival=t.estimated_arrival,
            notes=t.notes,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in trips
    ]

@router.get("/{trip_id}", response_model=TripDetailResponse)
async def get_trip_details(
    trip_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if current_user.role == UserRole.DRIVER and trip.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Trip assigned to another driver")

    v_stmt = select(Vehicle).where(Vehicle.id == trip.vehicle_id)
    v_res = await db.execute(v_stmt)
    veh = v_res.scalar_one_or_none()
    veh_num = veh.vehicle_number if veh else "AS-01-GC-9104"

    h_stmt = select(TripStatusHistory).where(TripStatusHistory.trip_id == trip.id).order_by(TripStatusHistory.timestamp)
    h_res = await db.execute(h_stmt)
    history_records = h_res.scalars().all()

    return TripDetailResponse(
        id=trip.id,
        trip_number=trip.trip_number,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,
        vehicle_number=veh_num,
        shipment_id=trip.shipment_id,
        origin_name=trip.origin_name,
        destination_name=trip.destination_name,
        corridor_name=trip.corridor_name,
        priority=trip.priority,
        cargo_type=trip.cargo_type,
        cargo_weight_tonnes=trip.cargo_weight_tonnes,
        distance_km=trip.distance_km,
        status=trip.status,
        scheduled_start=trip.scheduled_start,
        actual_start=trip.actual_start,
        actual_end=trip.actual_end,
        start_latitude=trip.start_latitude,
        start_longitude=trip.start_longitude,
        end_latitude=trip.end_latitude,
        end_longitude=trip.end_longitude,
        estimated_arrival=trip.estimated_arrival,
        notes=trip.notes,
        created_at=trip.created_at,
        updated_at=trip.updated_at,
        history=[
            TripStatusHistoryResponse(
                id=h.id,
                trip_id=h.trip_id,
                old_status=h.old_status,
                new_status=h.new_status,
                changed_by=h.changed_by,
                reason=h.reason,
                latitude=h.latitude,
                longitude=h.longitude,
                timestamp=h.timestamp,
            )
            for h in history_records
        ],
    )

@router.get("/{trip_id}/route")
async def get_trip_route_geometry(
    trip_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns the GIS polyline geometry and corridor breakdown for the trip's planned route."""
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if current_user.role == UserRole.DRIVER and trip.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    # Fetch or auto-create planned route for this trip
    r_stmt = select(PlannedRoute).where(PlannedRoute.trip_id == trip.id).order_by(desc(PlannedRoute.is_selected))
    r_res = await db.execute(r_stmt)
    planned_route = r_res.scalars().first()

    if not planned_route:
        default_coords = [
            [91.730, 26.180],
            [91.880, 25.900],
            [91.880, 25.570],
            [92.200, 25.450],
            [92.365, 25.105],
        ]
        return {
            "trip_id": trip.id,
            "route_id": f"RTE-AUTO-{trip.id[:8]}",
            "origin_name": trip.origin_name,
            "destination_name": trip.destination_name,
            "corridor_name": trip.corridor_name,
            "distance_km": trip.distance_km,
            "estimated_duration_minutes": 190.0,
            "coordinates": default_coords,
            "risk_score": 18.5,
            "risk_level": "LOW",
            "segments": [
                {"road_name": "NH-27 Guwahati East-West Corridor", "distance_km": 28.0, "status": "GREEN"},
                {"road_name": "NH-6 Sonapur Mountain Spine", "distance_km": 72.0, "status": "YELLOW"},
            ],
        }

    seg_stmt = select(RouteSegment).where(RouteSegment.route_id == planned_route.id).order_by(RouteSegment.sequence_order)
    seg_res = await db.execute(seg_stmt)
    segments = seg_res.scalars().all()

    return {
        "trip_id": trip.id,
        "route_id": planned_route.id,
        "origin_name": planned_route.origin_name,
        "destination_name": planned_route.destination_name,
        "corridor_name": planned_route.corridor_title,
        "distance_km": planned_route.distance_km,
        "estimated_duration_minutes": planned_route.estimated_time_minutes,
        "coordinates": planned_route.get_coordinates(),
        "risk_score": planned_route.risk_score,
        "risk_level": planned_route.risk_level.value,
        "segments": [
            {
                "road_name": s.road_name,
                "distance_km": s.distance_km,
                "estimated_time_minutes": s.estimated_time_minutes,
                "status": s.status,
                "has_incident": s.has_active_incident,
            }
            for s in segments
        ],
    }

# ==========================================
# 3. TRIP LIFECYCLE STATE ACTIONS
# ==========================================

@router.post("/{trip_id}/accept", response_model=TripResponse)
async def accept_trip(
    trip_id: str,
    payload: Optional[TripAcceptRequest] = None,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Driver accepts an assigned consignment trip (ASSIGNED -> ACCEPTED)."""
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized: Cannot accept another driver's trip")
    if trip.status not in [TripStatus.ASSIGNED, TripStatus.READY]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept trip in '{trip.status.value}' state. Expected 'ASSIGNED'.",
        )

    old_status = trip.status.value
    trip.status = TripStatus.ACCEPTED
    now = datetime.now(timezone.utc)
    trip.updated_at = now
    if payload and payload.notes:
        trip.notes = f"{trip.notes or ''}\nAcceptance Note: {payload.notes}".strip()

    history = TripStatusHistory(
        trip_id=trip.id,
        old_status=old_status,
        new_status=TripStatus.ACCEPTED.value,
        changed_by=current_user.name,
        reason=(payload.notes if payload else None) or "Trip accepted by driver",
        timestamp=now,
    )
    db.add(history)

    await db.commit()
    await db.refresh(trip)
    return TripResponse.model_validate(trip)

@router.post("/{trip_id}/start", response_model=TripResponse)
async def start_trip(
    trip_id: str,
    payload: Optional[TripStartRequest] = None,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Driver confirms and starts the assigned trip.
    Validates identity, prevents concurrent active trips, links TrackingSession, and dispatches TRIP_STARTED event.
    """
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized: Cannot start another driver's trip")

    # Concurrent active trip protection
    active_check_stmt = select(Trip).where(
        Trip.driver_id == current_user.id,
        Trip.id != trip.id,
        Trip.status.in_([TripStatus.STARTED, TripStatus.PAUSED]),
    )
    active_check_res = await db.execute(active_check_stmt)
    if active_check_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active trip in progress. Complete or pause it before starting another trip.",
        )

    if trip.status not in [TripStatus.ASSIGNED, TripStatus.ACCEPTED, TripStatus.READY]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start trip in '{trip.status.value}' state. Must be ASSIGNED or READY.",
        )

    old_status = trip.status.value
    trip.status = TripStatus.STARTED
    now = datetime.now(timezone.utc)
    trip.actual_start = now
    if payload:
        trip.start_latitude = payload.start_latitude
        trip.start_longitude = payload.start_longitude
    trip.updated_at = now

    # Link or initialize TrackingSession
    trk_stmt = select(TrackingSession).where(
        TrackingSession.driver_id == current_user.id,
        TrackingSession.status.in_([TrackingStatus.TRACKING, TrackingStatus.ACTIVE]),
    )
    trk_res = await db.execute(trk_stmt)
    trk = trk_res.scalars().first()

    if not trk:
        trk = TrackingSession(
            driver_id=current_user.id,
            vehicle_id=trip.vehicle_id,
            trip_id=trip.id,
            status=TrackingStatus.TRACKING,
            start_time=now,
            start_latitude=trip.start_latitude,
            start_longitude=trip.start_longitude,
            total_distance_km=0.0,
            ping_count=0,
            notes=f"Auto-linked to Trip {trip.trip_number}",
            created_at=now,
            updated_at=now,
        )
        db.add(trk)
    else:
        trk.trip_id = trip.id

    # Log TripEvent
    event = TripEvent(
        trip_id=trip.id,
        event_type="TRIP_STARTED",
        latitude=trip.start_latitude,
        longitude=trip.start_longitude,
        details=f"Trip started by driver {current_user.name}",
        created_by=current_user.id,
        timestamp=now,
    )
    db.add(event)

    # Log Status History
    history = TripStatusHistory(
        trip_id=trip.id,
        old_status=old_status,
        new_status=TripStatus.STARTED.value,
        changed_by=current_user.name,
        reason=(payload.notes if payload else None) or "Trip transit commenced",
        latitude=trip.start_latitude,
        longitude=trip.start_longitude,
        timestamp=now,
    )
    db.add(history)

    await db.commit()
    await db.refresh(trip)

    return TripResponse.model_validate(trip)

@router.post("/{trip_id}/pause", response_model=TripResponse)
async def pause_trip(
    trip_id: str,
    payload: Optional[TripPauseRequest] = None,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Pauses active transit for mountain rest, vehicle halt, or road blockage."""
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    if trip.status != TripStatus.STARTED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only pause an ACTIVE / STARTED trip")

    now = datetime.now(timezone.utc)
    old_status = trip.status.value
    trip.status = TripStatus.PAUSED
    trip.pause_started_at = now
    trip.pause_reason = (payload.reason if payload else None) or "Driver rest halt"
    trip.updated_at = now

    event = TripEvent(
        trip_id=trip.id,
        event_type="TRIP_PAUSED",
        latitude=payload.latitude if payload else None,
        longitude=payload.longitude if payload else None,
        details=f"Paused: {trip.pause_reason}",
        created_by=current_user.id,
        timestamp=now,
    )
    db.add(event)

    history = TripStatusHistory(
        trip_id=trip.id,
        old_status=old_status,
        new_status=TripStatus.PAUSED.value,
        changed_by=current_user.name,
        reason=trip.pause_reason,
        latitude=payload.latitude if payload else None,
        longitude=payload.longitude if payload else None,
        timestamp=now,
    )
    db.add(history)

    await db.commit()
    await db.refresh(trip)
    return TripResponse.model_validate(trip)

@router.post("/{trip_id}/resume", response_model=TripResponse)
async def resume_trip(
    trip_id: str,
    payload: Optional[TripResumeRequest] = None,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Resumes transit following a halt or rest pause."""
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    if trip.status != TripStatus.PAUSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only resume a PAUSED trip")

    now = datetime.now(timezone.utc)
    if trip.pause_started_at:
        paused_sec = int((now - trip.pause_started_at.replace(tzinfo=timezone.utc)).total_seconds())
        trip.pause_duration_seconds = (trip.pause_duration_seconds or 0) + max(0, paused_sec)
    trip.pause_started_at = None

    old_status = trip.status.value
    trip.status = TripStatus.STARTED
    trip.updated_at = now

    event = TripEvent(
        trip_id=trip.id,
        event_type="TRIP_RESUMED",
        latitude=payload.latitude if payload else None,
        longitude=payload.longitude if payload else None,
        details="Transit resumed by driver",
        created_by=current_user.id,
        timestamp=now,
    )
    db.add(event)

    history = TripStatusHistory(
        trip_id=trip.id,
        old_status=old_status,
        new_status=TripStatus.STARTED.value,
        changed_by=current_user.name,
        reason="Transit resumed",
        latitude=payload.latitude if payload else None,
        longitude=payload.longitude if payload else None,
        timestamp=now,
    )
    db.add(history)

    await db.commit()
    await db.refresh(trip)
    return TripResponse.model_validate(trip)

@router.post("/{trip_id}/complete", response_model=TripResponse)
async def complete_trip(
    trip_id: str,
    payload: Optional[TripCompleteRequest] = None,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Concludes trip upon arrival at destination depot, stopping GPS tracking."""
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if current_user.role == UserRole.DRIVER and trip.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    if trip.status not in [TripStatus.STARTED, TripStatus.PAUSED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only complete an ACTIVE / STARTED trip")

    now = datetime.now(timezone.utc)
    old_status = trip.status.value
    trip.status = TripStatus.COMPLETED
    trip.actual_end = now
    if payload:
        trip.end_latitude = payload.end_latitude
        trip.end_longitude = payload.end_longitude
        if payload.final_distance_km:
            trip.actual_distance_km = payload.final_distance_km

    if trip.actual_start:
        dur_min = (now - trip.actual_start.replace(tzinfo=timezone.utc)).total_seconds() / 60.0
        trip.actual_duration_minutes = round(dur_min, 1)

    if not trip.actual_distance_km:
        trip.actual_distance_km = trip.distance_km

    trip.updated_at = now

    # Stop active TrackingSession
    trk_stmt = select(TrackingSession).where(
        TrackingSession.trip_id == trip.id,
        TrackingSession.status.in_([TrackingStatus.TRACKING, TrackingStatus.ACTIVE, TrackingStatus.PAUSED]),
    )
    trk_res = await db.execute(trk_stmt)
    trk = trk_res.scalars().first()
    if trk:
        trk.status = TrackingStatus.COMPLETED
        trk.end_time = now
        trk.end_latitude = trip.end_latitude
        trk.end_longitude = trip.end_longitude
        trk.updated_at = now

    event = TripEvent(
        trip_id=trip.id,
        event_type="TRIP_COMPLETED",
        latitude=trip.end_latitude,
        longitude=trip.end_longitude,
        details="Trip completed and cargo delivered",
        created_by=current_user.id,
        timestamp=now,
    )
    db.add(event)

    history = TripStatusHistory(
        trip_id=trip.id,
        old_status=old_status,
        new_status=TripStatus.COMPLETED.value,
        changed_by=current_user.name,
        reason=(payload.notes if payload else None) or "Trip delivered successfully",
        latitude=trip.end_latitude,
        longitude=trip.end_longitude,
        timestamp=now,
    )
    db.add(history)

    await db.commit()
    await db.refresh(trip)
    return TripResponse.model_validate(trip)

# ==========================================
# 4. TRIP PROGRESS & DEVIATION MONITORING
# ==========================================

@router.get("/{trip_id}/progress", response_model=TripProgressResponse)
async def get_trip_progress(
    trip_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Calculates real-time progress percentage, remaining distance, current road, and deviation check."""
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    # Fetch Driver Live Location
    loc_stmt = select(DriverCurrentLocation).where(DriverCurrentLocation.driver_id == trip.driver_id)
    loc_res = await db.execute(loc_stmt)
    drv_loc = loc_res.scalar_one_or_none()

    curr_lat = drv_loc.latitude if drv_loc else 25.570
    curr_lon = drv_loc.longitude if drv_loc else 91.880

    # Fetch Planned Route coordinates
    r_stmt = select(PlannedRoute).where(PlannedRoute.trip_id == trip.id).order_by(desc(PlannedRoute.is_selected))
    r_res = await db.execute(r_stmt)
    route = r_res.scalars().first()

    coords = route.get_coordinates() if route else [[91.73, 26.18], [91.88, 25.57], [92.36, 25.10]]

    # Compute distance completed & deviation
    min_dist_to_route = float("inf")
    for pt in coords:
        d = haversine_distance_km(curr_lat, curr_lon, pt[1], pt[0])
        if d < min_dist_to_route:
            min_dist_to_route = d

    dest_lat = trip.end_latitude or (coords[-1][1] if coords else 25.105)
    dest_lon = trip.end_longitude or (coords[-1][0] if coords else 92.365)
    remaining_km = round(haversine_distance_km(curr_lat, curr_lon, dest_lat, dest_lon), 1)

    total_km = max(trip.distance_km, 1.0)
    completed_km = max(0.0, round(total_km - remaining_km, 1))
    progress_pct = min(100.0, max(0.0, round((completed_km / total_km) * 100.0, 1)))

    is_deviated = (min_dist_to_route > 1.5) and (drv_loc.accuracy_meters <= 25.0 if drv_loc else False)

    # Match nearest road
    roads_stmt = select(Road)
    roads_res = await db.execute(roads_stmt)
    roads = roads_res.scalars().all()
    _, _, road_name = find_nearest_road_segment(curr_lat, curr_lon, roads)

    return TripProgressResponse(
        trip_id=trip.id,
        trip_number=trip.trip_number,
        status=trip.status,
        total_distance_km=total_km,
        distance_completed_km=completed_km,
        distance_remaining_km=remaining_km,
        progress_percentage=progress_pct,
        estimated_remaining_minutes=round((remaining_km / 40.0) * 60.0, 0),
        current_road_name=road_name or "NH-6 Sonapur Highway Spine",
        is_deviated=is_deviated,
        deviation_distance_km=round(min_dist_to_route, 2),
    )

@router.get("/{trip_id}/events", response_model=List[TripEventResponse])
async def get_trip_events(
    trip_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns the immutable event history for a trip."""
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    res = await db.execute(stmt)
    trip = res.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    stmt_ev = select(TripEvent).where(TripEvent.trip_id == trip.id).order_by(TripEvent.timestamp)
    res_ev = await db.execute(stmt_ev)
    return res_ev.scalars().all()
