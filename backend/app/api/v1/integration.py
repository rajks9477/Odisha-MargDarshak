from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.integration import (
    IntegrationHubSummary,
    ExternalConnectorResponse,
    ConnectorSyncResponse,
    IngestionBatchResponse,
)
from app.services.integration.ingestion_engine import (
    get_integration_summary,
    list_external_connectors,
    trigger_connector_sync_service,
    list_ingestion_batches,
)

router = APIRouter(prefix="/integration", tags=["Data Ingestion & External Integration Hub"])

@router.get("/summary", response_model=IntegrationHubSummary)
async def get_summary(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves executive operational health and freshness metrics for all connectors."""
    return await get_integration_summary(db)

@router.get("/connectors", response_model=List[ExternalConnectorResponse])
async def get_connectors(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists registered external data connectors and adapters."""
    return await list_external_connectors(db)

@router.post("/connectors/{connector_id}/sync", response_model=ConnectorSyncResponse)
async def sync_connector(
    connector_id: str,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Triggers on-demand validation, normalization, and promotion for a connector."""
    return await trigger_connector_sync_service(db, connector_id=connector_id)

@router.get("/batches", response_model=List[IngestionBatchResponse])
async def get_batches(
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves batch history of ingestion executions."""
    return await list_ingestion_batches(db)
