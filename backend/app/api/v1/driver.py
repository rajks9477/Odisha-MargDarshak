from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, update, desc

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.driver import (
    DriverProfile,
    Vehicle,
    Trip,
    DriverAlert,
    DriverAvailability,
    VehicleStatus,
    TripStatus,
)
from app.models.gis import (
    DriverCurrentLocation,
    LocationHistory,
    Road,
)
from app.models.audit import AuditLog
from app.schemas.driver import (
    DriverProfileResponse,
    VehicleResponse,
    TripResponse,
    DriverAlertResponse,
    DriverAvailabilityUpdateRequest,
)
from app.schemas.gis import (
    DriverLocationUpdateRequest,
    DriverLocationResponse,
    LocationBatchSyncRequest,
    LocationBatchSyncResponse,
)
from app.core.spatial import find_nearest_road

router = APIRouter(prefix="/driver", tags=["Driver Dashboard"])

async def get_or_create_driver_profile(user: User, db: AsyncSession) -> DriverProfile:
    result = await db.execute(select(DriverProfile).filter(DriverProfile.user_id == user.id))
    profile = result.scalars().first()

    if not profile:
        # Create a default driver profile for new drivers
        profile = DriverProfile(
            user_id=user.id,
            license_number=f"DL-{user.phone[-6:]}-ODI",
            experience_years=6,
            availability=DriverAvailability.AVAILABLE,
            current_location_name=f"{user.district or 'Bhubaneswar'}, {user.state or 'Odisha'}",
            emergency_contact="9876500000",
            blood_group="O+",
            last_active_at=datetime.now(timezone.utc),
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile

@router.get("/profile", response_model=DriverProfileResponse)
async def get_driver_profile(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    profile = await get_or_create_driver_profile(current_user, db)

    # 1. Fetch assigned vehicle if any
    assigned_vehicle = None
    if profile.assigned_vehicle_id:
        v_res = await db.execute(select(Vehicle).filter(Vehicle.id == profile.assigned_vehicle_id))
        vehicle = v_res.scalars().first()
        if vehicle:
            assigned_vehicle = VehicleResponse.model_validate(vehicle)
    else:
        # Fallback: check if any vehicle is assigned to this driver's user_id
        v_res = await db.execute(select(Vehicle).filter(Vehicle.assigned_driver_id == current_user.id))
        vehicle = v_res.scalars().first()
        if vehicle:
            assigned_vehicle = VehicleResponse.model_validate(vehicle)
            # update profile mapping
            profile.assigned_vehicle_id = vehicle.id
            await db.commit()

    # 2. Fetch active trip if any (prioritize STARTED / PAUSED)
    t_res = await db.execute(
        select(Trip)
        .filter(Trip.driver_id == current_user.id, Trip.status.in_([TripStatus.STARTED, TripStatus.PAUSED]))
        .order_by(desc(Trip.actual_start), desc(Trip.created_at))
    )
    active_trip_record = t_res.scalars().first()
    if not active_trip_record:
        t_res2 = await db.execute(
            select(Trip)
            .filter(Trip.driver_id == current_user.id, Trip.status.in_([TripStatus.ACCEPTED, TripStatus.ASSIGNED, TripStatus.READY]))
            .order_by(desc(Trip.created_at))
        )
        active_trip_record = t_res2.scalars().first()

    active_trip = TripResponse.model_validate(active_trip_record) if active_trip_record else None

    return DriverProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        license_number=profile.license_number,
        license_expiry=profile.license_expiry,
        experience_years=profile.experience_years,
        availability=profile.availability,
        current_location_name=profile.current_location_name,
        assigned_vehicle=assigned_vehicle,
        active_trip=active_trip,
        emergency_contact=profile.emergency_contact,
        blood_group=profile.blood_group,
        last_active_at=profile.last_active_at,
    )

@router.patch("/availability", response_model=dict)
async def update_driver_availability(
    payload: DriverAvailabilityUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    profile = await get_or_create_driver_profile(current_user, db)
    old_status = profile.availability
    profile.availability = payload.availability
    profile.last_active_at = datetime.now(timezone.utc)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DRIVER_STATUS_UPDATE",
        details=f"Availability changed from {old_status.value} to {payload.availability.value}"
    )
    db.add(audit)
    await db.commit()

    return {
        "success": True,
        "message": f"Availability updated to {payload.availability.value}",
        "availability": payload.availability.value
    }

@router.get("/vehicle", response_model=Optional[VehicleResponse])
async def get_assigned_vehicle(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    profile = await get_or_create_driver_profile(current_user, db)
    
    if profile.assigned_vehicle_id:
        result = await db.execute(select(Vehicle).filter(Vehicle.id == profile.assigned_vehicle_id))
        vehicle = result.scalars().first()
        if vehicle:
            return VehicleResponse.model_validate(vehicle)

    # Search by assigned_driver_id
    result = await db.execute(select(Vehicle).filter(Vehicle.assigned_driver_id == current_user.id))
    vehicle = result.scalars().first()
    if vehicle:
        return VehicleResponse.model_validate(vehicle)

    return None

@router.get("/active-trip", response_model=Optional[TripResponse])
async def get_active_trip(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Check for started or paused trip
    r1 = await db.execute(
        select(Trip)
        .filter(Trip.driver_id == current_user.id, Trip.status.in_([TripStatus.STARTED, TripStatus.PAUSED]))
        .order_by(desc(Trip.actual_start), desc(Trip.created_at))
    )
    trip = r1.scalars().first()
    if not trip:
        # 2. Fallback to accepted/assigned
        r2 = await db.execute(
            select(Trip)
            .filter(Trip.driver_id == current_user.id, Trip.status.in_([TripStatus.ACCEPTED, TripStatus.ASSIGNED, TripStatus.READY]))
            .order_by(desc(Trip.created_at))
        )
        trip = r2.scalars().first()

    if not trip:
        return None
    return TripResponse.model_validate(trip)


@router.get("/location", response_model=Optional[DriverLocationResponse])
async def get_driver_current_location(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch the authenticated driver's current position and telemetry."""
    stmt = select(DriverCurrentLocation).where(DriverCurrentLocation.driver_id == current_user.id)
    result = await db.execute(stmt)
    loc = result.scalar_one_or_none()

    if not loc:
        return None

    # Fetch assigned vehicle number if any
    profile = await get_or_create_driver_profile(current_user, db)
    vehicle_number = None
    if profile.assigned_vehicle_id:
        v_res = await db.execute(select(Vehicle).where(Vehicle.id == profile.assigned_vehicle_id))
        veh = v_res.scalar_one_or_none()
        if veh:
            vehicle_number = veh.vehicle_number

    delta_sec = (datetime.now(timezone.utc) - (loc.last_updated.replace(tzinfo=timezone.utc) if loc.last_updated.tzinfo is None else loc.last_updated)).total_seconds()
    freshness = "LIVE" if delta_sec <= 30.0 else ("STALE" if delta_sec <= 300.0 else "OFFLINE")

    return DriverLocationResponse(
        driver_id=current_user.id,
        driver_name=current_user.name,
        vehicle_number=vehicle_number,
        latitude=loc.latitude,
        longitude=loc.longitude,
        accuracy_meters=loc.accuracy_meters,
        speed_kmh=loc.speed_kmh or 0.0,
        heading_degrees=loc.heading_degrees or 0.0,
        is_moving=loc.is_moving,
        nearest_road_name=loc.nearest_road_name,
        freshness=freshness,
        tracking_status="TRACKING",
        last_updated=loc.last_updated,
    )

@router.post("/location", response_model=DriverLocationResponse)
async def update_driver_location(
    payload: DriverLocationUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Live GPS location update from driver's mobile device / browser.
    Updates current telemetry and logs to location history.
    """
    now = datetime.now(timezone.utc)
    client_time = payload.client_timestamp or now

    # 1. Determine nearest road name via spatial calculation
    all_roads_stmt = select(Road)
    roads_result = await db.execute(all_roads_stmt)
    roads = roads_result.scalars().all()
    nearest_road, dist_km = find_nearest_road(payload.latitude, payload.longitude, roads)
    nearest_road_name = f"{nearest_road.road_number} ({nearest_road.road_name})" if nearest_road else "NER Mountain Pass"

    # 2. Fetch driver profile & vehicle
    profile = await get_or_create_driver_profile(current_user, db)
    vehicle_id = profile.assigned_vehicle_id
    vehicle_number = None
    if vehicle_id:
        v_res = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
        veh = v_res.scalar_one_or_none()
        if veh:
            vehicle_number = veh.vehicle_number

    is_moving = (payload.speed_kmh or 0.0) > 3.0

    # 3. Update or Insert Current Location
    stmt = select(DriverCurrentLocation).where(DriverCurrentLocation.driver_id == current_user.id)
    result = await db.execute(stmt)
    current_loc = result.scalar_one_or_none()

    if not current_loc:
        current_loc = DriverCurrentLocation(
            driver_id=current_user.id,
            vehicle_id=vehicle_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            accuracy_meters=payload.accuracy_meters,
            speed_kmh=payload.speed_kmh or 0.0,
            heading_degrees=payload.heading_degrees or 0.0,
            is_moving=is_moving,
            nearest_road_name=nearest_road_name,
            last_updated=now,
        )
        db.add(current_loc)
    else:
        current_loc.latitude = payload.latitude
        current_loc.longitude = payload.longitude
        current_loc.accuracy_meters = payload.accuracy_meters
        current_loc.speed_kmh = payload.speed_kmh or 0.0
        current_loc.heading_degrees = payload.heading_degrees or 0.0
        current_loc.is_moving = is_moving
        current_loc.nearest_road_name = nearest_road_name
        current_loc.vehicle_id = vehicle_id
        current_loc.last_updated = now

    # 4. Record to LocationHistory
    history = LocationHistory(
        driver_id=current_user.id,
        vehicle_id=vehicle_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy_meters=payload.accuracy_meters,
        speed_kmh=payload.speed_kmh,
        heading_degrees=payload.heading_degrees,
        client_timestamp=client_time,
        server_timestamp=now,
        sync_status="SYNCED",
    )
    db.add(history)

    await db.commit()
    await db.refresh(current_loc)

    return DriverLocationResponse(
        driver_id=current_user.id,
        driver_name=current_user.name,
        vehicle_number=vehicle_number,
        latitude=current_loc.latitude,
        longitude=current_loc.longitude,
        accuracy_meters=current_loc.accuracy_meters,
        speed_kmh=current_loc.speed_kmh or 0.0,
        heading_degrees=current_loc.heading_degrees or 0.0,
        is_moving=current_loc.is_moving,
        nearest_road_name=current_loc.nearest_road_name,
        last_updated=current_loc.last_updated,
    )

@router.post("/location/sync-batch", response_model=LocationBatchSyncResponse)
async def sync_offline_location_batch(
    payload: LocationBatchSyncRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Offline sync endpoint: receives multiple location records captured locally during mountain network outages.
    Deduplicates and persists to LocationHistory, updating the current position to the latest ping.
    """
    if not payload.locations:
        return LocationBatchSyncResponse(
            synced_count=0,
            synced_local_ids=[],
            message="No offline records to sync",
        )

    now = datetime.now(timezone.utc)
    profile = await get_or_create_driver_profile(current_user, db)
    vehicle_id = profile.assigned_vehicle_id

    # Sort records chronologically
    sorted_locations = sorted(payload.locations, key=lambda x: x.client_timestamp)
    synced_ids = []

    for item in sorted_locations:
        hist = LocationHistory(
            driver_id=current_user.id,
            vehicle_id=vehicle_id,
            latitude=item.latitude,
            longitude=item.longitude,
            accuracy_meters=item.accuracy_meters,
            speed_kmh=item.speed_kmh,
            heading_degrees=item.heading_degrees,
            client_timestamp=item.client_timestamp,
            server_timestamp=now,
            sync_status="OFFLINE_BATCH",
        )
        db.add(hist)
        synced_ids.append(item.local_id)

    # Update current location to latest ping
    latest = sorted_locations[-1]
    all_roads_stmt = select(Road)
    roads_result = await db.execute(all_roads_stmt)
    roads = roads_result.scalars().all()
    nearest_road, _ = find_nearest_road(latest.latitude, latest.longitude, roads)
    nearest_road_name = f"{nearest_road.road_number} ({nearest_road.road_name})" if nearest_road else "NER Corridor"

    stmt = select(DriverCurrentLocation).where(DriverCurrentLocation.driver_id == current_user.id)
    result = await db.execute(stmt)
    current_loc = result.scalar_one_or_none()

    if not current_loc:
        current_loc = DriverCurrentLocation(
            driver_id=current_user.id,
            vehicle_id=vehicle_id,
            latitude=latest.latitude,
            longitude=latest.longitude,
            accuracy_meters=latest.accuracy_meters,
            speed_kmh=latest.speed_kmh or 0.0,
            heading_degrees=latest.heading_degrees or 0.0,
            is_moving=(latest.speed_kmh or 0.0) > 3.0,
            nearest_road_name=nearest_road_name,
            last_updated=latest.client_timestamp,
        )
        db.add(current_loc)
    else:
        current_loc.latitude = latest.latitude
        current_loc.longitude = latest.longitude
        current_loc.accuracy_meters = latest.accuracy_meters
        current_loc.speed_kmh = latest.speed_kmh or 0.0
        current_loc.heading_degrees = latest.heading_degrees or 0.0
        current_loc.is_moving = (latest.speed_kmh or 0.0) > 3.0
        current_loc.nearest_road_name = nearest_road_name
        current_loc.last_updated = latest.client_timestamp

    await db.commit()

    return LocationBatchSyncResponse(
        synced_count=len(synced_ids),
        synced_local_ids=synced_ids,
        message=f"Successfully synced {len(synced_ids)} offline GPS telemetry pings",
    )

