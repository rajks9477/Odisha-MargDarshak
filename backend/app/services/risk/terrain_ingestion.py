from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.risk import TerrainFeature

DEMO_TERRAIN_PROFILES = {
    "SONAPUR": {
        "elevation_m": 1280.0,
        "slope_deg": 34.5,
        "river_distance_m": 85.0,
        "soil_saturation_index": 0.88,
        "historical_landslide_count": 8,
        "historical_flood_count": 3,
        "source": "GSI_LANDSLIDE_ATLAS_SRTM_TEST",
    },
    "VAIRENGTE": {
        "elevation_m": 820.0,
        "slope_deg": 22.0,
        "river_distance_m": 220.0,
        "soil_saturation_index": 0.52,
        "historical_landslide_count": 2,
        "historical_flood_count": 1,
        "source": "GSI_LANDSLIDE_ATLAS_SRTM_TEST",
    },
    "DEFAULT": {
        "elevation_m": 550.0,
        "slope_deg": 12.0,
        "river_distance_m": 450.0,
        "soil_saturation_index": 0.35,
        "historical_landslide_count": 1,
        "historical_flood_count": 0,
        "source": "GSI_LANDSLIDE_ATLAS_SRTM_TEST",
    }
}

async def get_or_create_terrain_feature(db: AsyncSession, road_id: str, road_name: str) -> TerrainFeature:
    """Retrieves digital elevation and slope features for a road corridor."""
    stmt = select(TerrainFeature).where(TerrainFeature.road_id == road_id)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        return existing

    key = "DEFAULT"
    if "sonapur" in road_id.lower() or "sonapur" in road_name.lower() or "nh-6" in road_name.lower():
        key = "SONAPUR"
    elif "vairengte" in road_id.lower() or "nh-306" in road_name.lower():
        key = "VAIRENGTE"

    prof = DEMO_TERRAIN_PROFILES.get(key, DEMO_TERRAIN_PROFILES["DEFAULT"])
    terrain = TerrainFeature(
        road_id=road_id,
        elevation_m=prof["elevation_m"],
        slope_deg=prof["slope_deg"],
        river_distance_m=prof["river_distance_m"],
        soil_saturation_index=prof["soil_saturation_index"],
        historical_landslide_count=prof["historical_landslide_count"],
        historical_flood_count=prof["historical_flood_count"],
        source=prof["source"],
    )
    db.add(terrain)
    await db.flush()
    return terrain
