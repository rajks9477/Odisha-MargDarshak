from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.logistics import CargoPriorityEnum, ShipmentStatusEnum
from app.schemas.logistics import (
    ShipmentResponse,
    WarehouseHubResponse,
    CreateShipmentRequest,
    UpdateShipmentStatusRequest,
    LogisticsMetricsResponse,
)
from app.services.logistics.logistics_service import (
    list_shipments,
    get_shipment_by_id,
    create_new_shipment,
    update_shipment_status,
    get_warehouse_hubs,
    get_logistics_metrics,
)

router = APIRouter(prefix="/logistics", tags=["Logistics & Supply Chain Intelligence"])

@router.get("/shipments", response_model=List[ShipmentResponse])
async def get_shipments(
    priority: Optional[CargoPriorityEnum] = Query(default=None),
    status_filter: Optional[ShipmentStatusEnum] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieves emergency supply shipments.
    Drivers view assigned/available corridor dispatches; Admins & Officers view regional logistics pipeline.
    """
    driver_id = current_user.id if current_user.role == UserRole.DRIVER else None
    return await list_shipments(db, driver_id=driver_id, priority=priority, status_filter=status_filter)

@router.get("/shipments/{id}", response_model=ShipmentResponse)
async def get_shipment_detail(
    id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves specific shipment profile, progress %, and risk impact summary."""
    return await get_shipment_by_id(db, id)

@router.post("/shipments", response_model=ShipmentResponse)
async def create_shipment(
    payload: CreateShipmentRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Creates a new emergency supply shipment (Restricted to Government Officers & Admins)."""
    return await create_new_shipment(db, payload, current_user.id)

@router.post("/shipments/{id}/status", response_model=ShipmentResponse)
async def update_shipment_progress(
    id: str,
    payload: UpdateShipmentStatusRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Updates shipment status (IN_TRANSIT, CORRIDOR_DELAYED, REROUTED_SAFETY, DELIVERED) & progress %."""
    return await update_shipment_status(db, id, payload, current_user.id)

@router.get("/hubs", response_model=List[WarehouseHubResponse])
async def get_hubs(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists warehouse hubs and relief staging camps across North Eastern states."""
    return await get_warehouse_hubs(db)

@router.get("/metrics", response_model=LogisticsMetricsResponse)
async def get_metrics(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Computes high-level supply chain indicators (active relief dispatches, delayed corridors, total tonnage)."""
    return await get_logistics_metrics(db)
