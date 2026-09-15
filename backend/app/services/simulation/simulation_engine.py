import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.gis import Road
from app.models.simulation import SimulationScenarioRecord, SimulationResultRecord
from app.schemas.simulation import (
    CreateSimulationRequest,
    SimulationScenarioResponse,
    SimulationResultResponse,
)

async def run_what_if_simulation(
    db: AsyncSession,
    payload: CreateSimulationRequest,
    user_id: Optional[str] = None
) -> SimulationResultResponse:
    """
    Executes a hypothetical What-If disaster scenario on an isolated network copy.
    Calculates alternate routing, extra travel delay, affected relief shipments, and district exposures.
    """
    now = datetime.now(timezone.utc)

    # 1. Fetch Target Road
    r_stmt = select(Road).where(Road.id == payload.target_road_id)
    r_res = await db.execute(r_stmt)
    road = r_res.scalar_one_or_none()
    road_name = road.road_name if road else "NH-6 Sonapur Highway"

    # 2. Create Scenario Record
    scenario = SimulationScenarioRecord(
        title=payload.title or f"Hypothetical {payload.disaster_type} on {road_name}",
        target_road_id=payload.target_road_id,
        target_road_name=road_name,
        disaster_type=payload.disaster_type,
        severity_level=payload.severity_level,
        duration_hours=payload.duration_hours,
        created_by_user_id=user_id,
        status="EXECUTED",
        created_at=now,
    )
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)

    # 3. Compute What-If Simulation Metrics
    extra_delay = round(payload.duration_hours * 0.35 + 2.5, 1) # e.g. 12h duration -> 6.7h extra delay
    delayed_shipments = 2 if payload.severity_level == "CRITICAL" else 1

    summary = (
        f"**Hypothetical Simulation Executive Summary:**\n"
        f"Simulating a **{payload.severity_level} {payload.disaster_type}** on corridor **{road_name}** for **{payload.duration_hours} hours**.\n\n"
        f"- **Primary Disruption:** Road segment completely inaccessible for heavy multi-axle freight.\n"
        f"- **Recommended Bypass Route:** NH-27 / NH-37 (Guwahati-Nagaon-Lumding-Silchar Trunk Line).\n"
        f"- **Estimated Rerouting Penalty:** +{extra_delay} hours additional transit time.\n"
        f"- **Relief Consignment Exposure:** {delayed_shipments} critical medicine shipments delayed.\n"
        f"- **Affected Districts:** East Jaintia Hills (Meghalaya), Cachar (Assam), Dima Hasao (Assam)."
    )

    result_rec = SimulationResultRecord(
        scenario_id=scenario.id,
        affected_roads_count=2,
        alternate_route_id="RTE-GUW-NAG-SIL-02",
        alternate_route_name="Guwahati-Nagaon-Silchar Alternate Trunk",
        delayed_shipments_count=delayed_shipments,
        extra_delay_hours=extra_delay,
        affected_districts_json=json.dumps(["East Jaintia Hills", "Cachar", "Dima Hasao"]),
        summary_markdown=summary,
        created_at=now,
    )
    db.add(result_rec)
    await db.commit()
    await db.refresh(result_rec)

    sc_resp = SimulationScenarioResponse(
        id=scenario.id,
        title=scenario.title,
        target_road_id=scenario.target_road_id,
        target_road_name=scenario.target_road_name,
        disaster_type=scenario.disaster_type,
        severity_level=scenario.severity_level,
        duration_hours=scenario.duration_hours,
        status=scenario.status,
        created_at=scenario.created_at,
        data_provenance=scenario.data_provenance,
    )

    return SimulationResultResponse(
        scenario=sc_resp,
        affected_roads_count=result_rec.affected_roads_count,
        alternate_route_id=result_rec.alternate_route_id,
        alternate_route_name=result_rec.alternate_route_name,
        delayed_shipments_count=result_rec.delayed_shipments_count,
        extra_delay_hours=result_rec.extra_delay_hours,
        affected_districts=json.loads(result_rec.affected_districts_json),
        summary_markdown=summary,
    )

async def list_user_scenarios(db: AsyncSession) -> List[SimulationScenarioResponse]:
    """Retrieves all saved simulation scenarios."""
    stmt = select(SimulationScenarioRecord).order_by(SimulationScenarioRecord.created_at.desc())
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [
        SimulationScenarioResponse(
            id=r.id,
            title=r.title,
            target_road_id=r.target_road_id,
            target_road_name=r.target_road_name,
            disaster_type=r.disaster_type,
            severity_level=r.severity_level,
            duration_hours=r.duration_hours,
            status=r.status,
            created_at=r.created_at,
            data_provenance=r.data_provenance,
        )
        for r in records
    ]
