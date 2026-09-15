from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, update

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.driver import Trip, DriverProfile, Vehicle
from app.models.gis import Road, DriverCurrentLocation, LocationHistory
from app.models.tracking import (
    TrackingSession,
    SessionLocationPing,
    TrackingStatus,
    LocationFreshness,
)
from app.schemas.tracking import (
    LocationPingCreate,
    LocationPingResponse,
    TrackingSessionCreate,
    TrackingSessionResponse,
    TrackingSessionStopRequest,
    DriverCurrentLocationResponse,
    OfflineLocationBatchSync,
)
from app.core.spatial import haversine_distance_km
from app.services.tracking.validation import validate_gps_ping

router = APIRouter(tags=["Live GPS Tracking & Driver Location System"])

# In-memory fast cache simulating Redis cluster for sub-millisecond location access
REDIS_LOCATION_CACHE = {}

async def get_nearest_road(db: AsyncSession, lat: float, lon: float):
    r_stmt = select(Road)
    r_res = await db.execute(r_stmt)
    roads = r_res.scalars().all()
    
    nearest_road = None
    min_dist = float("inf")
    for r in roads:
        coords = r.get_coordinates()
        for pt in coords:
            d = haversine_distance_km(lat, lon, pt[1], pt[0])
            if d < min_dist:
                min_dist = d
                nearest_road = r

    if nearest_road and min_dist <= 25.0:
        return nearest_road.id, nearest_road.road_name
    return None, "North Eastern Regional Highway Corridor"

def determine_freshness(last_updated: datetime) -> LocationFreshness:
    if last_updated.tzinfo is None:
        last_updated = last_updated.replace(tzinfo=timezone.utc)
    delta_sec = (datetime.now(timezone.utc) - last_updated).total_seconds()
    if delta_sec <= 30.0:
        return LocationFreshness.LIVE
    elif delta_sec <= 300.0:
        return LocationFreshness.STALE
    else:
        return LocationFreshness.OFFLINE

# ==========================================
# 1. TRACKING SESSION LIFECYCLE APIS
# ==========================================

@router.post("/tracking/sessions", response_model=TrackingSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_or_recover_tracking_session(
    payload: TrackingSessionCreate,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Initializes or recovers a live GPS tracking session bound to the active transit trip."""
    # 1. Check if an active session already exists (Session Recovery)
    existing_stmt = (
        select(TrackingSession)
        .where(
            TrackingSession.driver_id == current_user.id,
            TrackingSession.status.in_([TrackingStatus.TRACKING, TrackingStatus.ACTIVE]),
        )
        .order_by(desc(TrackingSession.created_at))
    )
    existing_res = await db.execute(existing_stmt)
    existing_session = existing_res.scalars().first()
    if existing_session:
        return existing_session

    # 2. Derive Driver Profile and Assigned Vehicle
    d_stmt = select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    d_res = await db.execute(d_stmt)
    driver_profile = d_res.scalars().first()

    if not driver_profile or not driver_profile.assigned_vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver does not have an assigned operational vehicle to track",
        )

    vehicle_id = driver_profile.assigned_vehicle_id
    trip_id = payload.trip_id

    # 3. Derive Active Trip if not explicitly provided
    if not trip_id:
        t_stmt = (
            select(Trip)
            .where(
                Trip.driver_id == current_user.id,
                Trip.status.in_(["ACCEPTED", "STARTED", "PAUSED"]),
            )
            .order_by(desc(Trip.created_at))
        )
        t_res = await db.execute(t_stmt)
        active_trip = t_res.scalars().first()
        if active_trip:
            trip_id = active_trip.id

    now = datetime.now(timezone.utc)
    new_session = TrackingSession(
        driver_id=current_user.id,
        vehicle_id=vehicle_id,
        trip_id=trip_id,
        status=TrackingStatus.TRACKING,
        start_time=now,
        start_latitude=payload.start_latitude,
        start_longitude=payload.start_longitude,
        total_distance_km=0.0,
        ping_count=0,
        max_speed_kmh=0.0,
        notes=payload.notes,
        created_at=now,
        updated_at=now,
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.get("/tracking/sessions/active", response_model=Optional[TrackingSessionResponse])
async def get_active_tracking_session(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Recovers the active tracking session if the driver app was backgrounded or terminated."""
    stmt = (
        select(TrackingSession)
        .where(
            TrackingSession.driver_id == current_user.id,
            TrackingSession.status.in_([TrackingStatus.TRACKING, TrackingStatus.ACTIVE]),
        )
        .order_by(desc(TrackingSession.created_at))
    )
    res = await db.execute(stmt)
    return res.scalars().first()

@router.post("/tracking/sessions/{session_id}/locations", response_model=LocationPingResponse)
async def ingest_location_ping(
    session_id: str,
    payload: LocationPingCreate,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Ingests, validates, and processes a live GPS telemetry point during transit."""
    # 1. Fetch Tracking Session
    s_stmt = select(TrackingSession).where(TrackingSession.id == session_id)
    s_res = await db.execute(s_stmt)
    session = s_res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking session not found")

    if session.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to tracking session")

    # 2. Get Last Known Ping for Anomaly Speed Detection
    last_ping_data = REDIS_LOCATION_CACHE.get(session.vehicle_id)

    is_valid, is_anomalous, accuracy_grade, val_note = validate_gps_ping(
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy_meters=payload.accuracy_meters,
        client_timestamp=payload.client_timestamp,
        last_ping=last_ping_data,
    )

    now = datetime.now(timezone.utc)

    # 3. Spatial Nearest Road Resolution
    road_id, road_name = await get_nearest_road(db, payload.latitude, payload.longitude)

    # 4. Save SessionLocationPing Record
    ping = SessionLocationPing(
        session_id=session.id,
        driver_id=current_user.id,
        vehicle_id=session.vehicle_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        altitude_meters=payload.altitude_meters,
        accuracy_meters=payload.accuracy_meters,
        speed_kmh=payload.speed_kmh or 0.0,
        heading_degrees=payload.heading_degrees or 0.0,
        nearest_road_id=road_id,
        nearest_road_name=road_name,
        accuracy_grade=accuracy_grade,
        is_valid=is_valid,
        is_anomalous=is_anomalous,
        validation_note=val_note,
        client_timestamp=payload.client_timestamp,
        server_timestamp=now,
        sync_status="SYNCED",
    )
    db.add(ping)

    # 5. Update Session Cumulative Telemetry Stats
    if is_valid and not is_anomalous:
        if last_ping_data:
            step_dist = haversine_distance_km(
                last_ping_data["latitude"], last_ping_data["longitude"], payload.latitude, payload.longitude
            )
            session.total_distance_km = round(session.total_distance_km + step_dist, 3)
        session.ping_count += 1
        session.max_speed_kmh = max(session.max_speed_kmh, payload.speed_kmh or 0.0)
        session.updated_at = now

        # Update DriverCurrentLocation
        loc_stmt = select(DriverCurrentLocation).where(DriverCurrentLocation.driver_id == current_user.id)
        loc_res = await db.execute(loc_stmt)
        drv_loc = loc_res.scalar_one_or_none()

        if drv_loc:
            drv_loc.latitude = payload.latitude
            drv_loc.longitude = payload.longitude
            drv_loc.accuracy_meters = payload.accuracy_meters
            drv_loc.speed_kmh = payload.speed_kmh or 0.0
            drv_loc.heading_degrees = payload.heading_degrees or 0.0
            drv_loc.is_moving = (payload.speed_kmh or 0.0) > 2.0
            drv_loc.nearest_road_name = road_name
            drv_loc.last_updated = now
        else:
            drv_loc = DriverCurrentLocation(
                driver_id=current_user.id,
                vehicle_id=session.vehicle_id,
                latitude=payload.latitude,
                longitude=payload.longitude,
                accuracy_meters=payload.accuracy_meters,
                speed_kmh=payload.speed_kmh or 0.0,
                heading_degrees=payload.heading_degrees or 0.0,
                is_moving=(payload.speed_kmh or 0.0) > 2.0,
                nearest_road_name=road_name,
                last_updated=now,
            )
            db.add(drv_loc)

        # Update Fast State Cache (Simulating Redis)
        REDIS_LOCATION_CACHE[session.vehicle_id] = {
            "driver_id": current_user.id,
            "vehicle_id": session.vehicle_id,
            "trip_id": session.trip_id,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "accuracy": payload.accuracy_meters,
            "speed_kmh": payload.speed_kmh,
            "heading_degrees": payload.heading_degrees,
            "nearest_road_name": road_name,
            "timestamp": now,
        }

    await db.commit()
    await db.refresh(ping)
    return ping

@router.post("/tracking/sessions/{session_id}/stop", response_model=TrackingSessionResponse)
async def stop_tracking_session(
    session_id: str,
    payload: Optional[TrackingSessionStopRequest] = None,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Stops and completes a live tracking session upon trip conclusion."""
    stmt = select(TrackingSession).where(TrackingSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking session not found")

    now = datetime.now(timezone.utc)
    session.status = TrackingStatus.COMPLETED
    session.end_time = now
    if payload:
        session.end_latitude = payload.end_latitude
        session.end_longitude = payload.end_longitude
        session.notes = payload.notes or session.notes

    session.updated_at = now
    await db.commit()
    await db.refresh(session)
    return session

@router.get("/tracking/sessions/{session_id}", response_model=TrackingSessionResponse)
async def get_tracking_session_detail(
    session_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(TrackingSession).where(TrackingSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking session not found")
    return session

# ==========================================
# 2. DRIVER & FLEET LOCATION HUD APIS
# ==========================================

@router.get("/driver/location", response_model=DriverCurrentLocationResponse)
async def get_driver_live_location(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns the authenticated driver's current position with freshness & GPS quality status."""
    loc_stmt = select(DriverCurrentLocation).where(DriverCurrentLocation.driver_id == current_user.id)
    loc_res = await db.execute(loc_stmt)
    drv_loc = loc_res.scalar_one_or_none()

    # Resolve active trip number
    trip_stmt = (
        select(Trip)
        .where(Trip.driver_id == current_user.id, Trip.status.in_(["ACCEPTED", "STARTED", "PAUSED"]))
        .order_by(desc(Trip.created_at))
    )
    trip_res = await db.execute(trip_stmt)
    active_trip = trip_res.scalars().first()

    # Resolve active tracking session
    s_stmt = (
        select(TrackingSession)
        .where(
            TrackingSession.driver_id == current_user.id,
            TrackingSession.status.in_([TrackingStatus.TRACKING, TrackingStatus.ACTIVE]),
        )
        .order_by(desc(TrackingSession.created_at))
    )
    s_res = await db.execute(s_stmt)
    session = s_res.scalars().first()

    now = datetime.now(timezone.utc)
    if drv_loc:
        freshness = determine_freshness(drv_loc.last_updated)
        return DriverCurrentLocationResponse(
            driver_id=current_user.id,
            driver_name=current_user.name,
            vehicle_id=drv_loc.vehicle_id,
            vehicle_number="AS-01-GC-9104",
            trip_id=active_trip.id if active_trip else None,
            trip_number=active_trip.trip_number if active_trip else None,
            latitude=drv_loc.latitude,
            longitude=drv_loc.longitude,
            accuracy_meters=drv_loc.accuracy_meters,
            speed_kmh=drv_loc.speed_kmh,
            heading_degrees=drv_loc.heading_degrees,
            nearest_road_id=None,
            nearest_road_name=drv_loc.nearest_road_name or "NH-6 Sonapur Highway Spine",
            freshness=freshness,
            tracking_status=session.status if session else TrackingStatus.NOT_TRACKING,
            last_updated_at=drv_loc.last_updated,
        )
    else:
        # Return fallback starting point in Guwahati
        return DriverCurrentLocationResponse(
            driver_id=current_user.id,
            driver_name=current_user.name,
            vehicle_id=None,
            vehicle_number=None,
            trip_id=active_trip.id if active_trip else None,
            trip_number=active_trip.trip_number if active_trip else None,
            latitude=26.185,
            longitude=91.745,
            accuracy_meters=10.0,
            speed_kmh=0.0,
            heading_degrees=0.0,
            nearest_road_id="NH-27-KAMRUP-01",
            nearest_road_name="NH-27 Guwahati East-West Corridor",
            freshness=LocationFreshness.OFFLINE,
            tracking_status=TrackingStatus.NOT_TRACKING,
            last_updated_at=now,
        )

@router.get("/tracking/vehicles/live", response_model=List[DriverCurrentLocationResponse])
async def get_authorized_fleet_locations(
    current_user: User = Depends(require_roles([UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Government and Field Officer endpoint to monitor live authorized vehicle positions."""
    stmt = select(DriverCurrentLocation)
    res = await db.execute(stmt)
    locations = res.scalars().all()

    results = []
    for loc in locations:
        u_stmt = select(User).where(User.id == loc.driver_id)
        u_res = await db.execute(u_stmt)
        user = u_res.scalar_one_or_none()
        driver_name = user.name if user else "Essential Supply Carrier"

        freshness = determine_freshness(loc.last_updated)
        results.append(
            DriverCurrentLocationResponse(
                driver_id=loc.driver_id,
                driver_name=driver_name,
                vehicle_id=loc.vehicle_id,
                vehicle_number="AS-01-GC-9104",
                trip_id=None,
                trip_number=None,
                latitude=loc.latitude,
                longitude=loc.longitude,
                accuracy_meters=loc.accuracy_meters,
                speed_kmh=loc.speed_kmh,
                heading_degrees=loc.heading_degrees,
                nearest_road_id=None,
                nearest_road_name=loc.nearest_road_name or "NH-6 Sonapur Highway Spine",
                freshness=freshness,
                tracking_status=TrackingStatus.TRACKING,
                last_updated_at=loc.last_updated,
            )
        )
    return results

@router.post("/tracking/sessions/{session_id}/sync-offline", response_model=List[LocationPingResponse])
async def sync_offline_tracking_pings(
    session_id: str,
    payload: OfflineLocationBatchSync,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Batch synchronizes location pings collected offline in remote mountain valley sectors."""
    synced_pings = []
    for ping_create in payload.pings:
        ping_resp = await ingest_location_ping(session_id, ping_create, current_user, db)
        synced_pings.append(ping_resp)
    return synced_pings
