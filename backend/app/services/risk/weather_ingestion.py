from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.risk import WeatherObservation

# Realistic IMD AWS weather telemetry for key North Eastern mountain nodal points
DEMO_WEATHER_PROFILES = {
    "SONAPUR": {
        "location_name": "Sonapur Tunnel Weather Station (NH-6), Meghalaya",
        "latitude": 25.10, "longitude": 92.36,
        "rainfall_1h_mm": 18.5, "rainfall_6h_mm": 62.0, "rainfall_24h_mm": 115.0, "rainfall_7d_mm": 310.0,
        "temperature_c": 19.5, "humidity_pct": 96.0,
        "source": "IMD_AWS_SONAPUR_STATION_TEST",
    },
    "SHILLONG": {
        "location_name": "Shillong Peak AWS (NH-6), Meghalaya",
        "latitude": 25.57, "longitude": 91.88,
        "rainfall_1h_mm": 2.0, "rainfall_6h_mm": 8.5, "rainfall_24h_mm": 18.0, "rainfall_7d_mm": 45.0,
        "temperature_c": 18.0, "humidity_pct": 82.0,
        "source": "IMD_AWS_SHILLONG_STATION_TEST",
    },
    "VAIRENGTE": {
        "location_name": "Vairengte Gate AWS (NH-306), Mizoram",
        "latitude": 24.50, "longitude": 92.75,
        "rainfall_1h_mm": 4.5, "rainfall_6h_mm": 14.0, "rainfall_24h_mm": 28.0, "rainfall_7d_mm": 72.0,
        "temperature_c": 24.0, "humidity_pct": 88.0,
        "source": "IMD_AWS_VAIRENGTE_STATION_TEST",
    },
    "SILCHAR": {
        "location_name": "Silchar Valley Station (NH-6/306), Assam",
        "latitude": 24.83, "longitude": 92.79,
        "rainfall_1h_mm": 6.0, "rainfall_6h_mm": 22.0, "rainfall_24h_mm": 42.0, "rainfall_7d_mm": 98.0,
        "temperature_c": 26.0, "humidity_pct": 90.0,
        "source": "IMD_AWS_SILCHAR_STATION_TEST",
    },
    "DEFAULT": {
        "location_name": "Guwahati Regional Observatory, Assam",
        "latitude": 26.18, "longitude": 91.73,
        "rainfall_1h_mm": 0.5, "rainfall_6h_mm": 2.0, "rainfall_24h_mm": 5.0, "rainfall_7d_mm": 15.0,
        "temperature_c": 27.5, "humidity_pct": 75.0,
        "source": "IMD_AWS_REGIONAL_TEST",
    }
}

async def get_or_create_weather_observation(db: AsyncSession, road_id: str, road_name: str) -> WeatherObservation:
    """Retrieves current weather observation or provisions grounded IMD test telemetry."""
    stmt = select(WeatherObservation).order_by(WeatherObservation.recorded_at.desc())
    res = await db.execute(stmt)
    existing = res.scalars().first()

    key = "DEFAULT"
    if "sonapur" in road_id.lower() or "sonapur" in road_name.lower() or "nh-6" in road_name.lower():
        key = "SONAPUR"
    elif "vairengte" in road_id.lower() or "nh-306" in road_name.lower():
        key = "VAIRENGTE"
    elif "shillong" in road_id.lower():
        key = "SHILLONG"
    elif "silchar" in road_id.lower():
        key = "SILCHAR"

    prof = DEMO_WEATHER_PROFILES.get(key, DEMO_WEATHER_PROFILES["DEFAULT"])
    obs = WeatherObservation(
        location_name=prof["location_name"],
        latitude=prof["latitude"],
        longitude=prof["longitude"],
        rainfall_1h_mm=prof["rainfall_1h_mm"],
        rainfall_6h_mm=prof["rainfall_6h_mm"],
        rainfall_24h_mm=prof["rainfall_24h_mm"],
        rainfall_7d_mm=prof["rainfall_7d_mm"],
        temperature_c=prof["temperature_c"],
        humidity_pct=prof["humidity_pct"],
        recorded_at=datetime.now(timezone.utc),
        source=prof["source"],
        data_quality="HIGH",
    )
    db.add(obs)
    await db.flush()
    return obs
