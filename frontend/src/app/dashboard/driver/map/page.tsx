"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { LocationService, GpsTelemetry } from "@/services/locationService";
import { TrackingService } from "@/services/trackingService";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { MapService } from "@/features/map/services/mapService";
import { RoadMatchingService } from "@/features/map/services/roadMatchingService";
import { MapApi } from "@/features/map/api/mapApi";
import {
  MapIncidentItem,
  MapRoadItem,
  MapInfrastructureItem,
  MapVehicleItem,
  MapLayerConfigItem,
  IncidentSeverityType,
  MapSearchItem,
} from "@/features/map/types/mapTypes";
import { MapStatusIndicator } from "@/features/map/components/MapStatusIndicator";
import { RecenterButton } from "@/features/map/components/RecenterButton";
import { MapLayerControl } from "@/features/map/components/MapLayerControl";
import { MapSearch } from "@/features/map/components/MapSearch";
import { IncidentDetailsCard } from "@/features/map/components/IncidentDetailsCard";
import { MapFilterPanel } from "@/features/map/components/MapFilterPanel";
import { OfflineMapBanner } from "@/features/map/components/OfflineMapBanner";
import { Loader2, Navigation, Play, Pause } from "lucide-react";
import { useRouter } from "next/navigation";

// Dynamically import Leaflet MapContainer without SSR
const DynamicMapContainer = dynamic(
  () => import("@/features/map/components/MapContainer").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading NER GIS Map Engine...</span>
      </div>
    ),
  }
);

export default function DriverMapPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State Management
  const [gps, setGps] = useState<GpsTelemetry | null>(null);
  const [freshness, setFreshness] = useState<"LIVE" | "STALE" | "OFFLINE">("LIVE");
  const [matchedRoadName, setMatchedRoadName] = useState<string>("NH-6 Sonapur Corridor");
  const [matchedDistrictName, setMatchedDistrictName] = useState<string>("East Jaintia Hills");

  const [incidents, setIncidents] = useState<MapIncidentItem[]>([]);
  const [roads, setRoads] = useState<MapRoadItem[]>([]);
  const [infrastructure, setInfrastructure] = useState<MapInfrastructureItem[]>([]);
  const [vehicles, setVehicles] = useState<MapVehicleItem[]>([]);
  const [layers, setLayers] = useState<MapLayerConfigItem[]>([]);

  const [activeLayerIds, setActiveLayerIds] = useState<Set<string>>(
    new Set(["my_location", "incidents", "roads", "infrastructure", "bridges"])
  );
  const [selectedSeverities, setSelectedSeverities] = useState<Set<IncidentSeverityType>>(new Set());

  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<MapIncidentItem | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // 1. Load Initial GIS Layers from Backend
  const loadMapData = async () => {
    try {
      const data = await MapService.loadInitialMapLayers();
      setIncidents(data.incidents);
      setRoads(data.roads);
      setInfrastructure(data.infrastructure);
      setLayers(data.layers);
      setIsOffline(false);
    } catch (err) {
      console.warn("[DriverMap] Backend fetch failed; entering offline mode", err);
      setIsOffline(true);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // 2. Start Live GPS Stream from device
  useEffect(() => {
    LocationService.startWatching(
      (telemetry) => {
        setGps(telemetry);
        setFreshness("LIVE");

        // Match current road and district
        RoadMatchingService.matchCurrentPosition(telemetry.latitude, telemetry.longitude).then((res) => {
          setMatchedRoadName(res.matched_road_name);
          if (res.district_name) setMatchedDistrictName(res.district_name);
        });
      },
      (err) => {
        console.warn("[DriverMap] GPS Error, falling back to simulated corridor fix", err);
        // Fallback default GPS coordinates around Sonapur
        setGps({
          latitude: 25.570,
          longitude: 91.880,
          accuracy: 5.0,
          speed: 40.0,
          heading: 145,
          timestamp: Date.now(),
        });
      },
      { highAccuracy: true }
    );

    return () => {
      LocationService.stopWatching();
    };
  }, []);

  // 3. Layer Toggle Handler
  const handleToggleLayer = (layerId: string) => {
    setActiveLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // 4. Severity Filter Handler
  const handleToggleSeverity = (sev: IncidentSeverityType) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
      } else {
        next.add(sev);
      }
      return next;
    });
  };

  // Filtered incidents based on active severity chips
  const filteredIncidents = incidents.filter((inc) => {
    if (selectedSeverities.size === 0) return true;
    return selectedSeverities.has(inc.severity);
  });

  // 5. Search Result Selection Handler
  const handleSelectSearchResult = (item: MapSearchItem) => {
    setIsFollowing(false);
    // Pan map to search item
    if (item.type === "INCIDENT") {
      const matchInc = incidents.find((i) => i.id === item.id);
      if (matchInc) setSelectedIncident(matchInc);
    }
  };

  // 6. Recenter Handler
  const handleRecenter = () => {
    setIsFollowing(true);
  };

  // 7. Toggle Simulation Mode
  const toggleSimulation = () => {
    if (isSimulating) {
      LocationService.stopWatching();
      setIsSimulating(false);
    } else {
      LocationService.startSimulatedDrive((telemetry) => {
        setGps(telemetry);
        setFreshness("LIVE");
        RoadMatchingService.matchCurrentPosition(telemetry.latitude, telemetry.longitude).then((res) => {
          setMatchedRoadName(res.matched_road_name);
          if (res.district_name) setMatchedDistrictName(res.district_name);
        });
      });
      setIsSimulating(true);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[650px] pb-16 sm:pb-0 flex flex-col">
      {/* Offline Banner */}
      <OfflineMapBanner isOffline={isOffline} cachedCount={incidents.length} className="mb-2" />

      {/* Top Floating Controls Grid */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="flex-1 pointer-events-auto">
            <MapSearch onSelectResult={handleSelectSearchResult} />
          </div>

          {/* Layer Control Dropdown */}
          <div className="pointer-events-auto">
            <MapLayerControl
              layers={layers}
              activeLayerIds={activeLayerIds}
              onToggleLayer={handleToggleLayer}
            />
          </div>

          {/* Simulation Toggle Button */}
          <button
            type="button"
            onClick={toggleSimulation}
            title={isSimulating ? "Stop GPS Route Simulation" : "Start Mountain Drive Simulator"}
            className={`pointer-events-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all border ${
              isSimulating
                ? "bg-purple-600 border-purple-400 text-white animate-pulse"
                : "bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-slate-300 shadow-slate-950/80"
            }`}
          >
            {isSimulating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        </div>

        {/* Severity Filters */}
        <div className="pointer-events-auto">
          <MapFilterPanel
            selectedSeverities={selectedSeverities}
            onToggleSeverity={handleToggleSeverity}
            onClearFilters={() => setSelectedSeverities(new Set())}
          />
        </div>
      </div>

      {/* Interactive Map Core Viewport */}
      <div className="flex-1 w-full h-full relative z-0">
        <DynamicMapContainer
          gps={gps}
          incidents={filteredIncidents}
          roads={roads}
          infrastructure={infrastructure}
          vehicles={vehicles}
          activeLayerIds={activeLayerIds}
          isFollowing={isFollowing}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          onUserPannedMap={() => setIsFollowing(false)}
        />
      </div>

      {/* Floating Recenter Action Button */}
      <div className="absolute bottom-24 right-4 z-20">
        <RecenterButton isFollowing={isFollowing} onRecenter={handleRecenter} />
      </div>

      {/* Bottom HUD: Status Indicator & Slide-up Incident Details */}
      <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto z-20 max-w-xl pointer-events-none space-y-2">
        {selectedIncident && (
          <div className="pointer-events-auto">
            <IncidentDetailsCard
              incident={selectedIncident}
              onClose={() => setSelectedIncident(null)}
              onViewAlternativeRoutes={(inc) => router.push("/dashboard/driver/route")}
            />
          </div>
        )}

        <div className="pointer-events-auto">
          <MapStatusIndicator
            gps={gps}
            freshness={freshness}
            matchedRoadName={matchedRoadName}
            matchedDistrictName={matchedDistrictName}
            isFollowing={isFollowing}
          />
        </div>
      </div>

      {/* Mobile-first bottom navigation */}
      <DriverBottomNav />
    </div>
  );
}
