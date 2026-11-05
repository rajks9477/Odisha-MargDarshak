import heapq
import json
from typing import List, Dict, Any, Tuple, Optional
from app.core.spatial import haversine_distance_km
from app.services.routing.graph_builder import JUNCTIONS, NetworkGraph, build_ner_road_graph
from app.services.routing.cost_evaluator import evaluate_edge_cost

def find_closest_junction(lat: float, lon: float) -> str:
    """Finds the nearest named junction key to given coordinates."""
    best_key = "BHUBANESWAR"
    min_dist = float("inf")
    for key, data in JUNCTIONS.items():
        d = haversine_distance_km(lat, lon, data["lat"], data["lon"])
        if d < min_dist:
            min_dist = d
            best_key = key
    return best_key

def dijkstra_path(
    graph: NetworkGraph,
    start_node: str,
    target_node: str,
    cost_mode: str = "COMPOSITE", # COMPOSITE (safety) or NOMINAL_TIME
    mission_priority: str = "ESSENTIAL_SAFETY",
    exclude_edges: List[str] = None,
) -> Optional[Dict[str, Any]]:
    if start_node == target_node:
        return None

    exclude_set = set(exclude_edges or [])
    distances = {node: float("inf") for node in graph.nodes}
    distances[start_node] = 0.0
    previous = {node: None for node in graph.nodes}
    edge_used = {node: None for node in graph.nodes}

    pq = [(0.0, start_node)]

    while pq:
        cur_cost, u = heapq.heappop(pq)
        if cur_cost > distances[u]:
            continue
        if u == target_node:
            break

        for edge in graph.adjacency.get(u, []):
            if edge["road_id"] in exclude_set:
                continue

            if cost_mode == "NOMINAL_TIME":
                # Pure fastest nominal time
                w = (edge["distance_km"] / max(edge["base_speed_kmh"], 10.0)) * 60.0
                if edge["status"] == "RED":
                    w = 99999.0
            else:
                # Composite safety-first cost
                w, _, _, _ = evaluate_edge_cost(edge, mission_priority)

            new_dist = distances[u] + w
            v = edge["to"]
            if new_dist < distances[v]:
                distances[v] = new_dist
                previous[v] = u
                edge_used[v] = edge
                heapq.heappush(pq, (new_dist, v))

    if distances[target_node] == float("inf"):
        return None

    # Reconstruct path
    path_nodes = []
    path_edges = []
    curr = target_node
    while curr != start_node:
        path_nodes.append(curr)
        e = edge_used[curr]
        if not e:
            break
        path_edges.append(e)
        curr = previous[curr]
    path_nodes.append(start_node)
    path_nodes.reverse()
    path_edges.reverse()

    # Aggregate geometry, distance, and warnings
    full_coords: List[List[float]] = []
    total_dist_km = 0.0
    total_time_mins = 0.0
    risk_scores = []
    warnings = []

    for edge in path_edges:
        total_dist_km += edge["distance_km"]
        _, edge_time, risk_val, warn = evaluate_edge_cost(edge, mission_priority)
        total_time_mins += edge_time
        risk_scores.append(risk_val)
        if warn:
            warnings.append(f"{edge['road_name']}: {warn}")

        coords = edge["coordinates"]
        if not full_coords:
            full_coords.extend(coords)
        else:
            # Skip first point if duplicating last point
            full_coords.extend(coords[1:] if len(coords) > 1 else coords)

    avg_risk = sum(risk_scores) / max(len(risk_scores), 1)

    return {
        "nodes": path_nodes,
        "edges": path_edges,
        "geometry": full_coords,
        "distance_km": round(total_dist_km, 1),
        "estimated_time_minutes": round(total_time_mins, 1),
        "route_score": round(distances[target_node], 2),
        "risk_score": round(avg_risk, 1),
        "warnings": list(dict.fromkeys(warnings)),
    }

def calculate_candidate_routes(
    graph: NetworkGraph,
    start_lat: float,
    start_lon: float,
    dest_lat: float,
    dest_lon: float,
    mission_priority: str = "ESSENTIAL_SAFETY",
) -> List[Dict[str, Any]]:
    start_node = find_closest_junction(start_lat, start_lon)
    target_node = find_closest_junction(dest_lat, dest_lon)

    if start_node == target_node:
        # Fallback if both within same city
        if start_node == "BHUBANESWAR":
            target_node = "CUTTACK"
        elif start_node == "CUTTACK":
            target_node = "PURI"
        else:
            target_node = "BHUBANESWAR"

    results = []

    # 1. RECOMMENDED Route (Safety-first composite optimization)
    rec_path = dijkstra_path(graph, start_node, target_node, "COMPOSITE", mission_priority)
    if rec_path:
        risk_level = "LOW"
        if rec_path["risk_score"] > 60:
            risk_level = "HIGH"
        elif rec_path["risk_score"] > 30:
            risk_level = "MEDIUM"

        corridor_title = f"{JUNCTIONS[start_node]['name'].split(',')[0]} ➔ {JUNCTIONS[target_node]['name'].split(',')[0]} (Safest Corridor)"
        results.append({
            "route_type": "RECOMMENDED",
            "corridor_title": corridor_title,
            "geometry_geojson": json.dumps(rec_path["geometry"]),
            "distance_km": rec_path["distance_km"],
            "estimated_time_minutes": rec_path["estimated_time_minutes"],
            "route_score": rec_path["route_score"],
            "risk_level": risk_level,
            "risk_score": rec_path["risk_score"],
            "risk_reasons": rec_path["warnings"],
            "segments": rec_path["edges"],
        })

    # 2. FASTEST Route (Nominal travel time)
    fast_path = dijkstra_path(graph, start_node, target_node, "NOMINAL_TIME", mission_priority)
    if fast_path:
        risk_level = "MEDIUM" if fast_path["risk_score"] > 30 else "LOW"
        if fast_path["risk_score"] > 60:
            risk_level = "HIGH"

        corridor_title = f"Direct Highway Spine ({fast_path['distance_km']} km)"
        results.append({
            "route_type": "FASTEST",
            "corridor_title": corridor_title,
            "geometry_geojson": json.dumps(fast_path["geometry"]),
            "distance_km": fast_path["distance_km"],
            "estimated_time_minutes": fast_path["estimated_time_minutes"],
            "route_score": fast_path["route_score"],
            "risk_level": risk_level,
            "risk_score": fast_path["risk_score"],
            "risk_reasons": fast_path["warnings"],
            "segments": fast_path["edges"],
        })

    # 3. ALTERNATE Route (Exclude primary edge to find alternative bypass)
    primary_edge = rec_path["edges"][0]["road_id"] if (rec_path and rec_path["edges"]) else None
    alt_path = dijkstra_path(graph, start_node, target_node, "COMPOSITE", mission_priority, exclude_edges=[primary_edge] if primary_edge else None)
    
    if alt_path and (not rec_path or alt_path["geometry"] != rec_path["geometry"]):
        corridor_title = f"Valley Redundancy Bypass via Umrangso"
        results.append({
            "route_type": "ALTERNATE",
            "corridor_title": corridor_title,
            "geometry_geojson": json.dumps(alt_path["geometry"]),
            "distance_km": alt_path["distance_km"],
            "estimated_time_minutes": alt_path["estimated_time_minutes"],
            "route_score": alt_path["route_score"],
            "risk_level": "LOW" if alt_path["risk_score"] <= 30 else "MEDIUM",
            "risk_score": alt_path["risk_score"],
            "risk_reasons": alt_path["warnings"],
            "segments": alt_path["edges"],
        })

    return results
