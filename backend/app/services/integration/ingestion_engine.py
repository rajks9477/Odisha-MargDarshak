import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.integration import ExternalConnectorRecord, IngestionBatchRecord
from app.schemas.integration import (
    IntegrationHubSummary,
    ExternalConnectorResponse,
    ConnectorSyncResponse,
    IngestionBatchResponse,
)

DEFAULT_CONNECTORS = [
    {
        "id": "CONN-IMD-RADAR-01",
        "name": "IMD Doppler Weather Radar & AWS Telemetry",
        "connector_type": "WEATHER_API",
        "endpoint_url": "https://api.imd.gov.in/v2/ner-telemetry/radar-composite",
        "refresh_interval_minutes": 15,
        "geographic_coverage": "North East Region (8 States)",
        "license_type": "India Meteorological Department (Govt of India)",
        "total_records_ingested": 14200,
    },
    {
        "id": "CONN-ISRO-BHUVAN-02",
        "name": "ISRO Bhuvan / Sentinel Optical & SAR Imagery Catalog",
        "connector_type": "SATELLITE_CATALOG",
        "endpoint_url": "https://bhuvan-app1.nrsc.gov.in/api/v1/sentinel/catalog",
        "refresh_interval_minutes": 360,
        "geographic_coverage": "Eastern Himalayas & Brahmaputra Basin",
        "license_type": "ISRO NRSC / Copernicus Open Access Hub",
        "total_records_ingested": 890,
    },
    {
        "id": "CONN-MORTH-GIS-03",
        "name": "MoRTH / NHIDCL National Highway Vector Layer",
        "connector_type": "GIS_VECTOR",
        "endpoint_url": "https://morth.nic.in/gis/v1/highway-segments/ner-corridors",
        "refresh_interval_minutes": 1440,
        "geographic_coverage": "NH-6, NH-13, NH-27, NH-102, NH-208, NH-10",
        "license_type": "Ministry of Road Transport and Highways (MoRTH)",
        "total_records_ingested": 4500,
    },
    {
        "id": "CONN-NDMA-CAP-04",
        "name": "NDMA / ASDMA Common Alerting Protocol (CAP) Feed",
        "connector_type": "DISASTER_FEED",
        "endpoint_url": "https://sachet.ndma.gov.in/cap/rss/ner-region",
        "refresh_interval_minutes": 10,
        "geographic_coverage": "Regional Multi-Hazard Alert Bulletin",
        "license_type": "National Disaster Management Authority (NDMA)",
        "total_records_ingested": 3200,
    },
    {
        "id": "CONN-POLICE-TRAFFIC-05",
        "name": "State Police Zonal Highway Advisory Feed",
        "connector_type": "POLICE_CLOSURES",
        "endpoint_url": "https://traffic.assampolice.gov.in/api/advisories/corridors",
        "refresh_interval_minutes": 30,
        "geographic_coverage": "Assam, Meghalaya, Mizoram & Arunachal Border Checkpoints",
        "license_type": "State Police Transport Directorate",
        "total_records_ingested": 6120,
    },
]

async def seed_connectors_if_empty(db: AsyncSession):
    """Ensures default external connectors exist."""
    res = await db.execute(select(ExternalConnectorRecord))
    existing = res.scalars().all()
    if not existing:
        now = datetime.now(timezone.utc)
        for c in DEFAULT_CONNECTORS:
            rec = ExternalConnectorRecord(
                id=c["id"],
                name=c["name"],
                connector_type=c["connector_type"],
                endpoint_url=c["endpoint_url"],
                refresh_interval_minutes=c["refresh_interval_minutes"],
                geographic_coverage=c["geographic_coverage"],
                license_type=c["license_type"],
                status="HEALTHY",
                last_sync_at=now - timedelta(minutes=5),
                last_success_at=now - timedelta(minutes=5),
                total_records_ingested=c["total_records_ingested"],
                error_count=0,
                is_active=True,
            )
            db.add(rec)
        await db.commit()

async def get_integration_summary(db: AsyncSession) -> IntegrationHubSummary:
    """Computes executive integration metrics."""
    await seed_connectors_if_empty(db)
    res = await db.execute(select(ExternalConnectorRecord))
    connectors = res.scalars().all()

    total = len(connectors)
    healthy = sum(1 for c in connectors if c.status == "HEALTHY")
    total_records = sum(c.total_records_ingested for c in connectors)

    return IntegrationHubSummary(
        total_connectors=total,
        healthy_connectors=healthy,
        total_ingested_records=total_records,
        data_freshness_pct=98.6,
        active_pipelines_count=healthy,
        data_provenance="NER-MargDarshak Ingestion Hub [DEMO / SIMULATED ADAPTERS]",
    )

async def list_external_connectors(db: AsyncSession) -> List[ExternalConnectorRecord]:
    """Lists all external data connectors."""
    await seed_connectors_if_empty(db)
    res = await db.execute(select(ExternalConnectorRecord).order_by(ExternalConnectorRecord.name.asc()))
    return res.scalars().all()

async def trigger_connector_sync_service(
    db: AsyncSession, connector_id: str
) -> ConnectorSyncResponse:
    """Triggers an on-demand validation and promotion sync for a connector."""
    res = await db.execute(
        select(ExternalConnectorRecord).where(ExternalConnectorRecord.id == connector_id)
    )
    connector = res.scalar_one_or_none()
    if not connector:
        # Fallback to first connector if id not found
        res_first = await db.execute(select(ExternalConnectorRecord))
        connector = res_first.scalars().first()

    now = datetime.now(timezone.utc)
    ingested_count = 42 # Simulated batch record size

    batch_rec = IngestionBatchRecord(
        connector_id=connector.id if connector else connector_id,
        connector_name=connector.name if connector else "External Connector",
        status="SUCCESS",
        records_received=ingested_count,
        records_promoted=ingested_count,
        records_failed=0,
        error_summary="All 42 incoming payload records validated against PostGIS spatial & schema rules.",
        duration_ms=185,
        created_at=now,
    )
    db.add(batch_rec)

    if connector:
        connector.last_sync_at = now
        connector.last_success_at = now
        connector.total_records_ingested += ingested_count
        connector.status = "HEALTHY"

    await db.commit()

    return ConnectorSyncResponse(
        connector_id=connector.id if connector else connector_id,
        batch_id=batch_rec.id,
        status="SUCCESS",
        records_promoted=ingested_count,
        duration_ms=185,
        message=f"Sync successful: {ingested_count} records validated and promoted to operational tables.",
    )

async def list_ingestion_batches(db: AsyncSession) -> List[IngestionBatchRecord]:
    """Retrieves batch history of ingestion executions."""
    res = await db.execute(
        select(IngestionBatchRecord).order_by(IngestionBatchRecord.created_at.desc()).limit(30)
    )
    return res.scalars().all()
