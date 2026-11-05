from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.risk import TerrainFeature

DEMO_TERRAIN_PROFILES = {
    "BAITARANI": {
        "elevation_m": 42.0,
        "slope_deg": 3.5,
        "river_distance_m": 40.0,
        "soil_saturation_index": 0.92,
        "historical_landslide_count": 0,
        "historical_flood_count": 9,
        "source": "GSI_ODISHA_FLOOD_TERRAIN_SRTM",
    },
    "KANJIPANI": {
        "elevation_m": 890.0,
        "slope_deg": 32.0,
        "river_distance_m": 180.0,
        "soil_saturation_index": 0.85,
        "historical_landslide_count": 7,
        "historical_flood_count": 1,
        "source": "GSI_EASTERN_GHATS_SLOPE_MODEL",
    },
    "DEFAULT": {
        "elevation_m": 110.0,
        "slope_deg": 8.0,
        "river_distance_m": 350.0,
        "soil_saturation_index": 0.40,
        "historical_landslide_count": 1,
        "historical_flood_count": 2,
        "source": "GSI_ODISHA_TERRAIN_SRTM",
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
    if "baitarani" in road_id.lower() or "baitarani" in road_name.lower() or "nh-16" in road_name.lower():
        key = "BAITARANI"
    elif "kanjipani" in road_id.lower() or "nh-20" in road_name.lower() or "koraput" in road_name.lower():
        key = "KANJIPANI"

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
