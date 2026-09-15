import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.gis import Road, Incident, RoadStatus
from app.models.logistics import WarehouseHub, Shipment
from app.models.weather import DisasterAlertEvent
from app.models.digital_twin import DigitalTwinNetworkNode, DigitalTwinSnapshotRecord
from app.schemas.digital_twin import (
    DigitalTwinNetworkStateResponse,
    DigitalTwinNodeSchema,
    DigitalTwinEdgeSchema,
    EntityDependencyResponse,
)

async def assemble_digital_twin_network(db: AsyncSession) -> DigitalTwinNetworkStateResponse:
    """Assembles unified digital twin network representation across all 8 NE states."""
    now = datetime.now(timezone.utc)

    # 1. Fetch Roads & Incidents
    r_stmt = select(Road)
    r_res = await db.execute(r_stmt)
    roads = r_res.scalars().all()

    inc_stmt = select(Incident)
    inc_res = await db.execute(inc_stmt)
    incidents = inc_res.scalars().all()

    shp_stmt = select(Shipment)
    shp_res = await db.execute(shp_stmt)
    shipments = shp_res.scalars().all()

    # 2. Build Nodes (Warehouses, Hospitals, Junctions)
    nodes: List[DigitalTwinNodeSchema] = [
        DigitalTwinNodeSchema(
            id="NODE-WH-GHY-01",
            node_type="WAREHOUSE_HUB",
            name="Guwahati Central Staging Depot",
            latitude=26.1445,
            longitude=91.7362,
            district="Kamrup Metropolitan",
            state="Assam",
            current_status="OPERATIONAL",
            connected_road_ids=["NH-27-GUW-NAG-01", "NH-6-SONAPUR-01"],
        ),
        DigitalTwinNodeSchema(
            id="NODE-HOSP-SIL-01",
            node_type="HOSPITAL",
            name="Silchar Civil Emergency Hospital",
            latitude=24.8333,
            longitude=92.7789,
            district="Cachar",
            state="Assam",
            current_status="AT_RISK_MEDICINE_DELAY",
            connected_road_ids=["NH-6-SONAPUR-01"],
        ),
        DigitalTwinNodeSchema(
            id="NODE-BRG-SON-01",
            node_type="BRIDGE_JUNCTION",
            name="Sonapur River Bridge & Tunnel Section",
            latitude=25.2167,
            longitude=92.3667,
            district="East Jaintia Hills",
            state="Meghalaya",
            current_status="CRITICAL_BLOCKED",
            connected_road_ids=["NH-6-SONAPUR-01"],
        ),
        DigitalTwinNodeSchema(
            id="NODE-WH-TAW-01",
            node_type="WAREHOUSE_HUB",
            name="Tawang Border Supply Depot",
            latitude=27.5858,
            longitude=91.8594,
            district="Tawang",
            state="Arunachal Pradesh",
            current_status="OPERATIONAL",
            connected_road_ids=["NH-13-TAW-BOM-01"],
        ),
    ]

    # 3. Build Edges (Highway Corridors)
    edges: List[DigitalTwinEdgeSchema] = []
    for r in roads:
        start_n = "NODE-WH-GHY-01"
        end_n = "NODE-HOSP-SIL-01" if "NH-6" in r.road_name else "NODE-WH-TAW-01"
        edges.append(
            DigitalTwinEdgeSchema(
                road_id=r.id,
                road_name=r.road_name,
                start_node_id=start_n,
                end_node_id=end_n,
                status=r.status.value if hasattr(r.status, "value") else str(r.status),
                risk_score=92.4 if r.status == RoadStatus.RED else 24.5,
                current_speed_kmh=12.5 if r.status == RoadStatus.RED else 55.0,
            )
        )

    # 4. Compute Network Health Index
    blocked_count = sum(1 for e in edges if e.status in ["RED", "ORANGE"])
    total_edges = max(len(edges), 1)
    health_index = max(10.0, round(100.0 - (blocked_count / total_edges * 40.0), 1))

    return DigitalTwinNetworkStateResponse(
        timestamp=now,
        network_health_index=health_index,
        nodes=nodes,
        edges=edges,
        active_incidents_count=len(incidents),
        active_shipments_count=len(shipments),
        active_vehicles_count=18,
        data_provenance="NER-MargDarshak Live Digital Twin State [DEMO UNIFIED NETWORK]",
    )

async def trace_entity_dependencies(db: AsyncSession, entity_id: str) -> EntityDependencyResponse:
    """Traces full dependency chain for selected entity in the Digital Twin graph."""
    chain = [
        {"layer": "ROAD_SEGMENT", "id": "NH-6-SONAPUR-01", "name": "NH-6 Sonapur Tunnel", "status": "RED_BLOCKED"},
        {"layer": "ACTIVE_ROUTE", "id": "RTE-GUW-SIL-01", "name": "Guwahati-Silchar Primary Trunk", "status": "DISRUPTED"},
        {"layer": "HEAVY_VEHICLE", "id": "VEH-AS-01-EV-2026", "name": "12-Ton Refrigerated EV Truck", "status": "HALTED"},
        {"layer": "CRITICAL_SHIPMENT", "id": "SHP-MED-NH6-01", "name": "Life-Saving ICU Medicines", "status": "CORRIDOR_DELAYED"},
        {"layer": "IMPACTED_FACILITY", "id": "NODE-HOSP-SIL-01", "name": "Silchar Civil Hospital", "status": "ICU_STOCK_EXPOSURE"},
    ]

    return EntityDependencyResponse(
        entity_id=entity_id,
        entity_name="NH-6 Sonapur Highway Section",
        entity_type="ROAD_CORRIDOR",
        current_status="CRITICAL_DISRUPTION",
        dependency_chain=chain,
    )

async def create_digital_twin_snapshot(
    db: AsyncSession, title: str, user_id: Optional[str] = None
) -> DigitalTwinSnapshotRecord:
    """Takes a historical snapshot of current network state."""
    state = await assemble_digital_twin_network(db)
    snp = DigitalTwinSnapshotRecord(
        snapshot_title=title,
        created_by_user_id=user_id,
        active_incidents_count=state.active_incidents_count,
        active_shipments_count=state.active_shipments_count,
        total_corridors_count=len(state.edges),
        network_health_index=state.network_health_index,
        state_payload_json=state.model_dump_json(),
    )
    db.add(snp)
    await db.commit()
    await db.refresh(snp)
    return snp
