import json
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, update

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.driver import Trip, DriverProfile, Vehicle
from app.models.gis import Road, Bridge, DriverCurrentLocation, Incident
from app.models.route import PlannedRoute, RouteSegment, RouteEvent, RouteType, RouteRiskLevel
from app.schemas.route import (
    RouteCalculateRequest,
    PlannedRouteResponse,
    PlannedRouteDetailResponse,
    RouteSegmentResponse,
    RouteSelectResponse,
    RouteDeviationCheckRequest,
    RouteDeviationCheckResponse,
    RouteRecalculateRequest,
)
from app.services.routing.graph_builder import build_ner_road_graph, JUNCTIONS
from app.services.routing.route_engine import calculate_candidate_routes
from app.services.routing.deviation_detector import check_route_deviation

router = APIRouter(tags=["Smart Routing & Risk-Aware Planning"])

@router.get("/routes/hubs", response_model=List[dict])
async def get_logistics_hubs() -> Any:
    """Returns the list of supported logistics hubs, transit depots, and highway junctions in the NER."""
    return [
        {
            "id": k,
            "name": v["name"],
            "latitude": v["lat"],
            "longitude": v["lon"],
        }
        for k, v in JUNCTIONS.items()
    ]

@router.post("/routes/calculate", response_model=List[PlannedRouteResponse])
async def calculate_routes(
    payload: RouteCalculateRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Calculate safety-optimized and risk-aware candidate routes (RECOMMENDED, FASTEST, ALTERNATE).
    Evaluates real-time road conditions, mud accumulation, rockfalls, and bridge restrictions.
    """
    now = datetime.now(timezone.utc)
    trip = None
    vehicle_id = None

    start_lat = payload.origin_latitude
    start_lon = payload.origin_longitude
    dest_lat = payload.destination_latitude
    dest_lon = payload.destination_longitude
    origin_name = payload.origin_name or "Origin Point"
    dest_name = payload.destination_name or "Destination Point"

    # 1. Match from Named Hubs if coordinates are missing
    if (start_lat is None or start_lon is None) and payload.origin_name:
        for k, v in JUNCTIONS.items():
            if k.lower() in payload.origin_name.lower() or v["name"].lower() in payload.origin_name.lower():
                start_lat = v["lat"]
                start_lon = v["lon"]
                origin_name = v["name"]
                break

    if (dest_lat is None or dest_lon is None) and payload.destination_name:
        for k, v in JUNCTIONS.items():
            if k.lower() in payload.destination_name.lower() or v["name"].lower() in payload.destination_name.lower():
                dest_lat = v["lat"]
                dest_lon = v["lon"]
                dest_name = v["name"]
                break

    # 2. Resolve Trip Context if provided
    if payload.trip_id:
        t_stmt = select(Trip).where(Trip.id == payload.trip_id)
        t_res = await db.execute(t_stmt)
        trip = t_res.scalar_one_or_none()
        if trip:
            vehicle_id = trip.vehicle_id
            origin_name = trip.origin_name
            dest_name = trip.destination_name
            if dest_lat is None:
                dest_lat = trip.end_latitude or (24.83 if "Silchar" in trip.destination_name else (23.73 if "Aizawl" in trip.destination_name else 25.57))
                dest_lon = trip.end_longitude or (92.79 if "Silchar" in trip.destination_name else (92.71 if "Aizawl" in trip.destination_name else 91.88))
            if start_lat is None:
                start_lat = trip.start_latitude or 26.18
                start_lon = trip.start_longitude or 91.73

    # 3. Resolve Driver's Live Location if coordinates still missing
    if start_lat is None or start_lon is None:
        loc_stmt = select(DriverCurrentLocation).where(DriverCurrentLocation.driver_id == current_user.id)
        loc_res = await db.execute(loc_stmt)
        driver_loc = loc_res.scalar_one_or_none()
        if driver_loc:
            start_lat = driver_loc.latitude
            start_lon = driver_loc.longitude
            origin_name = driver_loc.location_name or "Driver Live Location"
        else:
            start_lat = 26.18
            start_lon = 91.73
            origin_name = "Guwahati Central Hub, Assam"

    if dest_lat is None or dest_lon is None:
        dest_lat = 24.83
        dest_lon = 92.79
        dest_name = "Silchar Food & Medical Depot, Assam"

    # 3. Load Active Roads & Incidents from Database
    r_stmt = select(Road)
    r_res = await db.execute(r_stmt)
    roads = r_res.scalars().all()

    inc_stmt = select(Incident).where(Incident.status == "ACTIVE")
    inc_res = await db.execute(inc_stmt)
    incidents = inc_res.scalars().all()

    # 4. Build Spatial Network Graph
    graph = build_ner_road_graph(roads, incidents)

    # 5. Calculate Multi-Route Candidates
    candidates = calculate_candidate_routes(
        graph,
        start_lat,
        start_lon,
        dest_lat,
        dest_lon,
        payload.mission_priority or "ESSENTIAL_SAFETY",
    )

    created_routes = []
    for cand in candidates:
        route = PlannedRoute(
            trip_id=payload.trip_id,
            driver_id=current_user.id,
            vehicle_id=vehicle_id,
            origin_name=origin_name,
            destination_name=dest_name,
            origin_latitude=start_lat,
            origin_longitude=start_lon,
            destination_latitude=dest_lat,
            destination_longitude=dest_lon,
            route_type=cand["route_type"],
            corridor_title=cand["corridor_title"],
            geometry_geojson=cand["geometry_geojson"],
            distance_km=cand["distance_km"],
            estimated_time_minutes=cand["estimated_time_minutes"],
            route_score=cand["route_score"],
            risk_level=cand["risk_level"],
            risk_score=cand["risk_score"],
            risk_reasons_json=json.dumps(cand["risk_reasons"]),
            is_selected=False,
            route_version=1,
            generated_at=now,
        )
        db.add(route)
        await db.flush()

        # Add segments
        for idx, edge in enumerate(cand.get("segments", [])):
            seg = RouteSegment(
                route_id=route.id,
                road_id=edge.get("road_id"),
                sequence_order=idx + 1,
                road_name=edge.get("road_name", "Highway Segment"),
                distance_km=edge.get("distance_km", 10.0),
                estimated_time_minutes=round((edge.get("distance_km", 10.0) / max(edge.get("base_speed_kmh", 40.0), 10.0)) * 60.0, 1),
                status=edge.get("status", "GREEN"),
                risk_penalty=1.0,
                has_active_incident=False,
            )
            db.add(seg)

        created_routes.append(route)

    await db.commit()
    for r in created_routes:
        await db.refresh(r)

    return [
        PlannedRouteResponse(
            id=r.id,
            trip_id=r.trip_id,
            driver_id=r.driver_id,
            vehicle_id=r.vehicle_id,
            origin_name=r.origin_name,
            destination_name=r.destination_name,
            origin_latitude=r.origin_latitude,
            origin_longitude=r.origin_longitude,
            destination_latitude=r.destination_latitude,
            destination_longitude=r.destination_longitude,
            route_type=r.route_type,
            corridor_title=r.corridor_title,
            geometry_geojson=r.geometry_geojson,
            distance_km=r.distance_km,
            estimated_time_minutes=r.estimated_time_minutes,
            route_score=r.route_score,
            risk_level=r.risk_level,
            risk_score=r.risk_score,
            risk_reasons=r.get_risk_reasons(),
            is_selected=r.is_selected,
            route_version=r.route_version,
            generated_at=r.generated_at,
            selected_at=r.selected_at,
        )
        for r in created_routes
    ]

@router.get("/routes/{route_id}", response_model=PlannedRouteDetailResponse)
async def get_route_details(
    route_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch complete route information with GeoJSON geometry and road segments."""
    stmt = select(PlannedRoute).where(PlannedRoute.id == route_id)
    res = await db.execute(stmt)
    route = res.scalar_one_or_none()

    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planned route not found")

    seg_stmt = select(RouteSegment).where(RouteSegment.route_id == route_id).order_by(RouteSegment.sequence_order)
    seg_res = await db.execute(seg_stmt)
    segments = seg_res.scalars().all()

    return PlannedRouteDetailResponse(
        id=route.id,
        trip_id=route.trip_id,
        driver_id=route.driver_id,
        vehicle_id=route.vehicle_id,
        origin_name=route.origin_name,
        destination_name=route.destination_name,
        origin_latitude=route.origin_latitude,
        origin_longitude=route.origin_longitude,
        destination_latitude=route.destination_latitude,
        destination_longitude=route.destination_longitude,
        route_type=route.route_type,
        corridor_title=route.corridor_title,
        geometry_geojson=route.geometry_geojson,
        distance_km=route.distance_km,
        estimated_time_minutes=route.estimated_time_minutes,
        route_score=route.route_score,
        risk_level=route.risk_level,
        risk_score=route.risk_score,
        risk_reasons=route.get_risk_reasons(),
        is_selected=route.is_selected,
        route_version=route.route_version,
        generated_at=route.generated_at,
        selected_at=route.selected_at,
        segments=[RouteSegmentResponse.model_validate(s) for s in segments],
    )

@router.post("/routes/{route_id}/select", response_model=RouteSelectResponse)
async def select_route(
    route_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Driver formally selects and activates a planned route for their active transit dispatch."""
    stmt = select(PlannedRoute).where(PlannedRoute.id == route_id)
    res = await db.execute(stmt)
    route = res.scalar_one_or_none()

    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    if route.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    now = datetime.now(timezone.utc)

    # Unselect other routes for this driver/trip
    if route.trip_id:
        await db.execute(
            update(PlannedRoute)
            .where(PlannedRoute.trip_id == route.trip_id)
            .values(is_selected=False)
        )
    else:
        await db.execute(
            update(PlannedRoute)
            .where(PlannedRoute.driver_id == current_user.id)
            .values(is_selected=False)
        )

    route.is_selected = True
    route.selected_at = now

    event = RouteEvent(
        route_id=route_id,
        event_type="ROUTE_SELECTED",
        latitude=route.origin_latitude,
        longitude=route.origin_longitude,
        description=f"Driver selected {route.route_type.value} corridor: {route.corridor_title}",
        timestamp=now,
    )
    db.add(event)
    await db.commit()

    return RouteSelectResponse(
        route_id=route.id,
        trip_id=route.trip_id,
        status="ACTIVE",
        message=f"Successfully activated {route.route_type.value} route ({route.corridor_title})",
        selected_at=now,
    )

@router.get("/trips/{trip_id}/routes", response_model=List[PlannedRouteResponse])
async def get_trip_routes(
    trip_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch all candidate routes calculated for a specific trip."""
    stmt = select(PlannedRoute).where(PlannedRoute.trip_id == trip_id).order_by(desc(PlannedRoute.generated_at))
    res = await db.execute(stmt)
    routes = res.scalars().all()

    return [
        PlannedRouteResponse(
            id=r.id,
            trip_id=r.trip_id,
            driver_id=r.driver_id,
            vehicle_id=r.vehicle_id,
            origin_name=r.origin_name,
            destination_name=r.destination_name,
            origin_latitude=r.origin_latitude,
            origin_longitude=r.origin_longitude,
            destination_latitude=r.destination_latitude,
            destination_longitude=r.destination_longitude,
            route_type=r.route_type,
            corridor_title=r.corridor_title,
            geometry_geojson=r.geometry_geojson,
            distance_km=r.distance_km,
            estimated_time_minutes=r.estimated_time_minutes,
            route_score=r.route_score,
            risk_level=r.risk_level,
            risk_score=r.risk_score,
            risk_reasons=r.get_risk_reasons(),
            is_selected=r.is_selected,
            route_version=r.route_version,
            generated_at=r.generated_at,
            selected_at=r.selected_at,
        )
        for r in routes
    ]

@router.post("/routes/{route_id}/check-deviation", response_model=RouteDeviationCheckResponse)
async def check_deviation(
    route_id: str,
    payload: RouteDeviationCheckRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Evaluates cross-track deviation between driver's live GPS position and the active route."""
    stmt = select(PlannedRoute).where(PlannedRoute.id == route_id)
    res = await db.execute(stmt)
    route = res.scalar_one_or_none()

    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")

    coords = route.get_coordinates()
    threshold = payload.deviation_threshold_km or 1.5

    result = check_route_deviation(
        payload.current_latitude,
        payload.current_longitude,
        coords,
        threshold,
    )

    if result["is_deviated"]:
        event = RouteEvent(
            route_id=route_id,
            event_type="DEVIATION_DETECTED",
            latitude=payload.current_latitude,
            longitude=payload.current_longitude,
            description=f"Deviation detected: {result['distance_from_route_km']} km away from corridor",
            timestamp=datetime.now(timezone.utc),
        )
        db.add(event)
        await db.commit()

    return RouteDeviationCheckResponse(
        route_id=route_id,
        is_deviated=result["is_deviated"],
        distance_from_route_km=result["distance_from_route_km"],
        threshold_km=threshold,
        status=result["status"],
        message=result["message"],
    )
