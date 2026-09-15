import math
from typing import List, Tuple, Optional, Any

EARTH_RADIUS_KM = 6371.0088

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return haversine_distance_km(lat1, lon1, lat2, lon2) * 1000.0

def point_to_segment_distance_km(p_lat: float, p_lon: float,
                                 a_lat: float, a_lon: float,
                                 b_lat: float, b_lon: float) -> float:
    """Find distance from point P to line segment AB in kilometers using projection."""
    # Approximate for small segments by calculating distances to ends and midpoint
    d_a = haversine_distance_km(p_lat, p_lon, a_lat, a_lon)
    d_b = haversine_distance_km(p_lat, p_lon, b_lat, b_lon)
    mid_lat = (a_lat + b_lat) / 2.0
    mid_lon = (a_lon + b_lon) / 2.0
    d_mid = haversine_distance_km(p_lat, p_lon, mid_lat, mid_lon)
    return min(d_a, d_b, d_mid)

def find_nearest_road(lat: float, lon: float, roads: List[Any]) -> Tuple[Optional[Any], float]:
    """Find the nearest road segment from a given GPS coordinate."""
    best_road = None
    min_dist_km = float("inf")

    for road in roads:
        if isinstance(road, dict):
            coords = road.get("coordinates", [])
        elif hasattr(road, "get_coordinates"):
            coords = road.get_coordinates()
        else:
            coords = getattr(road, "coordinates", [])

        if not coords or len(coords) < 2:
            continue

        for i in range(len(coords) - 1):
            # GeoJSON coordinates format: [lon, lat]
            lon1, lat1 = coords[i][0], coords[i][1]
            lon2, lat2 = coords[i + 1][0], coords[i + 1][1]
            dist = point_to_segment_distance_km(lat, lon, lat1, lon1, lat2, lon2)
            if dist < min_dist_km:
                min_dist_km = dist
                best_road = road

    return best_road, min_dist_km

def is_point_in_polygon(lat: float, lon: float, polygon: List[List[float]]) -> bool:
    """Ray casting algorithm to determine if [lon, lat] is inside polygon."""
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0][0], polygon[0][1]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n][0], polygon[i % n][1]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lon <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lon <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside
