from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.weather import DisasterAlertEvent
from app.schemas.weather import (
    WeatherObservationResponse,
    DisasterAlertResponse,
    RegionalWeatherSummaryResponse,
    IngestFeedRequest,
)
from app.services.weather.weather_service import (
    get_district_weather,
    get_active_disaster_alerts,
    get_regional_weather_summaries,
    ingest_external_weather_feed,
)

router = APIRouter(prefix="/weather", tags=["Weather & Disaster Intelligence"])

@router.get("/district", response_model=WeatherObservationResponse)
async def get_weather_for_district(
    location: str = Query(default="Sonapur (East Jaintia Hills, Meghalaya)"),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves current weather observation and IMD telemetry for a target district/corridor."""
    return await get_district_weather(db, location)

@router.get("/regional-summary", response_model=List[RegionalWeatherSummaryResponse])
async def get_regional_summary(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns state-level and district-level weather overview across the 8 North Eastern states."""
    return await get_regional_weather_summaries(db)

@router.get("/corridor/{road_id}", response_model=WeatherObservationResponse)
async def get_corridor_weather(
    road_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves weather observation for a specific highway corridor (e.g. NH-6, NH-306, NH-13)."""
    location_name = "Sonapur" if "SONAPUR" in road_id or "NH-6" in road_id else "Guwahati"
    return await get_district_weather(db, location_name)

@router.get("/disasters/active", response_model=List[DisasterAlertResponse])
async def get_active_disasters(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves active disaster events, IMD warnings & SDMA highway bulletins."""
    return await get_active_disaster_alerts(db)

@router.get("/disasters/{id}", response_model=DisasterAlertResponse)
async def get_disaster_detail(
    id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves specific disaster alert details by ID."""
    stmt = select(DisasterAlertEvent).where(DisasterAlertEvent.id == id)
    res = await db.execute(stmt)
    evt = res.scalar_one_or_none()
    if not evt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disaster alert record not found")
    return DisasterAlertResponse.model_validate(evt)

@router.post("/ingest-feed")
async def ingest_weather_feed(
    payload: IngestFeedRequest,
    current_user: User = Depends(require_roles([UserRole.CENTRAL_ADMIN, UserRole.DISTRICT_ADMIN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """API endpoint for external weather feed ingestion & normalization (Restricted to Government Admins)."""
    return await ingest_external_weather_feed(db, payload)

@router.get("/sources")
async def get_data_sources_registry(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
) -> Any:
    """Returns data provenance registry and active weather stations."""
    return [
        {
            "id": "IMD-GUWAHATI-RMC",
            "name": "India Meteorological Department (IMD) Regional Meteorological Centre, Guwahati",
            "type": "AUTOMATIC_WEATHER_STATION",
            "covered_states": ["Assam", "Meghalaya", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura"],
            "data_quality": "VERIFIED_GOVT_SIMULATION",
            "status": "OPERATIONAL",
        },
        {
            "id": "CWC-BRAHMAPUTRA-BARAK",
            "name": "Central Water Commission (CWC) Brahmaputra & Barak Basin Station",
            "type": "RIVER_GAUGE_TELEMETRY",
            "covered_states": ["Assam", "Meghalaya", "Mizoram"],
            "data_quality": "VERIFIED_GOVT_SIMULATION",
            "status": "OPERATIONAL",
        },
        {
            "id": "SDMA-MEGHALAYA-OBSERVATORY",
            "name": "Meghalaya State Disaster Management Authority (SDMA) Sonapur Probe",
            "type": "SLOPE_SATURATION_RAINGAUGE",
            "covered_states": ["Meghalaya"],
            "data_quality": "VERIFIED_GOVT_SIMULATION",
            "status": "OPERATIONAL",
        },
    ]
