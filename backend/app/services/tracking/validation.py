from datetime import datetime, timezone
from typing import Tuple, Optional
from app.core.spatial import haversine_distance_km

def validate_gps_ping(
    latitude: float,
    longitude: float,
    accuracy_meters: float,
    client_timestamp: datetime,
    last_ping: Optional[dict] = None,
    max_realistic_speed_kmh: float = 160.0,
) -> Tuple[bool, bool, str, str]:
    """
    Validates a GPS telemetry ping against bounding boxes, accuracy thresholds, and physical speed limits.
    Returns: (is_valid, is_anomalous, accuracy_grade, validation_note)
    """
    # 1. Geographic Coordinate Bounds
    if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
        return False, True, "INVALID", "OUT_OF_BOUNDS_COORDINATES"

    # 2. GPS Accuracy Classification
    if accuracy_meters <= 25.0:
        accuracy_grade = "VALID"
    elif accuracy_meters <= 100.0:
        accuracy_grade = "LOW_ACCURACY"
    else:
        return False, False, "INVALID", f"EXCESSIVE_GPS_DILUTION ({accuracy_meters}m > 100m)"

    # 3. Anomaly / Teleportation Jump Detection
    if last_ping:
        prev_lat = last_ping.get("latitude")
        prev_lon = last_ping.get("longitude")
        prev_time = last_ping.get("timestamp")

        if prev_lat is not None and prev_lon is not None and prev_time is not None:
            # Ensure timezones match
            if client_timestamp.tzinfo is None:
                client_timestamp = client_timestamp.replace(tzinfo=timezone.utc)
            if prev_time.tzinfo is None:
                prev_time = prev_time.replace(tzinfo=timezone.utc)

            delta_sec = (client_timestamp - prev_time).total_seconds()
            dist_km = haversine_distance_km(prev_lat, prev_lon, latitude, longitude)

            # Check duplicate ping
            if dist_km < 0.001 and delta_sec < 1.0:
                return True, False, accuracy_grade, "DUPLICATE_STATIONARY_PING"

            # Check speed anomaly
            if delta_sec > 0:
                calc_speed_kmh = (dist_km / (delta_sec / 3600.0))
                if calc_speed_kmh > max_realistic_speed_kmh and dist_km > 0.5:
                    return (
                        True,
                        True,
                        "INVALID",
                        f"ANOMALOUS_SPEED_JUMP ({round(calc_speed_kmh, 1)} km/h across {round(dist_km, 2)} km in {round(delta_sec, 1)}s)",
                    )

    return True, False, accuracy_grade, "VALID"
