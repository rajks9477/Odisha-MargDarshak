import json
from datetime import datetime, timezone
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, desc

from app.core.rbac import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.gis import (
    Road,
    Bridge,
    District,
    Incident,
    RoadStatus,
    IncidentType,
    IncidentSeverity,
    DriverCurrentLocation,
)
from app.models.infrastructure import (
    Infrastructure,
    InfrastructureType,
    InfrastructureStatus,
)
from app.models.audit import AuditLog
from app.schemas.gis import (
    RoadResponse,
    RoadDetailResponse,
    BridgeResponse,
    DistrictResponse,
    IncidentResponse,
)
from app.schemas.map import (
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    InfrastructureResponse,
    MapLayerConfig,
    MapSearchItem,
    RoadMatchResponse,
)
from app.core.spatial import haversine_distance_km
from app.services.map.spatial import (
    point_in_polygon,
    is_point_in_bbox,
    find_nearest_road_segment,
    to_geojson_feature,
    to_geojson_feature_collection,
)

router = APIRouter(tags=["GIS & Spatial Map"])

# ==========================================
# 1. GEOJSON INCIDENTS & HAZARDS
# ==========================================

@router.get("/incidents")
async def get_map_incidents(
    bbox: Optional[str] = Query(None, description="Bounding box as min_lon,min_lat,max_lon,max_lat"),
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[IncidentSeverity] = Query(None),
    incident_type: Optional[IncidentType] = Query(None, alias="type"),
    response_format: Optional[str] = Query("json", alias="format", description="'geojson' or 'json'"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Fetches geo-located road hazards with spatial bounding box and role-based filtering.
    Normal drivers and citizens only see ACTIVE / VERIFIED incidents; internal / rejected reports are hidden.
    """
    stmt = select(Incident)

    # Role-based visibility filter
    if current_user.role not in [UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN]:
        stmt = stmt.where(Incident.status.in_(["ACTIVE", "VERIFIED"]))
    elif status_filter:
        stmt = stmt.where(Incident.status == status_filter)

    if severity:
        stmt = stmt.where(Incident.severity == severity)
    if incident_type:
        stmt = stmt.where(Incident.incident_type == incident_type)

    res = await db.execute(stmt)
    incidents = res.scalars().all()

    # Bounding box filter
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(","))
            incidents = [
                inc for inc in incidents
                if is_point_in_bbox(inc.latitude, inc.longitude, min_lon, min_lat, max_lon, max_lat)
            ]
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bbox format. Use: min_lon,min_lat,max_lon,max_lat")

    if response_format.lower() == "geojson":
        features = []
        for inc in incidents:
            feat = to_geojson_feature(
                id_val=inc.id,
                geometry_type="Point",
                coordinates=[inc.longitude, inc.latitude],
                properties={
                    "incident_type": inc.incident_type.value,
                    "severity": inc.severity.value,
                    "road_name": inc.road_name,
                    "district_name": inc.district_name,
                    "state": inc.state,
                    "status": inc.status,
                    "description": inc.description,
                    "created_at": inc.created_at.isoformat(),
                },
            )
            features.append(feat)
        return to_geojson_feature_collection(features)

    return [
        IncidentResponse(
            id=inc.id,
            incident_type=inc.incident_type,
            severity=inc.severity,
            latitude=inc.latitude,
            longitude=inc.longitude,
            road_name=inc.road_name,
            district_name=inc.district_name,
            state=inc.state,
            status=inc.status,
            description=inc.description,
            created_at=inc.created_at,
        )
        for inc in incidents
    ]

# ==========================================
# 2. ROADS & CORRIDOR SEGMENTS
# ==========================================

@router.get("/roads")
async def get_map_roads(
    bbox: Optional[str] = Query(None, description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    state: Optional[str] = Query(None),
    status_filter: Optional[RoadStatus] = Query(None, alias="status"),
    response_format: Optional[str] = Query("json", alias="format"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetches high-altitude highway corridors and pass segments."""
    stmt = select(Road)
    if state:
        stmt = stmt.where(Road.state == state)
    if status_filter:
        stmt = stmt.where(Road.status == status_filter)

    res = await db.execute(stmt)
    roads = res.scalars().all()

    if response_format.lower() == "geojson":
        features = []
        for r in roads:
            coords = r.get_coordinates()
            feat = to_geojson_feature(
                id_val=r.id,
                geometry_type="LineString",
                coordinates=coords,
                properties={
                    "road_name": r.road_name,
                    "road_number": r.road_number,
                    "road_type": r.road_type,
                    "district_name": r.district_name,
                    "state": r.state,
                    "status": r.status.value,
                    "status_reason": r.status_reason,
                    "average_speed_kmh": r.average_speed_kmh,
                    "is_bridge_section": r.is_bridge_section,
                },
            )
            features.append(feat)
        return to_geojson_feature_collection(features)

    return [
        RoadResponse(
            id=r.id,
            road_name=r.road_name,
            road_number=r.road_number,
            road_type=r.road_type,
            district_name=r.district_name,
            state=r.state,
            status=r.status,
            status_reason=r.status_reason,
            average_speed_kmh=r.average_speed_kmh,
            is_bridge_section=r.is_bridge_section,
            coordinates=r.get_coordinates(),
            last_updated=r.last_updated,
        )
        for r in roads
    ]

@router.get("/roads/{road_id}", response_model=RoadDetailResponse)
async def get_road_detail(
    road_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetches details for a specific road corridor segment with nearby hazards and bridges."""
    stmt = select(Road).where(Road.id == road_id)
    res = await db.execute(stmt)
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Road segment not found")

    # Fetch incidents along road
    inc_stmt = select(Incident).where(Incident.road_id == road_id)
    inc_res = await db.execute(inc_stmt)
    incidents = inc_res.scalars().all()

    # Fetch bridges along road
    brg_stmt = select(Bridge).where(Bridge.road_id == road_id)
    brg_res = await db.execute(brg_stmt)
    bridges = brg_res.scalars().all()

    return RoadDetailResponse(
        id=r.id,
        road_name=r.road_name,
        road_number=r.road_number,
        road_type=r.road_type,
        district_name=r.district_name,
        state=r.state,
        status=r.status,
        status_reason=r.status_reason,
        average_speed_kmh=r.average_speed_kmh,
        is_bridge_section=r.is_bridge_section,
        coordinates=r.get_coordinates(),
        last_updated=r.last_updated,
        nearby_incidents=[
            {
                "id": inc.id,
                "type": inc.incident_type.value,
                "severity": inc.severity.value,
                "description": inc.description,
                "created_at": inc.created_at.isoformat(),
            }
            for inc in incidents
        ],
        nearby_bridges=[
            {
                "id": brg.id,
                "name": brg.bridge_name,
                "status": brg.status.value,
                "capacity_tonnes": brg.capacity_tonnes,
            }
            for brg in bridges
        ],
    )

# ==========================================
# 3. ESSENTIAL INFRASTRUCTURE
# ==========================================

@router.get("/infrastructure", response_model=List[InfrastructureResponse])
async def get_map_infrastructure(
    infra_type: Optional[InfrastructureType] = Query(None, alias="type"),
    state: Optional[str] = Query(None),
    is_emergency_critical: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetches hospitals, warehouses, relief centres, and fuel depots across NER."""
    stmt = select(Infrastructure)
    
    # Public security guard
    if current_user.role not in [UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN]:
        stmt = stmt.where(Infrastructure.is_public == True)

    if infra_type:
        stmt = stmt.where(Infrastructure.type == infra_type)
    if state:
        stmt = stmt.where(Infrastructure.state == state)
    if is_emergency_critical is not None:
        stmt = stmt.where(Infrastructure.is_emergency_critical == is_emergency_critical)

    res = await db.execute(stmt)
    return res.scalars().all()

# ==========================================
# 4. AUTHORIZED GOVERNMENT VEHICLE FLEET
# ==========================================

@router.get("/vehicles")
async def get_map_vehicles(
    current_user: User = Depends(require_roles([UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Authorized endpoint for officers and disaster nodal authorities to track active freight carriers."""
    stmt = select(DriverCurrentLocation)
    res = await db.execute(stmt)
    locations = res.scalars().all()

    # Record Audit Log for sensitive tracking layer query
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="GOVERNMENT_FLEET_LAYER_ACCESS",
        details=f"Viewed {len(locations)} active carrier tracking points",
    )
    db.add(audit)
    await db.commit()

    features = []
    for loc in locations:
        u_stmt = select(User).where(User.id == loc.driver_id)
        u_res = await db.execute(u_stmt)
        user = u_res.scalar_one_or_none()

        delta_sec = (datetime.now(timezone.utc) - (loc.last_updated.replace(tzinfo=timezone.utc) if loc.last_updated.tzinfo is None else loc.last_updated)).total_seconds()
        freshness = "LIVE" if delta_sec <= 30.0 else ("STALE" if delta_sec <= 300.0 else "OFFLINE")

        features.append({
            "id": loc.id,
            "driver_id": loc.driver_id,
            "driver_name": user.name if user else "Essential Supply Carrier",
            "vehicle_id": loc.vehicle_id or "AS-01-GC-9104",
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "accuracy_meters": loc.accuracy_meters,
            "speed_kmh": loc.speed_kmh or 0.0,
            "heading_degrees": loc.heading_degrees or 0.0,
            "is_moving": loc.is_moving,
            "nearest_road_name": loc.nearest_road_name or "NH-6 Corridor",
            "freshness": freshness,
            "last_updated": loc.last_updated.isoformat(),
        })

    return features

# ==========================================
# 5. MAP LAYERS METADATA
# ==========================================

@router.get("/layers", response_model=List[MapLayerConfig])
async def get_map_layers(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Returns available map layer configuration tokens."""
    layers = [
        MapLayerConfig(
            id="my_location",
            name="Driver Live GPS Position",
            category="Tracking",
            default_visible=True,
            icon="Navigation",
            description="Real-time vehicle position and GPS accuracy halo",
        ),
        MapLayerConfig(
            id="incidents",
            name="Road Incidents & Hazards",
            category="Hazards",
            default_visible=True,
            icon="AlertTriangle",
            description="Verified landslides, rockfalls, and waterlogging points",
        ),
        MapLayerConfig(
            id="roads",
            name="Road Network & Status",
            category="Infrastructure",
            default_visible=True,
            icon="Route",
            description="Color-coded arterial highways (Green/Yellow/Orange/Red)",
        ),
        MapLayerConfig(
            id="infrastructure",
            name="Emergency Infrastructure",
            category="Facilities",
            default_visible=True,
            icon="Building2",
            description="Hospitals, relief centers, warehouses, and fuel reserves",
        ),
        MapLayerConfig(
            id="bridges",
            name="Mountain Bridges & River Crossings",
            category="Facilities",
            default_visible=True,
            icon="Anchor",
            description="Bridge capacity limits and river scour water levels",
        ),
    ]

    if current_user.role in [UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN]:
        layers.append(
            MapLayerConfig(
                id="vehicles",
                name="Government Fleet Telemetry",
                category="Operations",
                default_visible=False,
                requires_role="FIELD_OFFICER",
                icon="Truck",
                description="Live multi-vehicle tracking across North Eastern transport corridors",
            )
        )

    return layers

# ==========================================
# 6. NEARBY OBJECTS SPATIAL QUERY
# ==========================================

@router.get("/nearby")
async def get_nearby_map_objects(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(25.0, ge=0.5, le=200.0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """PostGIS/Spatial radial distance query to fetch hazards and emergency infrastructure within radius."""
    # 1. Nearby Incidents
    inc_stmt = select(Incident)
    if current_user.role not in [UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN]:
        inc_stmt = inc_stmt.where(Incident.status.in_(["ACTIVE", "VERIFIED"]))

    inc_res = await db.execute(inc_stmt)
    all_inc = inc_res.scalars().all()

    nearby_incidents = []
    for inc in all_inc:
        d = haversine_distance_km(lat, lng, inc.latitude, inc.longitude)
        if d <= radius_km:
            nearby_incidents.append({
                "id": inc.id,
                "type": inc.incident_type.value,
                "severity": inc.severity.value,
                "road_name": inc.road_name,
                "latitude": inc.latitude,
                "longitude": inc.longitude,
                "distance_km": round(d, 2),
                "description": inc.description,
            })
    nearby_incidents.sort(key=lambda x: x["distance_km"])

    # 2. Nearby Infrastructure
    inf_stmt = select(Infrastructure)
    if current_user.role not in [UserRole.FIELD_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN]:
        inf_stmt = inf_stmt.where(Infrastructure.is_public == True)

    inf_res = await db.execute(inf_stmt)
    all_inf = inf_res.scalars().all()

    nearby_facilities = []
    for inf in all_inf:
        d = haversine_distance_km(lat, lng, inf.latitude, inf.longitude)
        if d <= radius_km:
            nearby_facilities.append({
                "id": inf.id,
                "name": inf.name,
                "type": inf.type.value,
                "latitude": inf.latitude,
                "longitude": inf.longitude,
                "status": inf.status.value,
                "capacity": inf.capacity_metric,
                "contact": inf.contact_number,
                "distance_km": round(d, 2),
            })
    nearby_facilities.sort(key=lambda x: x["distance_km"])

    # 3. Nearby Bridges
    brg_stmt = select(Bridge)
    brg_res = await db.execute(brg_stmt)
    all_brg = brg_res.scalars().all()

    nearby_bridges = []
    for brg in all_brg:
        d = haversine_distance_km(lat, lng, brg.latitude, brg.longitude)
        if d <= radius_km:
            nearby_bridges.append({
                "id": brg.id,
                "name": brg.bridge_name,
                "status": brg.status.value,
                "latitude": brg.latitude,
                "longitude": brg.longitude,
                "capacity_tonnes": brg.capacity_tonnes,
                "water_level": brg.water_level_status,
                "distance_km": round(d, 2),
            })
    nearby_bridges.sort(key=lambda x: x["distance_km"])

    return {
        "search_center": {"latitude": lat, "longitude": lng},
        "radius_km": radius_km,
        "total_hazards": len(nearby_incidents),
        "total_facilities": len(nearby_facilities),
        "total_bridges": len(nearby_bridges),
        "incidents": nearby_incidents,
        "infrastructure": nearby_facilities,
        "bridges": nearby_bridges,
    }

# ==========================================
# 7. MAP SEARCH SERVICE
# ==========================================

@router.get("/search", response_model=List[MapSearchItem])
async def search_map_entities(
    q: str = Query(..., min_length=1, max_length=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Unified Search across Places, Highway Corridors, Districts, and Critical Facilities."""
    query_str = f"%{q.strip().lower()}%"
    results = []

    # 1. Search Districts
    d_stmt = select(District).where(
        or_(
            District.district_name.ilike(query_str),
            District.headquarters.ilike(query_str),
            District.state.ilike(query_str),
        )
    ).limit(5)
    d_res = await db.execute(d_stmt)
    for d in d_res.scalars().all():
        results.append(
            MapSearchItem(
                id=d.id,
                name=f"{d.district_name} District",
                type="DISTRICT",
                latitude=d.center_latitude,
                longitude=d.center_longitude,
                district=d.district_name,
                state=d.state,
                subtitle=f"District Headquarters: {d.headquarters}, {d.state}",
            )
        )

    # 2. Search Roads
    r_stmt = select(Road).where(
        or_(
            Road.road_name.ilike(query_str),
            Road.road_number.ilike(query_str),
        )
    ).limit(5)
    r_res = await db.execute(r_stmt)
    for r in r_res.scalars().all():
        coords = r.get_coordinates()
        center_pt = coords[len(coords) // 2] if coords else [91.75, 26.18]
        results.append(
            MapSearchItem(
                id=r.id,
                name=r.road_name,
                type="ROAD",
                latitude=center_pt[1],
                longitude=center_pt[0],
                district=r.district_name,
                state=r.state,
                subtitle=f"{r.road_number} • Status: {r.status.value}",
            )
        )

    # 3. Search Infrastructure
    inf_stmt = select(Infrastructure).where(
        or_(
            Infrastructure.name.ilike(query_str),
            Infrastructure.address.ilike(query_str),
        )
    ).limit(5)
    inf_res = await db.execute(inf_stmt)
    for inf in inf_res.scalars().all():
        results.append(
            MapSearchItem(
                id=inf.id,
                name=inf.name,
                type="INFRASTRUCTURE",
                latitude=inf.latitude,
                longitude=inf.longitude,
                district=inf.district_name,
                state=inf.state,
                subtitle=f"{inf.type.value.replace('_', ' ')} • {inf.capacity_metric or inf.status.value}",
            )
        )

    return results

# ==========================================
# 8. ROAD & DISTRICT MATCHING SERVICE
# ==========================================

@router.get("/road-match", response_model=RoadMatchResponse)
async def match_road_and_district(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Matches GPS coordinates to the nearest Highway corridor and containing administrative district."""
    # 1. Match Nearest Road
    r_stmt = select(Road)
    r_res = await db.execute(r_stmt)
    roads = r_res.scalars().all()
    best_road, dist_km, road_name = find_nearest_road_segment(lat, lng, roads)

    # 2. Match Containing District Polygon via Ray Casting
    d_stmt = select(District)
    d_res = await db.execute(d_stmt)
    districts = d_res.scalars().all()

    matched_district_name = None
    matched_state = None

    for d in districts:
        poly_rings = d.get_polygon()
        if poly_rings and len(poly_rings) > 0:
            if point_in_polygon(lat, lng, poly_rings[0]):
                matched_district_name = d.district_name
                matched_state = d.state
                break

    return RoadMatchResponse(
        latitude=lat,
        longitude=lng,
        matched_road_id=best_road.id if best_road else None,
        matched_road_name=road_name or "NER Highway Spine",
        road_type=best_road.road_type if best_road else "National Highway",
        road_status=best_road.status if best_road else RoadStatus.GREEN,
        distance_to_road_km=dist_km,
        district_name=matched_district_name or (best_road.district_name if best_road else "Kamrup Metropolitan"),
        state=matched_state or (best_road.state if best_road else "Assam"),
    )

# Legacy aliases for bridges & districts
@router.get("/bridges", response_model=List[BridgeResponse])
async def get_bridges(
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(Bridge)
    if state:
        stmt = stmt.where(Bridge.state == state)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/districts", response_model=List[DistrictResponse])
async def get_districts(
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(District)
    if state:
        stmt = stmt.where(District.state == state)
    res = await db.execute(stmt)
    districts = res.scalars().all()
    return [
        DistrictResponse(
            id=d.id,
            district_name=d.district_name,
            state=d.state,
            headquarters=d.headquarters,
            center_latitude=d.center_latitude,
            center_longitude=d.center_longitude,
            polygon=d.get_polygon(),
        )
        for d in districts
    ]
