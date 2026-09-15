import math
from typing import List, Tuple, Dict, Any, Optional
from app.core.spatial import haversine_distance_km

def point_in_polygon(lat: float, lon: float, polygon: List[List[float]]) -> bool:
    """
    Ray casting point-in-polygon algorithm.
    polygon: [[lon, lat], [lon, lat], ...]
    """
    num_pts = len(polygon)
    inside = False
    p1x, p1y = polygon[0][0], polygon[0][1] # lon, lat

    for i in range(num_pts + 1):
        p2x, p2y = polygon[i % num_pts][0], polygon[i % num_pts][1]
        if min(p1y, p2y) < lat <= max(p1y, p2y):
            if lon <= max(p1x, p2x):
                if p1y != p2y:
                    xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                if p1x == p2x or lon <= xinters:
                    inside = not inside
        p1x, p1y = p2x, p2y

    return inside

def is_point_in_bbox(lat: float, lon: float, min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> bool:
    """Checks if point coordinates fall within bounding box."""
    return (min_lat <= lat <= max_lat) and (min_lon <= lon <= max_lon)

def find_nearest_road_segment(lat: float, lon: float, roads: List[Any]) -> Tuple[Optional[Any], float, Optional[str]]:
    """
    Finds nearest road and minimum distance in km.
    Returns: (nearest_road_obj, distance_km, nearest_road_name)
    """
    min_dist = float("inf")
    best_road = None

    for r in roads:
        coords = r.get_coordinates() if hasattr(r, "get_coordinates") else []
        for pt in coords:
            # pt is [lon, lat]
            d = haversine_distance_km(lat, lon, pt[1], pt[0])
            if d < min_dist:
                min_dist = d
                best_road = r

    if best_road:
        return best_road, round(min_dist, 2), f"{best_road.road_number} - {best_road.road_name}"
    return None, 999.0, "North Eastern Regional Corridor"

def to_geojson_feature(
    id_val: str,
    geometry_type: str,
    coordinates: Any,
    properties: Dict[str, Any],
) -> Dict[str, Any]:
    """Formats an entity as a standard GeoJSON Feature."""
    return {
        "type": "Feature",
        "id": id_val,
        "geometry": {
            "type": geometry_type,
            "coordinates": coordinates,
        },
        "properties": properties,
    }

def to_geojson_feature_collection(features: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Formats a list of features as a standard GeoJSON FeatureCollection."""
    return {
        "type": "FeatureCollection",
        "features": features,
    }
