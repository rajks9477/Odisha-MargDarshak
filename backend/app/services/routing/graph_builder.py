from typing import Dict, List, Any, Tuple
import math
from app.core.spatial import haversine_distance_km

# Key Odisha Logistics nodes, administrative district hubs, and ports
JUNCTIONS = {
    "BHUBANESWAR": {"name": "Bhubaneswar Central Multi-Modal Logistics Hub, Odisha", "lat": 20.296, "lon": 85.824},
    "CUTTACK": {"name": "Cuttack Malgodown & Industrial Freight Depot, Odisha", "lat": 20.462, "lon": 85.882},
    "PURI": {"name": "Puri Coastal Tourism & Emergency Staging Depot, Odisha", "lat": 19.813, "lon": 85.831},
    "PARADIP": {"name": "Paradip Deepwater Port Cargo Terminal, Odisha", "lat": 20.316, "lon": 86.611},
    "KENDRAPARA": {"name": "Kendrapara Coastal Delta Depot, Odisha", "lat": 20.500, "lon": 86.423},
    "JAJPUR": {"name": "Panikoili / Jajpur Industrial Crossing, Odisha", "lat": 20.850, "lon": 86.333},
    "BHADRAK": {"name": "Bhadrak Baitarani Valley Supply Hub, Odisha", "lat": 21.057, "lon": 86.495},
    "BALASORE": {"name": "Balasore Northern Industrial Gateway, Odisha", "lat": 21.493, "lon": 86.913},
    "BARIPADA": {"name": "Baripada Mayurbhanj Tribal Transit Depot, Odisha", "lat": 21.932, "lon": 86.726},
    "DHENKANAL": {"name": "Dhenkanal Central Transport Depot, Odisha", "lat": 20.662, "lon": 85.597},
    "ANGUL": {"name": "Angul Mining & Energy Freight Corridor, Odisha", "lat": 20.844, "lon": 85.151},
    "SAMBALPUR": {"name": "Sambalpur Western Commercial Railhead, Odisha", "lat": 21.466, "lon": 83.981},
    "JHARSUGUDA": {"name": "Jharsuguda Multi-Modal Logistics Park (MMLP), Odisha", "lat": 21.855, "lon": 84.006},
    "ROURKELA": {"name": "Rourkela Steel City Commercial Terminal, Odisha", "lat": 22.260, "lon": 84.853},
    "SUNDARGARH": {"name": "Sundargarh Northern Gateway, Odisha", "lat": 22.120, "lon": 84.030},
    "DEOGARH": {"name": "Deogarh Central Highlands Junction, Odisha", "lat": 21.533, "lon": 84.733},
    "KEONJHAR": {"name": "Kendujhar (Keonjhar) Mineral Transit Depot, Odisha", "lat": 21.628, "lon": 85.581},
    "BARGARH": {"name": "Bargarh Agricultural Granary Depot, Odisha", "lat": 21.333, "lon": 83.619},
    "BALANGIR": {"name": "Balangir Western Agro Logistics Center, Odisha", "lat": 20.710, "lon": 83.486},
    "SONEPUR": {"name": "Subarnapur (Sonepur) River Basin Hub, Odisha", "lat": 20.839, "lon": 83.916},
    "BOUDH": {"name": "Boudh Mahanadi Valley Transit, Odisha", "lat": 20.841, "lon": 84.326},
    "NAYAGARH": {"name": "Nayagarh Highway Junction, Odisha", "lat": 20.125, "lon": 85.105},
    "PHULBANI": {"name": "Phulbani Kandhamal Mountain Staging Center, Odisha", "lat": 20.478, "lon": 84.233},
    "BHAWANIPATNA": {"name": "Bhawanipatna Kalahandi Regional Hub, Odisha", "lat": 19.907, "lon": 83.164},
    "NUAPADA": {"name": "Nuapada Interstate Border Depot, Odisha", "lat": 20.833, "lon": 82.533},
    "BERHAMPUR": {"name": "Berhampur Southern Commercial Depot, Odisha", "lat": 19.315, "lon": 84.794},
    "PARALAKHEMUNDI": {"name": "Paralakhemundi Gajapati Border Crossing, Odisha", "lat": 18.775, "lon": 84.092},
    "RAYAGADA": {"name": "Rayagada Eastern Ghats Rail Logistics Hub, Odisha", "lat": 19.171, "lon": 83.416},
    "KORAPUT": {"name": "Koraput High-Altitude & Tribal Supply Center, Odisha", "lat": 18.813, "lon": 82.712},
    "JEYPORE": {"name": "Jeypore Commercial Market Terminal, Odisha", "lat": 18.856, "lon": 82.563},
    "NABARANGPUR": {"name": "Nabarangpur Agricultural Grain Depot, Odisha", "lat": 19.231, "lon": 82.550},
    "MALKANGIRI": {"name": "Malkangiri Southern Border Strategic Depot, Odisha", "lat": 18.343, "lon": 81.897},
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

def build_odisha_road_graph(roads_list: List[Any], active_incidents: List[Any] = None) -> NetworkGraph:
    """Constructs the spatial road network graph from DB roads and overlay incidents across Odisha."""
    graph = NetworkGraph()

    # Build road status lookup
    status_map = {}
    for r in roads_list:
        status_map[r.id] = r.status.value if hasattr(r.status, "value") else str(r.status)

    nh16_status = status_map.get("NH-16-COASTAL-01", "YELLOW")
    nh55_status = status_map.get("NH-55-INDUSTRIAL-01", "GREEN")
    nh20_status = status_map.get("NH-20-MINING-01", "RED")
    nh326_status = status_map.get("NH-326-GHATS-01", "ORANGE")

    # 1. NH-16 Coastal Trunk Expressway (Golden Quadrilateral)
    # Balasore -> Bhadrak
    graph.add_edge(
        "BALASORE", "BHADRAK",
        "NH-16-BL-BH", "NH-16 Balasore-Bhadrak Coastal Spine",
        68.0, 55.0, nh16_status,
        [[86.91, 21.49], [86.72, 21.28], [86.50, 21.06]]
    )
    # Bhadrak -> Jajpur / Panikoili (Baitarani crossing)
    graph.add_edge(
        "BHADRAK", "JAJPUR",
        "NH-16-BH-JJ", "NH-16 Baitarani Bridge Corridor",
        42.0, 48.0, "YELLOW",
        [[86.50, 21.06], [86.48, 21.04], [86.33, 20.85]]
    )
    # Jajpur -> Cuttack
    graph.add_edge(
        "JAJPUR", "CUTTACK",
        "NH-16-JJ-CT", "NH-16 Panikoili-Chhatia-Cuttack 6-Lane Expressway",
        64.0, 65.0, "GREEN",
        [[86.33, 20.85], [86.08, 20.65], [85.88, 20.46]]
    )
    # Cuttack -> Bhubaneswar (Twin City Arterial Spine)
    graph.add_edge(
        "CUTTACK", "BHUBANESWAR",
        "NH-16-CT-BB", "NH-16 Kathajodi-Mahanadi Twin City Expressway",
        28.0, 60.0, "GREEN",
        [[85.88, 20.46], [85.85, 20.38], [85.82, 20.30]]
    )
    # Bhubaneswar -> Puri (National Highway 316)
    graph.add_edge(
        "BHUBANESWAR", "PURI",
        "NH-316-BB-PU", "NH-316 Jagannath Expressway (Bhubaneswar-Puri)",
        60.0, 65.0, "GREEN",
        [[85.82, 20.30], [85.83, 20.08], [85.83, 19.81]]
    )
    # Bhubaneswar -> Berhampur (Ganjam)
    graph.add_edge(
        "BHUBANESWAR", "BERHAMPUR",
        "NH-16-BB-BP", "NH-16 Khordha-Chhatrapur-Berhampur Highway",
        170.0, 62.0, "GREEN",
        [[85.82, 20.30], [85.62, 20.18], [85.15, 19.78], [84.99, 19.35], [84.79, 19.32]]
    )

    # 2. NH-55 Central Industrial Corridor: Cuttack -> Dhenkanal -> Angul -> Sambalpur
    graph.add_edge(
        "CUTTACK", "DHENKANAL",
        "NH-55-CT-DH", "NH-55 Choudwar-Dhenkanal Industrial Corridor",
        54.0, 52.0, nh55_status,
        [[85.88, 20.46], [85.74, 20.55], [85.60, 20.66]]
    )
    graph.add_edge(
        "DHENKANAL", "ANGUL",
        "NH-55-DH-AN", "NH-55 Dhenkanal-Angul National Artery",
        62.0, 55.0, "GREEN",
        [[85.60, 20.66], [85.38, 20.75], [85.15, 20.84]]
    )
    graph.add_edge(
        "ANGUL", "SAMBALPUR",
        "NH-55-AN-SM", "NH-55 Boinda-Redhakhol-Sambalpur 4-Lane Trunk",
        152.0, 58.0, "GREEN",
        [[85.15, 20.84], [84.65, 21.05], [84.35, 21.05], [83.98, 21.47]]
    )

    # 3. NH-53 Kolkata-Mumbai Lifeline: Bargarh -> Sambalpur -> Deogarh -> Keonjhar
    graph.add_edge(
        "BARGARH", "SAMBALPUR",
        "NH-53-BG-SM", "NH-53 Bargarh-Attabira-Sambalpur Tollway",
        48.0, 65.0, "GREEN",
        [[83.62, 21.33], [83.80, 21.40], [83.98, 21.47]]
    )
    graph.add_edge(
        "SAMBALPUR", "DEOGARH",
        "NH-53-SM-DG", "NH-53 Sambalpur-Deogarh Expressway",
        92.0, 60.0, "GREEN",
        [[83.98, 21.47], [84.35, 21.50], [84.73, 21.53]]
    )
    graph.add_edge(
        "DEOGARH", "KEONJHAR",
        "NH-53-DG-KJ", "NH-53 Barkote-Keonjhar Commercial Route",
        118.0, 55.0, "GREEN",
        [[84.73, 21.53], [85.15, 21.58], [85.58, 21.63]]
    )

    # 4. NH-20 Mining Trunk Corridor: Jajpur -> Keonjhar -> Rourkela
    graph.add_edge(
        "JAJPUR", "KEONJHAR",
        "NH-20-JJ-KJ", "NH-20 Panikoili-Keonjhar Iron Ore Spine",
        112.0, 40.0, nh20_status, # RED on Kanjipani Ghat
        [[86.33, 20.85], [85.95, 21.20], [85.58, 21.63]]
    )
    graph.add_edge(
        "KEONJHAR", "ROURKELA",
        "NH-20-KJ-RK", "NH-20 Keonjhar-Rourkela Steel Link",
        145.0, 50.0, "GREEN",
        [[85.58, 21.63], [85.10, 21.90], [84.85, 22.26]]
    )

    # 5. NH-26 Western-Southern Corridor: Bargarh -> Balangir -> Bhawanipatna -> Koraput -> Jeypore
    graph.add_edge(
        "BARGARH", "BALANGIR",
        "NH-26-BG-BL", "NH-26 Bargarh-Balangir Agricultural Artery",
        72.0, 55.0, "GREEN",
        [[83.62, 21.33], [83.55, 21.02], [83.49, 20.71]]
    )
    graph.add_edge(
        "BALANGIR", "BHAWANIPATNA",
        "NH-26-BL-BP", "NH-26 Balangir-Kesinga-Bhawanipatna Highway",
        110.0, 52.0, "GREEN",
        [[83.49, 20.71], [83.32, 20.30], [83.16, 19.91]]
    )
    graph.add_edge(
        "BHAWANIPATNA", "KORAPUT",
        "NH-26-BP-KP", "NH-26 Kalahandi-Sunabeda-Koraput Mountain Cut",
        142.0, 45.0, "GREEN",
        [[83.16, 19.91], [82.90, 19.35], [82.71, 18.81]]
    )
    graph.add_edge(
        "KORAPUT", "JEYPORE",
        "NH-26-KP-JP", "NH-26 Koraput-Jeypore Commercial Spur",
        24.0, 48.0, "GREEN",
        [[82.71, 18.81], [82.63, 18.83], [82.56, 18.86]]
    )

    # 6. NH-326 Southern Eastern Ghats & Tribal Corridor: Berhampur -> Paralakhemundi -> Rayagada -> Koraput -> Malkangiri
    graph.add_edge(
        "BERHAMPUR", "PARALAKHEMUNDI",
        "NH-326-BP-PK", "NH-326 Ganjam-Gajapati Hill Highway",
        118.0, 42.0, "GREEN",
        [[84.79, 19.32], [84.44, 19.05], [84.09, 18.78]]
    )
    graph.add_edge(
        "PARALAKHEMUNDI", "RAYAGADA",
        "NH-326-PK-RY", "NH-326 Mohana-Gunupur-Rayagada Ridge Corridor",
        124.0, 38.0, nh326_status,
        [[84.09, 18.78], [83.82, 19.05], [83.42, 19.17]]
    )
    graph.add_edge(
        "RAYAGADA", "KORAPUT",
        "NH-326-RY-KP", "NH-326 Rayagada-Laxmipur-Koraput Valley Route",
        112.0, 40.0, "GREEN",
        [[83.42, 19.17], [83.05, 18.98], [82.71, 18.81]]
    )
    graph.add_edge(
        "KORAPUT", "MALKANGIRI",
        "NH-326-KP-ML", "NH-326 Boipariguda-Govindpally-Malkangiri Lifeline",
        108.0, 35.0, "ORANGE",
        [[82.71, 18.81], [82.20, 18.55], [81.90, 18.34]]
    )

    # 7. Paradip Port Strategic Expressways
    graph.add_edge(
        "CUTTACK", "PARADIP",
        "NH-53-CT-PD", "NH-53 Paradip Port 4-Lane Dedicated Corridor",
        88.0, 65.0, "GREEN",
        [[85.88, 20.46], [86.25, 20.35], [86.61, 20.32]]
    )
    graph.add_edge(
        "CUTTACK", "KENDRAPARA",
        "SH-CT-KD", "State Highway 9A Cuttack-Kendrapara Corridor",
        55.0, 50.0, "GREEN",
        [[85.88, 20.46], [86.15, 20.48], [86.42, 20.50]]
    )
    graph.add_edge(
        "KENDRAPARA", "PARADIP",
        "SH-KD-PD", "Coastal Port Interconnect Kendrapara-Paradip",
        46.0, 52.0, "GREEN",
        [[86.42, 20.50], [86.52, 20.41], [86.61, 20.32]]
    )

    # 8. Central Trans-Odisha Corridor (NH-57): Bhubaneswar -> Nayagarh -> Boudh -> Sonepur -> Balangir
    graph.add_edge(
        "BHUBANESWAR", "NAYAGARH",
        "NH-57-BB-NY", "NH-57 Khordha-Nayagarh Artery",
        86.0, 55.0, "GREEN",
        [[85.82, 20.30], [85.46, 20.21], [85.11, 20.13]]
    )
    graph.add_edge(
        "NAYAGARH", "BOUDH",
        "NH-57-NY-BD", "NH-57 Nayagarh-Dasapalla-Boudh Trunk",
        112.0, 50.0, "GREEN",
        [[85.11, 20.13], [84.72, 20.48], [84.33, 20.84]]
    )
    graph.add_edge(
        "BOUDH", "SONEPUR",
        "NH-57-BD-SN", "NH-57 Boudh-Subarnapur River Bank Highway",
        48.0, 52.0, "GREEN",
        [[84.33, 20.84], [84.12, 20.84], [83.92, 20.84]]
    )
    graph.add_edge(
        "SONEPUR", "BALANGIR",
        "NH-57-SN-BL", "NH-57 Sonepur-Balangir Connector",
        52.0, 55.0, "GREEN",
        [[83.92, 20.84], [83.70, 20.78], [83.49, 20.71]]
    )

    # 9. Northern & Western Industrial Linkages
    graph.add_edge(
        "BALASORE", "BARIPADA",
        "NH-18-BL-BR", "NH-18 Balasore-Baripada Northern Spine",
        60.0, 55.0, "GREEN",
        [[86.91, 21.49], [86.82, 21.71], [86.73, 21.93]]
    )
    graph.add_edge(
        "SAMBALPUR", "JHARSUGUDA",
        "Biju-SM-JH", "Biju Expressway Sambalpur-Jharsuguda Section",
        52.0, 65.0, "GREEN",
        [[83.98, 21.47], [84.00, 21.66], [84.01, 21.85]]
    )
    graph.add_edge(
        "JHARSUGUDA", "SUNDARGARH",
        "Biju-JH-SD", "Biju Expressway Jharsuguda-Sundargarh",
        38.0, 60.0, "GREEN",
        [[84.01, 21.85], [84.02, 21.98], [84.03, 22.12]]
    )
    graph.add_edge(
        "SUNDARGARH", "ROURKELA",
        "SH-SD-RK", "Sundargarh-Rajgangpur-Rourkela Highway",
        98.0, 55.0, "GREEN",
        [[84.03, 22.12], [84.44, 22.19], [84.85, 22.26]]
    )
    graph.add_edge(
        "BALANGIR", "NUAPADA",
        "NH-353-BL-NP", "NH-353 Balangir-Khariar-Nuapada Route",
        104.0, 50.0, "GREEN",
        [[83.49, 20.71], [83.01, 20.77], [82.53, 20.83]]
    )
    graph.add_edge(
        "JEYPORE", "NABARANGPUR",
        "NH-26-JP-NB", "NH-26 Jeypore-Nabarangpur Artery",
        42.0, 50.0, "GREEN",
        [[82.56, 18.86], [82.55, 19.04], [82.55, 19.23]]
    )
    graph.add_edge(
        "BOUDH", "PHULBANI",
        "SH-BD-PB", "SH-Boudh-Phulbani Mountain Pass",
        68.0, 40.0, "GREEN",
        [[84.33, 20.84], [84.28, 20.66], [84.23, 20.48]]
    )

    return graph

# Maintain backward compatibility alias
build_ner_road_graph = build_odisha_road_graph
