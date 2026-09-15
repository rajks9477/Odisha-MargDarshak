from typing import Dict, Any, Tuple

STATUS_PENALTY = {
    "GREEN": {"multiplier": 1.0, "risk_base": 10.0, "warning": None},
    "YELLOW": {"multiplier": 1.6, "risk_base": 35.0, "warning": "Single-lane caution / intermittent drizzle"},
    "ORANGE": {"multiplier": 4.2, "risk_base": 78.0, "warning": "Heavy mud accumulation / rockfall danger"},
    "RED": {"multiplier": 9999.0, "risk_base": 100.0, "warning": "Road completely blocked / active landslide"},
}

PRIORITY_WEIGHTS = {
    "ESSENTIAL_SAFETY": {"w_time": 0.25, "w_risk": 0.65, "w_dist": 0.10},
    "BALANCED_LOGISTICS": {"w_time": 0.45, "w_risk": 0.40, "w_dist": 0.15},
    "FASTEST_TRANSIT": {"w_time": 0.70, "w_risk": 0.20, "w_dist": 0.10},
}

def evaluate_edge_cost(edge: Dict[str, Any], mission_priority: str = "ESSENTIAL_SAFETY") -> Tuple[float, float, float, str]:
    """
    Returns (edge_cost, transit_time_minutes, risk_score, warning_str).
    """
    distance_km = edge["distance_km"]
    base_speed = edge["base_speed_kmh"]
    status = edge.get("status", "GREEN").upper()

    pen_info = STATUS_PENALTY.get(status, STATUS_PENALTY["GREEN"])
    multiplier = pen_info["multiplier"]
    risk_score = pen_info["risk_base"]
    warning = pen_info["warning"]

    # Nominal travel time
    nominal_time_mins = (distance_km / max(base_speed, 10.0)) * 60.0
    effective_time_mins = nominal_time_mins * multiplier

    weights = PRIORITY_WEIGHTS.get(mission_priority, PRIORITY_WEIGHTS["ESSENTIAL_SAFETY"])
    w_time = weights["w_time"]
    w_risk = weights["w_risk"]
    w_dist = weights["w_dist"]

    # Composite cost score
    cost = (w_time * effective_time_mins) + (w_risk * risk_score) + (w_dist * distance_km)

    return cost, effective_time_mins, risk_score, warning
