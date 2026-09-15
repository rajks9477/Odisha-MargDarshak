from typing import Dict, Any, List, Tuple
import numpy as np

FEATURE_NAMES = [
    "rainfall_1h_mm",
    "rainfall_6h_mm",
    "rainfall_24h_mm",
    "rainfall_7d_mm",
    "elevation_m",
    "slope_deg",
    "river_distance_m",
    "soil_saturation_index",
    "historical_landslide_count",
    "historical_flood_count",
    "recent_incident_count_48h",
    "road_condition_score", # 1 (Degraded) to 5 (Excellent)
    "traffic_congestion_factor", # 1.0 to 3.0
    "monsoon_season_flag", # 0 or 1
]

def extract_features_for_road(
    weather_dict: Dict[str, Any],
    terrain_dict: Dict[str, Any],
    condition_dict: Dict[str, Any],
    incident_count_48h: int = 0,
    monsoon_season: bool = True,
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Constructs a standardized 14-dimensional feature vector for a road segment.
    """
    rf_1h = float(weather_dict.get("rainfall_1h_mm", 0.0))
    rf_6h = float(weather_dict.get("rainfall_6h_mm", 0.0))
    rf_24h = float(weather_dict.get("rainfall_24h_mm", 0.0))
    rf_7d = float(weather_dict.get("rainfall_7d_mm", 0.0))

    elev = float(terrain_dict.get("elevation_m", 1100.0))
    slope = float(terrain_dict.get("slope_deg", 25.0))
    river_dist = float(terrain_dict.get("river_distance_m", 250.0))
    soil_sat = float(terrain_dict.get("soil_saturation_index", 0.5))
    hist_slides = int(terrain_dict.get("historical_landslide_count", 2))
    hist_floods = int(terrain_dict.get("historical_flood_count", 1))

    cond_map = {"EXCELLENT": 5.0, "GOOD": 4.0, "FAIR": 3.0, "DEGRADED": 2.0, "FLOODED": 1.0}
    pavement_str = condition_dict.get("pavement_quality", "GOOD").upper()
    cond_score = cond_map.get(pavement_str, 4.0)
    traffic_factor = float(condition_dict.get("traffic_congestion_factor", 1.0))
    monsoon_flag = 1.0 if monsoon_season else 0.0

    features_dict = {
        "rainfall_1h_mm": rf_1h,
        "rainfall_6h_mm": rf_6h,
        "rainfall_24h_mm": rf_24h,
        "rainfall_7d_mm": rf_7d,
        "elevation_m": elev,
        "slope_deg": slope,
        "river_distance_m": river_dist,
        "soil_saturation_index": soil_sat,
        "historical_landslide_count": hist_slides,
        "historical_flood_count": hist_floods,
        "recent_incident_count_48h": incident_count_48h,
        "road_condition_score": cond_score,
        "traffic_congestion_factor": traffic_factor,
        "monsoon_season_flag": monsoon_flag,
    }

    vec = np.array([features_dict[k] for k in FEATURE_NAMES], dtype=np.float32)
    return vec, features_dict
