import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.logistics import (
    WarehouseHub,
    Shipment,
    ShipmentAuditLog,
    CargoPriorityEnum,
    CargoCategoryEnum,
    ShipmentStatusEnum,
)
from app.schemas.logistics import (
    ShipmentResponse,
    WarehouseHubResponse,
    CreateShipmentRequest,
    UpdateShipmentStatusRequest,
    LogisticsMetricsResponse,
)

SEED_WAREHOUSES = [
    {
        "id": "WH-GUWAHATI-01",
        "name": "Guwahati Central Relief & Medical Logistics Hub",
        "district": "Kamrup Metropolitan",
        "state": "Assam",
        "lat": 26.18,
        "lon": 91.73,
        "capacity": 1200.0,
        "type": "CENTRAL_DEPOT",
    },
    {
        "id": "WH-SILCHAR-01",
        "name": "Silchar Food & Medical Depot (Barak Valley)",
        "district": "Cachar",
        "state": "Assam",
        "lat": 24.83,
        "lon": 92.79,
        "capacity": 800.0,
        "type": "DISTRICT_WAREHOUSE",
    },
    {
        "id": "WH-SHILLONG-01",
        "name": "Shillong Civil Medical Staging Depot",
        "district": "East Khasi Hills",
        "state": "Meghalaya",
        "lat": 25.57,
        "lon": 91.88,
        "capacity": 600.0,
        "type": "DISTRICT_WAREHOUSE",
    },
    {
        "id": "WH-AIZAWL-01",
        "name": "Aizawl Emergency Supplies Hub",
        "district": "Aizawl",
        "state": "Mizoram",
        "lat": 23.73,
        "lon": 92.71,
        "capacity": 450.0,
        "type": "DISTRICT_WAREHOUSE",
    },
    {
        "id": "WH-TAWANG-01",
        "name": "Tawang High-Altitude Supply Staging Camp",
        "district": "Tawang",
        "state": "Arunachal Pradesh",
        "lat": 27.58,
        "lon": 91.86,
        "capacity": 300.0,
        "type": "FIELD_STAGING_CAMP",
    },
]

SEED_SHIPMENTS = [
    {
        "id": "SHP-MED-NH6-01",
        "title": "Life-Saving ICU Medicines & Oxygen Concentrators",
        "category": CargoCategoryEnum.MEDICINES_MEDICAL,
        "description": "Essential medical consignment for Silchar Medical College & Disaster Relief Camps in Barak Valley.",
        "priority": CargoPriorityEnum.CRITICAL,
        "weight_kg": 3500.0,
        "origin": "Guwahati Central Medical Hub",
        "destination": "Silchar Civil Hospital",
        "status": ShipmentStatusEnum.IN_TRANSIT,
        "progress": 62.0,
        "risk_summary": "High priority dispatch. Sonapur NH-6 mudflow advisory active. Diverting via Umrangso-Haflong corridor if required.",
    },
    {
        "title": "Emergency Food Rations & Water Purification Units",
        "category": CargoCategoryEnum.EMERGENCY_FOOD_RATIONS,
        "description": "Disaster relief rations for flash-flood affected villages in East Jaintia Hills.",
        "priority": CargoPriorityEnum.CRITICAL,
        "weight_kg": 8500.0,
        "origin": "Shillong Staging Depot",
        "destination": "Jowai Relief Distribution Center",
        "status": ShipmentStatusEnum.IN_TRANSIT,
        "progress": 80.0,
        "risk_summary": "Single lane operational near Jowai hill section.",
    },
    {
        "title": "PWD Earthmover & Road Clearing Equipment Parts",
        "category": CargoCategoryEnum.DISASTER_RECOVERY_EQUIPMENT,
        "description": "Heavy machinery spares for clearing Sonapur Tunnel landslide debris.",
        "priority": CargoPriorityEnum.IMPORTANT,
        "weight_kg": 4200.0,
        "origin": "Guwahati PWD Depot",
        "destination": "Sonapur Highway Clearing Base Camp",
        "status": ShipmentStatusEnum.CORRIDOR_DELAYED,
        "progress": 35.0,
        "risk_summary": "Delayed due to traffic bottleneck near Sonapur tunnel approach.",
    },
    {
        "title": "Aizawl Essential Petroleum Fuel Supply Tanker",
        "category": CargoCategoryEnum.PETROLEUM_FUEL,
        "description": "High-octane fuel consignment for emergency power generators & medical ambulances in Mizoram.",
        "priority": CargoPriorityEnum.IMPORTANT,
        "weight_kg": 12000.0,
        "origin": "Silchar Fuel Depot",
        "destination": "Aizawl Municipal Depot",
        "status": ShipmentStatusEnum.IN_TRANSIT,
        "progress": 48.0,
        "risk_summary": "Vairengte slope instability monitored along NH-306.",
    },
]

async def seed_logistics_if_empty(db: AsyncSession):
    """Ensures warehouse hubs and grounded emergency relief shipments exist in DB."""
    h_stmt = select(WarehouseHub)
    h_res = await db.execute(h_stmt)
    if not h_res.scalars().first():
        for w in SEED_WAREHOUSES:
            hub = WarehouseHub(
                id=w["id"],
                name=w["name"],
                district=w["district"],
                state=w["state"],
                latitude=w["lat"],
                longitude=w["lon"],
                capacity_tonnes=w["capacity"],
                current_occupancy_tonnes=w["capacity"] * 0.3,
                contact_officer="NODAL_LOGISTICS_OFFICER",
                hub_type=w["type"],
            )
            db.add(hub)
        await db.commit()

    s_stmt = select(Shipment)
    s_res = await db.execute(s_stmt)
    if not s_res.scalars().first():
        for idx, s in enumerate(SEED_SHIPMENTS):
            now = datetime.now(timezone.utc)
            shp = Shipment(
                id=s.get("id", f"SHP-RELIEF-0{idx+1}"),
                title=s["title"],
                cargo_category=s["category"],
                cargo_description=s["description"],
                priority=s["priority"],
                weight_kg=s["weight_kg"],
                origin_name=s["origin"],
                destination_name=s["destination"],
                status=s["status"],
                progress_pct=s["progress"],
                created_at=now - timedelta(hours=6),
                dispatched_at=now - timedelta(hours=4),
                estimated_arrival=now + timedelta(hours=5),
                risk_impact_summary=s["risk_summary"],
            )
            db.add(shp)
        await db.commit()

async def list_shipments(
    db: AsyncSession,
    driver_id: Optional[str] = None,
    priority: Optional[CargoPriorityEnum] = None,
    status_filter: Optional[ShipmentStatusEnum] = None,
) -> List[ShipmentResponse]:
    """Lists shipments filtered by driver assignment, priority, or status."""
    await seed_logistics_if_empty(db)

    stmt = select(Shipment)
    if driver_id:
        stmt = stmt.where((Shipment.assigned_driver_id == driver_id) | (Shipment.assigned_driver_id.is_(None)))
    if priority:
        stmt = stmt.where(Shipment.priority == priority)
    if status_filter:
        stmt = stmt.where(Shipment.status == status_filter)

    stmt = stmt.order_by(Shipment.created_at.desc())
    res = await db.execute(stmt)
    shipments = res.scalars().all()

    return [ShipmentResponse.model_validate(s) for s in shipments]

async def get_shipment_by_id(db: AsyncSession, shipment_id: str) -> ShipmentResponse:
    """Retrieves specific shipment profile by ID."""
    stmt = select(Shipment).where(Shipment.id == shipment_id)
    res = await db.execute(stmt)
    shp = res.scalar_one_or_none()
    if not shp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment profile not found")
    return ShipmentResponse.model_validate(shp)

async def create_new_shipment(db: AsyncSession, req: CreateShipmentRequest, user_id: str) -> ShipmentResponse:
    """Creates a new emergency supply shipment and logs audit record."""
    now = datetime.now(timezone.utc)
    shp = Shipment(
        title=req.title,
        cargo_category=req.cargo_category,
        cargo_description=req.cargo_description,
        priority=req.priority,
        weight_kg=req.weight_kg,
        origin_name=req.origin_name,
        destination_name=req.destination_name,
        assigned_driver_id=req.assigned_driver_id,
        assigned_vehicle_id=req.assigned_vehicle_id,
        status=ShipmentStatusEnum.DISPATCH_PENDING,
        progress_pct=0.0,
        created_at=now,
        estimated_arrival=now + timedelta(hours=8),
        risk_impact_summary="Newly registered emergency consignment. Route risk evaluation pending.",
    )
    db.add(shp)
    await db.flush()

    audit = ShipmentAuditLog(
        shipment_id=shp.id,
        action_type="CREATED",
        new_status=ShipmentStatusEnum.DISPATCH_PENDING.value,
        performed_by_id=user_id,
        timestamp=now,
        notes=f"Emergency shipment registered: {req.title}",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(shp)

    return ShipmentResponse.model_validate(shp)

async def update_shipment_status(
    db: AsyncSession, shipment_id: str, req: UpdateShipmentStatusRequest, user_id: str
) -> ShipmentResponse:
    """Updates shipment status, progress %, and logs audit history."""
    stmt = select(Shipment).where(Shipment.id == shipment_id)
    res = await db.execute(stmt)
    shp = res.scalar_one_or_none()
    if not shp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment profile not found")

    old_status = shp.status.value
    shp.status = req.status
    if req.progress_pct is not None:
        shp.progress_pct = req.progress_pct

    if req.status == ShipmentStatusEnum.DELIVERED:
        shp.delivered_at = datetime.now(timezone.utc)
        shp.progress_pct = 100.0

    audit = ShipmentAuditLog(
        shipment_id=shp.id,
        action_type="STATUS_UPDATED",
        previous_status=old_status,
        new_status=req.status.value,
        performed_by_id=user_id,
        timestamp=datetime.now(timezone.utc),
        notes=req.notes or f"Status updated to {req.status.value}",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(shp)

    return ShipmentResponse.model_validate(shp)

async def get_warehouse_hubs(db: AsyncSession) -> List[WarehouseHubResponse]:
    """Retrieves all registered warehouse & relief staging hubs."""
    await seed_logistics_if_empty(db)
    stmt = select(WarehouseHub)
    res = await db.execute(stmt)
    hubs = res.scalars().all()
    return [WarehouseHubResponse.model_validate(h) for h in hubs]

async def get_logistics_metrics(db: AsyncSession) -> LogisticsMetricsResponse:
    """Computes high-level supply chain indicators across North Eastern corridors."""
    await seed_logistics_if_empty(db)
    stmt = select(Shipment)
    res = await db.execute(stmt)
    shipments = res.scalars().all()

    active = [s for s in shipments if s.status != ShipmentStatusEnum.DELIVERED]
    critical = [s for s in active if s.priority == CargoPriorityEnum.CRITICAL]
    delayed = [s for s in active if s.status == ShipmentStatusEnum.CORRIDOR_DELAYED]
    total_tonnes = sum(s.weight_kg for s in active) / 1000.0
    delivered_today = len([s for s in shipments if s.status == ShipmentStatusEnum.DELIVERED])

    return LogisticsMetricsResponse(
        active_shipments_count=len(active),
        critical_relief_shipments_count=len(critical),
        delayed_corridors_count=len(delayed),
        total_in_transit_tonnes=round(total_tonnes, 1),
        delivered_today_count=delivered_today,
        data_source="NER-MargDarshak Supply Chain Intelligence Engine",
    )
