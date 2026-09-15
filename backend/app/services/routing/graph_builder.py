from typing import Dict, List, Any, Tuple
import math
from app.core.spatial import haversine_distance_km

# Key North Eastern Region logistics nodes and hubs
JUNCTIONS = {
    "GUWAHATI": {"name": "Guwahati Central Hub, Assam", "lat": 26.18, "lon": 91.73},
    "SHILLONG": {"name": "Shillong Nodal Depot, Meghalaya", "lat": 25.57, "lon": 91.88},
    "JOWAI": {"name": "Jowai Junction, Meghalaya", "lat": 25.45, "lon": 92.20},
    "SONAPUR": {"name": "Sonapur Tunnel Pass, Meghalaya", "lat": 25.10, "lon": 92.36},
    "LUMSHNONG": {"name": "Lumshnong Mineral Ridge, Meghalaya", "lat": 24.95, "lon": 92.65},
    "SILCHAR": {"name": "Silchar Food & Medical Depot, Assam", "lat": 24.83, "lon": 92.79},
    "VAIRENGTE": {"name": "Vairengte Inter-State Gate, Mizoram", "lat": 24.50, "lon": 92.75},
    "KOLASIB": {"name": "Kolasib Ridge, Mizoram", "lat": 24.22, "lon": 92.67},
    "AIZAWL": {"name": "Aizawl Central Granary, Mizoram", "lat": 23.73, "lon": 92.71},
    "LUMDING": {"name": "Lumding Junction, Assam", "lat": 25.75, "lon": 93.18},
    "HAFLONG": {"name": "Haflong Hill Bypass, Assam", "lat": 25.17, "lon": 93.02},
    "UMRANGSO": {"name": "Umrangso Green Bypass, Assam", "lat": 25.51, "lon": 92.74},
    "TEZPUR": {"name": "Tezpur Military Gateway, Assam", "lat": 26.65, "lon": 92.79},
    "TAWANG": {"name": "Tawang Strategic Depot, Arunachal Pradesh", "lat": 27.58, "lon": 91.86},
    "ITANAGAR": {"name": "Itanagar Capital Hub, Arunachal Pradesh", "lat": 27.08, "lon": 93.60},
    "JORHAT": {"name": "Jorhat Valley Terminal, Assam", "lat": 26.75, "lon": 94.22},
    "DIMAPUR": {"name": "Dimapur Commercial Railhead, Nagaland", "lat": 25.90, "lon": 93.72},
    "KOHIMA": {"name": "Kohima Mountain Ridge, Nagaland", "lat": 25.67, "lon": 94.10},
    "IMPHAL": {"name": "Imphal Valley Supply Center, Manipur", "lat": 24.81, "lon": 93.93},
    "AGARTALA": {"name": "Agartala Supply Hub, Tripura", "lat": 23.83, "lon": 91.28},
    "GANGTOK": {"name": "Gangtok Hill Depot, Sikkim", "lat": 27.33, "lon": 88.61},
}

class NetworkGraph:
    def __init__(self):
        self.nodes = JUNCTIONS
        self.adjacency: Dict[str, List[Dict[str, Any]]] = {k: [] for k in JUNCTIONS}

    def add_edge(
        self,
        u: str,
        v: str,
        road_id: str,
        road_name: str,
        distance_km: float,
        base_speed_kmh: float,
        status: str,
        coordinates: List[List[float]],
        is_bypass: bool = False,
    ):
        edge = {
            "to": v,
            "road_id": road_id,
            "road_name": road_name,
            "distance_km": distance_km,
            "base_speed_kmh": base_speed_kmh,
            "status": status,
            "coordinates": coordinates,
            "is_bypass": is_bypass,
        }
        self.adjacency[u].append(edge)

        # Bidirectional road network
        rev_coords = list(reversed(coordinates))
        rev_edge = {
            "to": u,
            "road_id": road_id,
            "road_name": road_name,
            "distance_km": distance_km,
            "base_speed_kmh": base_speed_kmh,
            "status": status,
            "coordinates": rev_coords,
            "is_bypass": is_bypass,
        }
        self.adjacency[v].append(rev_edge)

def build_ner_road_graph(roads_list: List[Any], active_incidents: List[Any] = None) -> NetworkGraph:
    """Constructs the spatial road network graph from DB roads and overlay incidents."""
    graph = NetworkGraph()

    # Build road status lookup
    status_map = {}
    for r in roads_list:
        status_map[r.id] = r.status.value if hasattr(r.status, "value") else str(r.status)

    # 1. NH-6 Highway Spine Segments
    nh6_status = status_map.get("NH-6-SONAPUR-01", "ORANGE")

    # Segment A: Guwahati -> Shillong (102 km, Green Expressway)
    graph.add_edge(
        "GUWAHATI", "SHILLONG",
        "NH-6-GW-SH", "NH-6 Guwahati-Shillong 4-Lane Expressway",
        102.0, 50.0, "GREEN",
        [[91.73, 26.18], [91.80, 25.88], [91.88, 25.57]]
    )

    # Segment B: Shillong -> Jowai (64 km, High Ridge)
    graph.add_edge(
        "SHILLONG", "JOWAI",
        "NH-6-SH-JW", "NH-6 Shillong-Jowai Mountain Highway",
        64.0, 40.0, "GREEN",
        [[91.88, 25.57], [92.05, 25.50], [92.20, 25.45]]
    )

    # Segment C: Jowai -> Sonapur Tunnel (58 km, Sonapur Slide Zone)
    graph.add_edge(
        "JOWAI", "SONAPUR",
        "NH-6-JW-SN", "NH-6 Sonapur Tunnel Mountain Approach",
        58.0, 28.0, nh6_status, # ORANGE due to mudflow
        [[92.20, 25.45], [92.28, 25.25], [92.36, 25.10]]
    )

    # Segment D: Sonapur Tunnel -> Lumshnong -> Silchar (66 km)
    graph.add_edge(
        "SONAPUR", "SILCHAR",
        "NH-6-SN-SC", "NH-6 Lubha Bridge - Silchar Gateway",
        66.0, 32.0, "YELLOW",
        [[92.36, 25.10], [92.65, 24.95], [92.79, 24.83]]
    )

    # 2. Alternative Bypass Corridor: Jowai -> Umrangso -> Haflong -> Silchar (Safe green valley bypass)
    graph.add_edge(
        "JOWAI", "UMRANGSO",
        "SH-JW-UM", "SH-4 Jowai-Umrangso Valley Link",
        72.0, 45.0, "GREEN",
        [[92.20, 25.45], [92.45, 25.48], [92.74, 25.51]],
        is_bypass=True
    )
    graph.add_edge(
        "UMRANGSO", "HAFLONG",
        "NH-27-UM-HF", "NH-27 Haflong Mountain Pass Expressway",
        65.0, 50.0, "GREEN",
        [[92.74, 25.51], [92.88, 25.35], [93.02, 25.17]],
        is_bypass=True
    )
    graph.add_edge(
        "HAFLONG", "SILCHAR",
        "NH-27-HF-SC", "NH-27 Mahur-Silchar 4-Lane Connector",
        78.0, 48.0, "GREEN",
        [[93.02, 25.17], [92.90, 24.98], [92.79, 24.83]],
        is_bypass=True
    )

    # 3. NH-306 South Corridor: Silchar -> Vairengte -> Kolasib -> Aizawl
    nh306_status = status_map.get("NH-306-VAIRENGTE-01", "GREEN")
    graph.add_edge(
        "SILCHAR", "VAIRENGTE",
        "NH-306-SC-VR", "NH-306 Assam-Mizoram Border Corridor",
        42.0, 45.0, nh306_status,
        [[92.79, 24.83], [92.75, 24.50]]
    )
    graph.add_edge(
        "VAIRENGTE", "KOLASIB",
        "NH-306-VR-KL", "NH-306 Kolasib Mountain Climb",
        45.0, 38.0, "GREEN",
        [[92.75, 24.50], [92.67, 24.22]]
    )
    graph.add_edge(
        "KOLASIB", "AIZAWL",
        "NH-306-KL-AZ", "NH-306 Aizawl Capital Approach",
        85.0, 40.0, "GREEN",
        [[92.67, 24.22], [92.71, 23.73]]
    )

    # 4. NH-8 / NH-208: Silchar -> Agartala
    graph.add_edge(
        "SILCHAR", "AGARTALA",
        "NH-8-SC-AG", "NH-8 Assam-Tripura Lifeline Corridor",
        254.0, 42.0, "GREEN",
        [[92.79, 24.83], [92.25, 24.30], [91.75, 23.95], [91.28, 23.83]]
    )

    # 5. Northern Corridors: Guwahati -> Tezpur -> Tawang / Itanagar
    graph.add_edge(
        "GUWAHATI", "TEZPUR",
        "NH-15-GW-TZ", "NH-15 Brahmaputra North Bank Corridor",
        178.0, 55.0, "GREEN",
        [[91.73, 26.18], [92.20, 26.45], [92.79, 26.65]]
    )
    graph.add_edge(
        "TEZPUR", "TAWANG",
        "NH-13-TZ-TW", "NH-13 Sela Pass High Mountain Strategic Corridor",
        320.0, 30.0, "YELLOW",
        [[92.79, 26.65], [92.40, 27.20], [92.00, 27.50], [91.86, 27.58]]
    )
    graph.add_edge(
        "TEZPUR", "ITANAGAR",
        "NH-415-TZ-IT", "NH-415 Arunachal Capital Expressway",
        155.0, 48.0, "GREEN",
        [[92.79, 26.65], [93.20, 26.85], [93.60, 27.08]]
    )

    # 6. Eastern & Nagaland/Manipur Spine: Lumding -> Dimapur -> Kohima -> Imphal
    graph.add_edge(
        "GUWAHATI", "LUMDING",
        "NH-27-GW-LM", "NH-27 East-West Expressway",
        185.0, 60.0, "GREEN",
        [[91.73, 26.18], [92.45, 26.05], [93.18, 25.75]]
    )
    graph.add_edge(
        "LUMDING", "DIMAPUR",
        "NH-29-LM-DM", "NH-29 Assam-Nagaland Commercial Connector",
        72.0, 50.0, "GREEN",
        [[93.18, 25.75], [93.45, 25.82], [93.72, 25.90]]
    )
    graph.add_edge(
        "DIMAPUR", "KOHIMA",
        "NH-29-DM-KH", "NH-29 Kohima Mountain Climb",
        74.0, 38.0, "GREEN",
        [[93.72, 25.90], [93.90, 25.78], [94.10, 25.67]]
    )
    graph.add_edge(
        "KOHIMA", "IMPHAL",
        "NH-2-KH-IM", "NH-2 Trans-Manipur Supply Highway",
        138.0, 40.0, "GREEN",
        [[94.10, 25.67], [94.02, 25.20], [93.93, 24.81]]
    )

    # 7. Western Himalayan Connector: Guwahati -> Gangtok
    graph.add_edge(
        "GUWAHATI", "GANGTOK",
        "NH-10-GW-GT", "NH-27 / NH-10 Teesta Valley Corridor",
        540.0, 48.0, "GREEN",
        [[91.73, 26.18], [89.85, 26.50], [88.50, 26.90], [88.61, 27.33]]
    )

    return graph
