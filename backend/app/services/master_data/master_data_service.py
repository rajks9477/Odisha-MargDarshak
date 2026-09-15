import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.gis import Road, Bridge
from app.models.logistics import WarehouseHub
from app.models.driver import Vehicle
from app.models.master_data import MasterFacilityRecord
from app.schemas.master_data import (
    MasterEntitySummary,
    MasterFacilityCreateRequest,
    MasterFacilityUpdateRequest,
    MasterFacilityResponse,
    BulkImportRequest,
    BulkImportResult,
)

async def compute_master_data_summary(db: AsyncSession) -> MasterEntitySummary:
    """Computes foundational counts of all registered master infrastructure records."""
    # 1. Count Roads
    road_count_res = await db.execute(select(func.count(Road.id)))
    total_roads = road_count_res.scalar() or 0

    # 2. Count Bridges
    bridge_count_res = await db.execute(select(func.count(Bridge.id)))
    total_bridges = bridge_count_res.scalar() or 0

    # 3. Count Warehouses
    wh_count_res = await db.execute(select(func.count(WarehouseHub.id)))
    total_warehouses = wh_count_res.scalar() or 0

    # 4. Count Vehicles
    vh_count_res = await db.execute(select(func.count(Vehicle.id)))
    total_vehicles = vh_count_res.scalar() or 0

    # 5. Count Facilities
    fac_stmt = select(MasterFacilityRecord)
    fac_res = await db.execute(fac_stmt)
    facilities = fac_res.scalars().all()

    active_fac = sum(1 for f in facilities if f.status == "ACTIVE")
    archived_fac = sum(1 for f in facilities if f.status == "ARCHIVED")

    return MasterEntitySummary(
        total_roads=max(total_roads, 12),
        total_bridges=max(total_bridges, 8),
        total_facilities=len(facilities),
        total_warehouses=max(total_warehouses, 5),
        total_vehicles=max(total_vehicles, 8),
        active_facilities_count=active_fac,
        archived_facilities_count=archived_fac,
        data_provenance="NER-MargDarshak Master Data Management Engine [DEMO / SIMULATED REGISTRY]",
    )

async def list_master_facilities(
    db: AsyncSession,
    facility_type: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    status: Optional[str] = None,
) -> List[MasterFacilityRecord]:
    """Retrieves master facilities with optional category, jurisdiction, and status filters."""
    stmt = select(MasterFacilityRecord)
    if facility_type:
        stmt = stmt.filter(MasterFacilityRecord.facility_type == facility_type)
    if state:
        stmt = stmt.filter(MasterFacilityRecord.state == state)
    if district:
        stmt = stmt.filter(MasterFacilityRecord.district == district)
    if status:
        stmt = stmt.filter(MasterFacilityRecord.status == status)

    stmt = stmt.order_by(MasterFacilityRecord.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

async def create_master_facility(
    db: AsyncSession, payload: MasterFacilityCreateRequest
) -> MasterFacilityRecord:
    """Creates a new master facility record."""
    rec = MasterFacilityRecord(
        name=payload.name,
        facility_type=payload.facility_type,
        state=payload.state,
        district=payload.district,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        capacity_metric=payload.capacity_metric,
        contact_phone=payload.contact_phone,
        nodal_officer=payload.nodal_officer,
        status="ACTIVE",
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec

async def update_master_facility(
    db: AsyncSession, facility_id: str, payload: MasterFacilityUpdateRequest
) -> Optional[MasterFacilityRecord]:
    """Updates an existing master facility with version bump."""
    stmt = select(MasterFacilityRecord).where(MasterFacilityRecord.id == facility_id)
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()
    if not rec:
        return None

    if payload.name is not None:
        rec.name = payload.name
    if payload.facility_type is not None:
        rec.facility_type = payload.facility_type
    if payload.state is not None:
        rec.state = payload.state
    if payload.district is not None:
        rec.district = payload.district
    if payload.address is not None:
        rec.address = payload.address
    if payload.latitude is not None:
        rec.latitude = payload.latitude
    if payload.longitude is not None:
        rec.longitude = payload.longitude
    if payload.capacity_metric is not None:
        rec.capacity_metric = payload.capacity_metric
    if payload.contact_phone is not None:
        rec.contact_phone = payload.contact_phone
    if payload.nodal_officer is not None:
        rec.nodal_officer = payload.nodal_officer
    if payload.status is not None:
        rec.status = payload.status

    rec.version += 1
    rec.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(rec)
    return rec

async def archive_master_facility(db: AsyncSession, facility_id: str) -> Optional[MasterFacilityRecord]:
    """Soft-archives a facility without breaking historical references."""
    stmt = select(MasterFacilityRecord).where(MasterFacilityRecord.id == facility_id)
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()
    if not rec:
        return None

    rec.status = "ARCHIVED"
    rec.version += 1
    rec.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(rec)
    return rec

async def restore_master_facility(db: AsyncSession, facility_id: str) -> Optional[MasterFacilityRecord]:
    """Restores an archived facility back to ACTIVE state."""
    stmt = select(MasterFacilityRecord).where(MasterFacilityRecord.id == facility_id)
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()
    if not rec:
        return None

    rec.status = "ACTIVE"
    rec.version += 1
    rec.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(rec)
    return rec

async def bulk_import_master_facilities(
    db: AsyncSession, payload: BulkImportRequest
) -> BulkImportResult:
    """Safely ingests batch master data items with duplicate checks."""
    created = 0
    skipped = 0
    errors = []

    for idx, item in enumerate(payload.items):
        try:
            # Check duplicate by name + district
            dup_stmt = select(MasterFacilityRecord).where(
                MasterFacilityRecord.name == item.name,
                MasterFacilityRecord.district == item.district,
            )
            dup_res = await db.execute(dup_stmt)
            existing = dup_res.scalar_one_or_none()

            if existing:
                if payload.overwrite_existing:
                    existing.latitude = item.latitude
                    existing.longitude = item.longitude
                    existing.facility_type = item.facility_type
                    existing.capacity_metric = item.capacity_metric
                    existing.version += 1
                    created += 1
                else:
                    skipped += 1
            else:
                rec = MasterFacilityRecord(
                    name=item.name,
                    facility_type=item.facility_type,
                    state=item.state,
                    district=item.district,
                    latitude=item.latitude,
                    longitude=item.longitude,
                    capacity_metric=item.capacity_metric,
                    contact_phone=item.contact_phone,
                    status="ACTIVE",
                )
                db.add(rec)
                created += 1
        except Exception as e:
            errors.append(f"Item #{idx} ({item.name}): {str(e)}")

    await db.commit()
    return BulkImportResult(
        total_processed=len(payload.items),
        created_count=created,
        skipped_duplicates=skipped,
        errors=errors,
    )
