from typing import Tuple, Optional
from datetime import datetime
from app.core.spatial import haversine_distance_km

MAX_HILL_SPEED_KMH = 130.0 # Maximum realistic speed for heavy freight carriers on mountain corridors
MAX_ACCEPTABLE_ACCURACY_METERS = 80.0 # GPS accuracy tolerance

def validate_location_ping(
    latitude: float,
    longitude: float,
    accuracy_meters: float,
    speed_kmh: Optional[float] = None,
    heading_degrees: Optional[float] = None,
    prev_latitude: Optional[float] = None,
    prev_longitude: Optional[float] = None,
    time_delta_seconds: Optional[float] = None,
) -> Tuple[bool, Optional[str]]:
    """
    Validates physical feasibility and signal integrity of incoming driver GPS pings.
    Rejects or flags impossible teleportation and corrupted telemetry.
    """
    # 1. Geographic Coordinate Bounds Check
    if not (-90.0 <= latitude <= 90.0):
        return False, f"Invalid latitude {latitude}: out of [-90, 90] bounds"
    if not (-180.0 <= longitude <= 180.0):
        return False, f"Invalid longitude {longitude}: out of [-180, 180] bounds"

    # 2. GPS Accuracy Tolerance
    if accuracy_meters > MAX_ACCEPTABLE_ACCURACY_METERS:
        return True, f"Degraded GPS accuracy (±{accuracy_meters:.1f}m): accepted with low confidence flag"

    # 3. Unrealistic Speed Anomaly
    if speed_kmh is not None and speed_kmh > MAX_HILL_SPEED_KMH:
        return True, f"Speed anomaly detected ({speed_kmh:.1f} km/h > {MAX_HILL_SPEED_KMH} km/h): possible GPS leap"

    # 4. Impossible Movement / Teleportation Jump Check
    if prev_latitude is not None and prev_longitude is not None and time_delta_seconds is not None:
        if time_delta_seconds > 0:
            dist_km = haversine_distance_km(prev_latitude, prev_longitude, latitude, longitude)
            computed_speed = (dist_km / time_delta_seconds) * 3600.0 # km/h
            if computed_speed > 160.0 and dist_km > 0.5:
                return False, f"Teleportation jump rejected: {dist_km:.2f} km in {time_delta_seconds:.1f}s ({computed_speed:.0f} km/h)"

    return True, "Valid GPS fix"
