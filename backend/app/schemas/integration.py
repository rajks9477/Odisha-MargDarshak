from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class IntegrationHubSummary(BaseModel):
    total_connectors: int
    healthy_connectors: int
    total_ingested_records: int
    data_freshness_pct: float
    active_pipelines_count: int
    data_provenance: str

class ExternalConnectorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    connector_type: str
    endpoint_url: str
    auth_type: str
    refresh_interval_minutes: int
    geographic_coverage: str
    license_type: str
    status: str
    last_sync_at: Optional[datetime]
    last_success_at: Optional[datetime]
    total_records_ingested: int
    error_count: int
    is_active: bool
    data_provenance: str

class ConnectorSyncResponse(BaseModel):
    connector_id: str
    batch_id: str
    status: str
    records_promoted: int
    duration_ms: int
    message: str

class IngestionBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    connector_id: str
    connector_name: str
    status: str
    records_received: int
    records_promoted: int
    records_failed: int
    error_summary: Optional[str]
    duration_ms: int
    created_at: datetime
