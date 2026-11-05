import {
  PlannedRoute,
  LogisticsHub,
  RouteCalculateParams,
  RouteType,
  RouteRiskLevel,
  RouteSegment
} from "../types/routingTypes";
import { routingApi } from "../api/routingApi";
import { findOdishaLocationByName, ODISHA_LOCATIONS_DATABASE } from "./nerLocations";

const CACHED_ROUTES_KEY = "odisha_cached_planned_routes_v2";

export interface NavigationStep {
  instruction: string;
  distanceKm: number;
  roadName: string;
  riskStatus: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  hazardWarning?: string;
  icon: "straight" | "turn-right" | "turn-left" | "fork" | "u-turn" | "destination";
}

export class RoutingService {
  /**
   * Calculate routes with network failure fallback to smart simulated routes
   */
  static async calculateCandidateRoutes(params: RouteCalculateParams): Promise<PlannedRoute[]> {
    const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

    if (!isOnline) {
      return this.generateSmartCandidateRoutes(params);
    }

    try {
      const routes = await routingApi.calculateRoutes(params);
      if (routes && routes.length > 0) {
        this.cacheRoutes(routes);
        return routes;
      }
      return this.generateSmartCandidateRoutes(params);
    } catch (err) {
      console.warn("Live route calculation API failed, using intelligent candidate generator", err);
      return this.generateSmartCandidateRoutes(params);
    }
  }

  /**
   * Save calculated routes to localStorage
   */
  private static cacheRoutes(routes: PlannedRoute[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CACHED_ROUTES_KEY, JSON.stringify(routes));
    } catch (e) {
      console.warn("Failed to cache routes in localStorage", e);
    }
  }

  /**
   * Generate turn-by-turn navigation steps for an active route
   */
  static generateNavigationSteps(route: PlannedRoute): NavigationStep[] {
    const orig = route.origin_name.split(",")[0];
    const dest = route.destination_name.split(",")[0];

    const isDirect = route.route_type === RouteType.FASTEST;
    const isBypass = route.route_type === RouteType.ALTERNATE;

    if (isDirect) {
      return [
        {
          instruction: `Start dispatch from ${orig} heading towards Highway Entry Gate`,
          distanceKm: 2.5,
          roadName: "Connecting Arterial",
          riskStatus: "GREEN",
          icon: "straight",
        },
        {
          instruction: "Merge onto National Highway Direct Spine and proceed through foothills",
          distanceKm: 48.0,
          roadName: "NH-Direct Highway",
          riskStatus: "GREEN",
          icon: "turn-right",
        },
        {
          instruction: "⚠️ CAUTION: Mud & Slush accumulation on mountain curves. Maintain 35 km/h",
          distanceKm: 34.5,
          roadName: "Pass Approach Section",
          riskStatus: "ORANGE",
          hazardWarning: "Active Landslide Risk Area - Keep safe convoy distance",
          icon: "straight",
        },
        {
          instruction: "Continue straight past District Emergency Checkpost",
          distanceKm: 62.0,
          roadName: "State Valley Corridor",
          riskStatus: "YELLOW",
          hazardWarning: "Moderate rain & reduced visibility",
          icon: "straight",
        },
        {
          instruction: `Take exit towards ${dest} and proceed to Unloading Bay`,
          distanceKm: 5.0,
          roadName: "Depot Access Link",
          riskStatus: "GREEN",
          icon: "destination",
        },
      ];
    } else if (isBypass) {
      return [
        {
          instruction: `Depart from ${orig} via Southern Valley Bypass Route`,
          distanceKm: 4.2,
          roadName: "Bypass Link Road",
          riskStatus: "GREEN",
          icon: "straight",
        },
        {
          instruction: "Turn right onto Valley Riverbed Corridor. Smooth all-weather pavement",
          distanceKm: 78.0,
          roadName: "River Valley Highway",
          riskStatus: "GREEN",
          icon: "turn-right",
        },
        {
          instruction: "Cross Multi-Span RCC Bridge at 40 km/h speed limit",
          distanceKm: 1.8,
          roadName: "RCC Bridge Crossing",
          riskStatus: "GREEN",
          icon: "straight",
        },
        {
          instruction: `Merge onto Highway Link and arrive safely at ${dest}`,
          distanceKm: 12.0,
          roadName: "Terminal Ring Road",
          riskStatus: "GREEN",
          icon: "destination",
        },
      ];
    } else {
      // RECOMMENDED (Safest AI Route)
      return [
        {
          instruction: `Head East from ${orig} on AI-Optimized Safe Corridor`,
          distanceKm: 3.0,
          roadName: "Terminal Feeder",
          riskStatus: "GREEN",
          icon: "straight",
        },
        {
          instruction: "Follow 4-Lane Paved Expressway with automated slope monitoring",
          distanceKm: 85.0,
          roadName: "4-Lane Mountain Expressway",
          riskStatus: "GREEN",
          icon: "turn-right",
        },
        {
          instruction: "Bypass active Baitarani river flood zone via NH-53/NH-20 elevated bypass",
          distanceKm: 42.0,
          roadName: "Reinforced Highway Bypass Corridor",
          riskStatus: "GREEN",
          icon: "turn-left",
        },
        {
          instruction: "Proceed along Keonjhar All-Weather Ridge with clear drainage",
          distanceKm: 95.0,
          roadName: "All-Weather Ridge Corridor",
          riskStatus: "GREEN",
          icon: "straight",
        },
        {
          instruction: `Turn left into ${dest} Receiving Gate. Mission accomplished!`,
          distanceKm: 4.5,
          roadName: "Depot Final Approach",
          riskStatus: "GREEN",
          icon: "destination",
        },
      ];
    }
  }

  /**
   * Smart Candidate Generator with coordinate-based math & realistic mountain waypoints
   */
  private static generateSmartCandidateRoutes(params: RouteCalculateParams): PlannedRoute[] {
    const origName = params.origin_name || "Bhubaneswar Central Logistics & Government Command, Odisha";
    const destName = params.destination_name || "Balasore Industrial Corridor & Port Depot, Odisha";

    // Resolve Origin Coordinates
    const origLoc = findOdishaLocationByName(origName);
    const destLoc = findOdishaLocationByName(destName);

    const origLat = params.origin_latitude || origLoc?.latitude || 20.296;
    const origLon = params.origin_longitude || origLoc?.longitude || 85.824;
    const destLat = params.destination_latitude || destLoc?.latitude || 21.494;
    const destLon = params.destination_longitude || destLoc?.longitude || 86.932;

    // Euclidean / Haversine approximate distance
    const latDiff = destLat - origLat;
    const lonDiff = destLon - origLon;
    const directKm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111.0;
    const baseDistance = Math.max(35, Math.round(directKm * 1.35));

    const now = new Date().toISOString();

    // 1. SAFEST AI ROUTE (Slightly longer, but avoids hazards)
    const safeKm = Math.round(baseDistance * 1.08);
    const safeMinutes = Math.round((safeKm / 42.0) * 60);

    const safeCoords = [
      [origLon, origLat],
      [origLon + lonDiff * 0.25 + 0.15, origLat + latDiff * 0.25 - 0.08],
      [origLon + lonDiff * 0.50 + 0.22, origLat + latDiff * 0.50 + 0.05],
      [origLon + lonDiff * 0.75 + 0.10, origLat + latDiff * 0.75 + 0.02],
      [destLon, destLat],
    ];

    const safeSegments: RouteSegment[] = [
      {
        id: "SEG-SAFE-1",
        route_id: "REC-AI-01",
        sequence_order: 1,
        road_name: `${origName.split(",")[0]} ➔ Foothill Expressway`,
        distance_km: Math.round(safeKm * 0.35),
        estimated_time_minutes: Math.round(safeMinutes * 0.3),
        status: "GREEN",
        risk_penalty: 2.0,
        has_active_incident: false,
      },
      {
        id: "SEG-SAFE-2",
        route_id: "REC-AI-01",
        sequence_order: 2,
        road_name: "Protected Tunnel & Valley Ridge Bypass",
        distance_km: Math.round(safeKm * 0.40),
        estimated_time_minutes: Math.round(safeMinutes * 0.42),
        status: "GREEN",
        risk_penalty: 5.0,
        has_active_incident: false,
      },
      {
        id: "SEG-SAFE-3",
        route_id: "REC-AI-01",
        sequence_order: 3,
        road_name: `All-Weather Arterial ➔ ${destName.split(",")[0]}`,
        distance_km: Math.round(safeKm * 0.25),
        estimated_time_minutes: Math.round(safeMinutes * 0.28),
        status: "GREEN",
        risk_penalty: 1.5,
        has_active_incident: false,
      },
    ];

    const safeRoute: PlannedRoute = {
      id: "REC-AI-SAFE-01",
      driver_id: "driver-current",
      origin_name: origName,
      destination_name: destName,
      origin_latitude: origLat,
      origin_longitude: origLon,
      destination_latitude: destLat,
      destination_longitude: destLon,
      route_type: RouteType.RECOMMENDED,
      corridor_title: `${origName.split(",")[0]} ➔ ${destName.split(",")[0]} (Safest AI Route)`,
      geometry_geojson: JSON.stringify(safeCoords),
      distance_km: safeKm,
      estimated_time_minutes: safeMinutes,
      route_score: 120.0,
      risk_level: RouteRiskLevel.LOW,
      risk_score: 14.5,
      risk_reasons: [
        "Avoids landslide-prone slopes and mud accumulation zones",
        "Reinforced drainage & automated slope barrier protection active",
        "100% all-weather asphalt clearance with wide road shoulders",
      ],
      is_selected: true,
      route_version: 1,
      generated_at: now,
      segments: safeSegments,
      disaster_type: "CLEAR_TRANSIT",
      disaster_title: "Clear Low-Risk Valley Corridor",
      threat_time_window: "Safe Transit Window (Next 48 Hours Stable)",
      precipitation_mm: 18.0,
      slope_gradient_deg: 8.5,
      soil_saturation_pct: 35,
      historical_landslides: 0,
    };

    // 2. SHORTEST / FASTEST ROUTE (Direct, but has caution / mud warnings)
    const fastKm = baseDistance;
    const fastMinutes = Math.round((fastKm / 50.0) * 60);

    const fastCoords = [
      [origLon, origLat],
      [origLon + lonDiff * 0.33, origLat + latDiff * 0.33],
      [origLon + lonDiff * 0.66, origLat + latDiff * 0.66],
      [destLon, destLat],
    ];

    const fastSegments: RouteSegment[] = [
      {
        id: "SEG-FAST-1",
        route_id: "FAST-02",
        sequence_order: 1,
        road_name: "Direct National Highway Spine",
        distance_km: Math.round(fastKm * 0.45),
        estimated_time_minutes: Math.round(fastMinutes * 0.4),
        status: "GREEN",
        risk_penalty: 10.0,
        has_active_incident: false,
      },
      {
        id: "SEG-FAST-2",
        route_id: "FAST-02",
        sequence_order: 2,
        road_name: "Mountain Pass Direct Section (Single-Lane Delay)",
        distance_km: Math.round(fastKm * 0.35),
        estimated_time_minutes: Math.round(fastMinutes * 0.45),
        status: "ORANGE",
        risk_penalty: 45.0,
        has_active_incident: true,
        incident_description: "Active Mud & Rockfall Debris on road shoulder",
      },
      {
        id: "SEG-FAST-3",
        route_id: "FAST-02",
        sequence_order: 3,
        road_name: "Terminal Ingress Road",
        distance_km: Math.round(fastKm * 0.20),
        estimated_time_minutes: Math.round(fastMinutes * 0.15),
        status: "YELLOW",
        risk_penalty: 15.0,
        has_active_incident: false,
      },
    ];

    const fastRoute: PlannedRoute = {
      id: "FAST-DIRECT-02",
      driver_id: "driver-current",
      origin_name: origName,
      destination_name: destName,
      origin_latitude: origLat,
      origin_longitude: origLon,
      destination_latitude: destLat,
      destination_longitude: destLon,
      route_type: RouteType.FASTEST,
      corridor_title: `${origName.split(",")[0]} ➔ ${destName.split(",")[0]} (Shortest Direct Route)`,
      geometry_geojson: JSON.stringify(fastCoords),
      distance_km: fastKm,
      estimated_time_minutes: fastMinutes,
      route_score: 320.0,
      risk_level: RouteRiskLevel.MEDIUM,
      risk_score: 54.0,
      risk_reasons: [
        "Shortest driving distance but contains high mudslide hazard zone",
        "Moderate convoy congestion reported near central mountain pass",
        "Bridge load limit warning active on intermediate sector",
      ],
      is_selected: false,
      route_version: 1,
      generated_at: now,
      segments: fastSegments,
      disaster_type: "LANDSLIDE_DEBRIS",
      disaster_title: "Mountain Slope Mud Accumulation & Slush",
      threat_time_window: "Next 4 to 10 Hours (Rain Passing)",
      precipitation_mm: 58.0,
      slope_gradient_deg: 29.5,
      soil_saturation_pct: 82,
      historical_landslides: 4,
    };

    // 3. ALTERNATE BYPASS ROUTE
    const altKm = Math.round(baseDistance * 1.18);
    const altMinutes = Math.round((altKm / 46.0) * 60);

    const altCoords = [
      [origLon, origLat],
      [origLon + lonDiff * 0.20 - 0.20, origLat + latDiff * 0.20 + 0.12],
      [origLon + lonDiff * 0.50 - 0.25, origLat + latDiff * 0.50 + 0.10],
      [origLon + lonDiff * 0.80 - 0.15, origLat + latDiff * 0.80 + 0.05],
      [destLon, destLat],
    ];

    const altSegments: RouteSegment[] = [
      {
        id: "SEG-ALT-1",
        route_id: "ALT-03",
        sequence_order: 1,
        road_name: "Valley Scenic Bypass Highway",
        distance_km: Math.round(altKm * 0.6),
        estimated_time_minutes: Math.round(altMinutes * 0.55),
        status: "GREEN",
        risk_penalty: 8.0,
        has_active_incident: false,
      },
      {
        id: "SEG-ALT-2",
        route_id: "ALT-03",
        sequence_order: 2,
        road_name: "Inter-District Ring Link",
        distance_km: Math.round(altKm * 0.4),
        estimated_time_minutes: Math.round(altMinutes * 0.45),
        status: "YELLOW",
        risk_penalty: 18.0,
        has_active_incident: false,
      },
    ];

    const altRoute: PlannedRoute = {
      id: "ALT-BYPASS-03",
      driver_id: "driver-current",
      origin_name: origName,
      destination_name: destName,
      origin_latitude: origLat,
      origin_longitude: origLon,
      destination_latitude: destLat,
      destination_longitude: destLon,
      route_type: RouteType.ALTERNATE,
      corridor_title: `${origName.split(",")[0]} ➔ ${destName.split(",")[0]} (Valley Scenic Detour)`,
      geometry_geojson: JSON.stringify(altCoords),
      distance_km: altKm,
      estimated_time_minutes: altMinutes,
      route_score: 210.0,
      risk_level: RouteRiskLevel.LOW,
      risk_score: 24.0,
      risk_reasons: [
        "Smooth valley pavement with minimal hill inclination",
        "Recommended during night transit or adverse monsoonal weather",
      ],
      is_selected: false,
      route_version: 1,
      generated_at: now,
      segments: altSegments,
      disaster_type: "CLEAR_TRANSIT",
      disaster_title: "Low Incline Valley Detour",
      threat_time_window: "Safe Transit Window (Next 36 Hours Stable)",
      precipitation_mm: 22.0,
      slope_gradient_deg: 9.0,
      soil_saturation_pct: 44,
      historical_landslides: 1,
    };

    // 4. HEAVY FREIGHT MULTI-AXLE CORRIDOR (Reinforced Bridges)
    const freightKm = Math.round(baseDistance * 1.22);
    const freightMinutes = Math.round((freightKm / 40.0) * 60);

    const freightCoords = [
      [origLon, origLat],
      [origLon + lonDiff * 0.30 + 0.28, origLat + latDiff * 0.30 - 0.15],
      [origLon + lonDiff * 0.65 + 0.30, origLat + latDiff * 0.65 - 0.10],
      [destLon, destLat],
    ];

    const freightSegments: RouteSegment[] = [
      {
        id: "SEG-FREIGHT-1",
        route_id: "FREIGHT-04",
        sequence_order: 1,
        road_name: "Reinforced 4-Lane Industrial Corridor",
        distance_km: Math.round(freightKm * 0.55),
        estimated_time_minutes: Math.round(freightMinutes * 0.5),
        status: "GREEN",
        risk_penalty: 4.0,
        has_active_incident: false,
      },
      {
        id: "SEG-FREIGHT-2",
        route_id: "FREIGHT-04",
        sequence_order: 2,
        road_name: "Heavy Vehicle Arterial Bypass",
        distance_km: Math.round(freightKm * 0.45),
        estimated_time_minutes: Math.round(freightMinutes * 0.5),
        status: "GREEN",
        risk_penalty: 6.0,
        has_active_incident: false,
      },
    ];

    const freightRoute: PlannedRoute = {
      id: "FREIGHT-CORRIDOR-04",
      driver_id: "driver-current",
      origin_name: origName,
      destination_name: destName,
      origin_latitude: origLat,
      origin_longitude: origLon,
      destination_latitude: destLat,
      destination_longitude: destLon,
      route_type: RouteType.ALTERNATE,
      corridor_title: `${origName.split(",")[0]} ➔ ${destName.split(",")[0]} (Heavy Freight & Fuel Tanker Bypass)`,
      geometry_geojson: JSON.stringify(freightCoords),
      distance_km: freightKm,
      estimated_time_minutes: freightMinutes,
      route_score: 160.0,
      risk_level: RouteRiskLevel.LOW,
      risk_score: 18.0,
      risk_reasons: [
        "Class-70R heavy axle load bridge capacity",
        "Grade separation and wide turning radii for petroleum tankers",
      ],
      is_selected: false,
      route_version: 1,
      generated_at: now,
      segments: freightSegments,
      disaster_type: "CLEAR_TRANSIT",
      disaster_title: "Heavy Axle All-Weather Highway",
      threat_time_window: "Safe Transit Window (Stable)",
      precipitation_mm: 20.0,
      slope_gradient_deg: 6.0,
      soil_saturation_pct: 38,
      historical_landslides: 0,
    };

    // 5. HIGH-ALTITUDE EMERGENCY EXPRESS PASS (Critical in heavy rain)
    const expressKm = Math.round(baseDistance * 0.94);
    const expressMinutes = Math.round((expressKm / 52.0) * 60);

    const expressCoords = [
      [origLon, origLat],
      [origLon + lonDiff * 0.45 - 0.08, origLat + latDiff * 0.45 + 0.22],
      [origLon + lonDiff * 0.80 - 0.05, origLat + latDiff * 0.80 + 0.15],
      [destLon, destLat],
    ];

    const expressSegments: RouteSegment[] = [
      {
        id: "SEG-EXPRESS-1",
        route_id: "EXPRESS-05",
        sequence_order: 1,
        road_name: "Ridge Mountain Pass Cut",
        distance_km: Math.round(expressKm * 0.5),
        estimated_time_minutes: Math.round(expressMinutes * 0.45),
        status: "RED",
        risk_penalty: 75.0,
        has_active_incident: true,
        incident_description: "Active Rockfall Debris & Soil Inundation",
      },
      {
        id: "SEG-EXPRESS-2",
        route_id: "EXPRESS-05",
        sequence_order: 2,
        road_name: "Steep Incline Descent Road",
        distance_km: Math.round(expressKm * 0.5),
        estimated_time_minutes: Math.round(expressMinutes * 0.55),
        status: "ORANGE",
        risk_penalty: 48.0,
        has_active_incident: false,
      },
    ];

    const expressRoute: PlannedRoute = {
      id: "EXPRESS-PASS-05",
      driver_id: "driver-current",
      origin_name: origName,
      destination_name: destName,
      origin_latitude: origLat,
      origin_longitude: origLon,
      destination_latitude: destLat,
      destination_longitude: destLon,
      route_type: RouteType.FASTEST,
      corridor_title: `${origName.split(",")[0]} ➔ ${destName.split(",")[0]} (High-Altitude Mountain Cut)`,
      geometry_geojson: JSON.stringify(expressCoords),
      distance_km: expressKm,
      estimated_time_minutes: expressMinutes,
      route_score: 480.0,
      risk_level: RouteRiskLevel.HIGH,
      risk_score: 78.5,
      risk_reasons: [
        "Unpaved shoulder cuts vulnerable to severe mudflows",
        "Steep 38° mountain incline with high rockfall frequency",
        "Not recommended during monsoon weather",
      ],
      is_selected: false,
      route_version: 1,
      generated_at: now,
      segments: expressSegments,
      disaster_type: "LANDSLIDE_DEBRIS",
      disaster_title: "Severe Mountain Ridge Rockfall & Slush",
      threat_time_window: "Active Threat (Next 1 to 4 Hours)",
      precipitation_mm: 82.0,
      slope_gradient_deg: 38.0,
      soil_saturation_pct: 92,
      historical_landslides: 6,
    };

    return [safeRoute, fastRoute, altRoute, freightRoute, expressRoute];
  }
}
