from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.digital_twin import DigitalTwinSnapshotRecord
from app.schemas.digital_twin import (
    DigitalTwinNetworkStateResponse,
    EntityDependencyResponse,
    CreateSnapshotRequest,
    DigitalTwinSnapshotResponse,
)
from app.services.digital_twin.digital_twin_engine import (
    assemble_digital_twin_network,
    trace_entity_dependencies,
    create_digital_twin_snapshot,
)

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin Engine"])

@router.get("/state", response_model=DigitalTwinNetworkStateResponse)
async def get_digital_twin_state(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves live unified digital twin state of the NER transportation network."""
    return await assemble_digital_twin_network(db)

@router.get("/entity/{entity_id}", response_model=EntityDependencyResponse)
async def get_entity_dependencies(
    entity_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Traces full dependency chain (Road -> Route -> Vehicle -> Shipment -> Hospital Service) for selected entity."""
    return await trace_entity_dependencies(db, entity_id)

@router.post("/snapshot")
async def take_snapshot(
    payload: CreateSnapshotRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Creates isolated historical snapshot of current network state for audit and What-If engine branching."""
    snp = await create_digital_twin_snapshot(db, title=payload.snapshot_title or "Manual Command Center Snapshot", user_id=current_user.id)
    return {
        "status": "SNAPSHOT_CREATED",
        "snapshot_id": snp.id,
        "title": snp.snapshot_title,
        "health_index": snp.network_health_index,
        "created_at": snp.created_at,
    }

@router.get("/snapshots", response_model=List[DigitalTwinSnapshotResponse])
async def list_snapshots(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists saved historical digital twin network state snapshots."""
    stmt = select(DigitalTwinSnapshotRecord).order_by(DigitalTwinSnapshotRecord.created_at.desc())
    res = await db.execute(stmt)
    records = res.scalars().all()
    return records
