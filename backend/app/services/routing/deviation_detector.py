from typing import List, Dict, Any
from app.core.spatial import point_to_segment_distance_km

def check_route_deviation(
    driver_lat: float,
    driver_lon: float,
    route_coordinates: List[List[float]],
    threshold_km: float = 1.5,
) -> Dict[str, Any]:
    """
    Evaluates whether the driver's current position is within the allowed corridor buffer.
    """
    if not route_coordinates or len(route_coordinates) < 2:
        return {
            "is_deviated": False,
            "distance_from_route_km": 0.0,
            "threshold_km": threshold_km,
            "status": "ON_TRACK",
            "message": "On planned route corridor",
        }

    min_dist_km = float("inf")

    for i in range(len(route_coordinates) - 1):
        # GeoJSON coordinates format: [lon, lat]
        lon1, lat1 = route_coordinates[i][0], route_coordinates[i][1]
        lon2, lat2 = route_coordinates[i + 1][0], route_coordinates[i + 1][1]
        dist = point_to_segment_distance_km(driver_lat, driver_lon, lat1, lon1, lat2, lon2)
        if dist < min_dist_km:
            min_dist_km = dist

    is_deviated = min_dist_km > threshold_km
    status = "OFF_ROUTE" if is_deviated else ("CAUTION" if min_dist_km > (threshold_km * 0.7) else "ON_TRACK")

    message = (
        f"Vehicle is {round(min_dist_km, 2)} km away from recommended corridor. Recalculation advised."
        if is_deviated
        else f"On track within {round(min_dist_km * 1000)} meters of planned route corridor."
    )

    return {
        "is_deviated": is_deviated,
        "distance_from_route_km": round(min_dist_km, 2),
        "threshold_km": threshold_km,
        "status": status,
        "message": message,
    }
