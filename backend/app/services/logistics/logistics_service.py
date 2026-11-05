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
        "id": "WH-BBSR-01",
        "name": "Bhubaneswar Central Multi-Modal Logistics Hub",
        "district": "Khordha",
        "state": "Odisha",
        "lat": 20.296,
        "lon": 85.824,
        "capacity": 2500.0,
        "type": "CENTRAL_DEPOT",
    },
    {
        "id": "WH-PARADIP-01",
        "name": "Paradip Deepwater Port Logistics & Mineral Warehouse",
        "district": "Jagatsinghpur",
        "state": "Odisha",
        "lat": 20.316,
        "lon": 86.611,
        "capacity": 5000.0,
        "type": "CENTRAL_DEPOT",
    },
    {
        "id": "WH-CUTTACK-01",
        "name": "Cuttack Malgodown Essential Grain & Medical Depot",
        "district": "Cuttack",
        "state": "Odisha",
        "lat": 20.457,
        "lon": 85.892,
        "capacity": 1800.0,
        "type": "DISTRICT_WAREHOUSE",
    },
    {
        "id": "WH-JHARSUGUDA-01",
        "name": "Jharsuguda Multi-Modal Logistics Park (MMLP)",
        "district": "Jharsuguda",
        "state": "Odisha",
        "lat": 21.855,
        "lon": 84.006,
        "capacity": 2200.0,
        "type": "DISTRICT_WAREHOUSE",
    },
    {
        "id": "WH-KORAPUT-01",
        "name": "Koraput Eastern Ghats Essential Supplies Camp",
        "district": "Koraput",
        "state": "Odisha",
        "lat": 18.813,
        "lon": 82.712,
        "capacity": 900.0,
        "type": "FIELD_STAGING_CAMP",
    },
]

SEED_SHIPMENTS = [
    {
        "id": "SHP-MED-ODI-01",
        "title": "Life-Saving ICU Medicines & Pediatric Vaccines",
        "category": CargoCategoryEnum.MEDICINES_MEDICAL,
        "description": "Critical cold-chain consignment from AIIMS Bhubaneswar to Saheed Laxman Nayak Medical College, Koraput.",
        "priority": CargoPriorityEnum.CRITICAL,
        "weight_kg": 3500.0,
        "origin": "Bhubaneswar Central Medical Supply Hub",
        "destination": "Koraput SLN Medical College & Hospital",
        "status": ShipmentStatusEnum.IN_TRANSIT,
        "progress": 62.0,
        "risk_summary": "Priority medical dispatch. Southern ghat route monitored via Sunabeda pass. Speed regulated.",
    },
    {
        "title": "Baitarani Flood Relief Food Rations & Water Filters",
        "category": CargoCategoryEnum.EMERGENCY_FOOD_RATIONS,
        "description": "Emergency food packets and chlorine purification tablets for inundated villages in Bhadrak district.",
        "priority": CargoPriorityEnum.CRITICAL,
        "weight_kg": 8500.0,
        "origin": "Cuttack Malgodown Grain Terminal",
        "destination": "Bhadrak Relief Distribution Center",
        "status": ShipmentStatusEnum.IN_TRANSIT,
        "progress": 80.0,
        "risk_summary": "Caution on NH-16 Akhuapada section; flood backwaters overflowing approach carriageway.",
    },
    {
        "title": "Works Department Hydraulic Excavator Spares",
        "category": CargoCategoryEnum.DISASTER_RECOVERY_EQUIPMENT,
        "description": "Heavy machinery parts for clearing Kanjipani Ghat rockfall debris on NH-20.",
        "priority": CargoPriorityEnum.IMPORTANT,
        "weight_kg": 4200.0,
        "origin": "Bhubaneswar Works Dept Depot",
        "destination": "Kanjipani Ghat Emergency Clearing Base, Keonjhar",
        "status": ShipmentStatusEnum.CORRIDOR_DELAYED,
        "progress": 35.0,
        "risk_summary": "Delayed due to mineral truck backlog on Panikoili-Keonjhar highway.",
    },
    {
        "title": "Liquid Medical Oxygen Tanker from Paradip Refinery",
        "category": CargoCategoryEnum.PETROLEUM_FUEL,
        "description": "Strategic cryogenic liquid oxygen supply for Western Odisha hospitals in Burla & Sambalpur.",
        "priority": CargoPriorityEnum.IMPORTANT,
        "weight_kg": 16000.0,
        "origin": "Paradip Port Cryogenic Terminal",
        "destination": "VIMSAR Burla Hospital Oxygen Plant",
        "status": ShipmentStatusEnum.IN_TRANSIT,
        "progress": 55.0,
        "risk_summary": "Green corridor activated via NH-53 & NH-55 4-lane stretch.",
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
        data_source="Odisha MargDarshak Supply Chain Intelligence Engine",
    )
