"use client";

import React, { useEffect, useRef } from "react";
import { GpsTelemetry } from "@/services/locationService";
import { 
  MapIncidentItem, 
  MapRoadItem, 
  MapInfrastructureItem, 
  MapVehicleItem 
} from "../types/mapTypes";

interface MapContainerProps {
  gps?: GpsTelemetry | null;
  incidents: MapIncidentItem[];
  roads: MapRoadItem[];
  infrastructure: MapInfrastructureItem[];
  vehicles: MapVehicleItem[];
  activeLayerIds: Set<string>;
  isFollowing: boolean;
  selectedIncident: MapIncidentItem | null;
  onSelectIncident: (inc: MapIncidentItem | null) => void;
  onUserPannedMap: () => void;
  className?: string;
}

const ROAD_COLORS: Record<string, string> = {
  GREEN: "#10b981",  // emerald
  YELLOW: "#eab308", // yellow
  ORANGE: "#f97316", // orange
  RED: "#ef4444",    // red
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MODERATE: "#eab308",
  LOW: "#10b981",
};

export const MapContainer: React.FC<MapContainerProps> = ({
  gps,
  incidents,
  roads,
  infrastructure,
  vehicles,
  activeLayerIds,
  isFollowing,
  selectedIncident,
  onSelectIncident,
  onUserPannedMap,
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const incidentLayerGroupRef = useRef<any>(null);
  const roadLayerGroupRef = useRef<any>(null);
  const infraLayerGroupRef = useRef<any>(null);
  const vehicleLayerGroupRef = useRef<any>(null);

  // 1. Initialize Leaflet Map Instance on Client
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted) return;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const defaultLat = gps?.latitude || 25.570;
        const defaultLon = gps?.longitude || 91.880;

        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLon],
          zoom: 11,
          zoomControl: false,
        });

        // Add CartoDB Dark Matter / OSM Tile Layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> • Odisha MargDarshak GIS',
          maxZoom: 19,
        }).addTo(map);

        // Zoom Control in Bottom Right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Layer Groups
        roadLayerGroupRef.current = L.layerGroup().addTo(map);
        infraLayerGroupRef.current = L.layerGroup().addTo(map);
        incidentLayerGroupRef.current = L.layerGroup().addTo(map);
        vehicleLayerGroupRef.current = L.layerGroup().addTo(map);

        // Detect user manual pan
        map.on("dragstart", () => {
          onUserPannedMap();
        });

        mapInstanceRef.current = map;
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Driver Current Location Marker & Accuracy Halo
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const lat = gps?.latitude || 25.570;
      const lon = gps?.longitude || 91.880;
      const accuracy = gps?.accuracy || 5;

      if (activeLayerIds.has("my_location")) {
        // Create / Update Driver Icon
        const driverHtml = `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(59, 130, 246, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(37, 99, 235, 0.8);"></div>
          </div>
        `;
        const driverIcon = L.divIcon({
          html: driverHtml,
          className: "driver-live-gps-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        if (!driverMarkerRef.current) {
          driverMarkerRef.current = L.marker([lat, lon], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
        } else {
          driverMarkerRef.current.setLatLng([lat, lon]);
        }

        // Accuracy Halo Circle
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle([lat, lon], {
            radius: Math.max(accuracy, 10),
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
            weight: 1.5,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng([lat, lon]);
          accuracyCircleRef.current.setRadius(Math.max(accuracy, 10));
        }

        // Auto-center in Follow Mode
        if (isFollowing) {
          map.panTo([lat, lon], { animate: true, duration: 0.8 });
        }
      } else {
        if (driverMarkerRef.current) {
          map.removeLayer(driverMarkerRef.current);
          driverMarkerRef.current = null;
        }
        if (accuracyCircleRef.current) {
          map.removeLayer(accuracyCircleRef.current);
          accuracyCircleRef.current = null;
        }
      }
    });
  }, [gps, isFollowing, activeLayerIds]);

  // 3. Render Roads Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !roadLayerGroupRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      roadLayerGroupRef.current.clearLayers();
      if (!activeLayerIds.has("roads")) return;

      roads.forEach((road) => {
        const color = ROAD_COLORS[road.status] || "#10b981";
        // Coordinates in LineString are [[lon, lat], ...] -> convert to Leaflet [[lat, lon], ...]
        const latLngs: [number, number][] = road.coordinates.map((pt) => [pt[1], pt[0]] as [number, number]);
        
        const polyline = L.polyline(latLngs, {
          color: color,
          weight: road.status === "RED" ? 6 : (road.status === "ORANGE" ? 5 : 4),
          opacity: 0.85,
          dashArray: road.status === "RED" ? "8, 8" : undefined,
        });

        polyline.bindTooltip(
          `<strong>${road.road_number}</strong> (${road.road_name})<br/>Status: <span style="font-weight:bold; color:${color}">${road.status}</span>`,
          { sticky: true, className: "custom-gis-tooltip" }
        );

        roadLayerGroupRef.current.addLayer(polyline);
      });
    });
  }, [roads, activeLayerIds]);

  // 4. Render Incident Markers with Severity
  useEffect(() => {
    if (!mapInstanceRef.current || !incidentLayerGroupRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      incidentLayerGroupRef.current.clearLayers();
      if (!activeLayerIds.has("incidents")) return;

      incidents.forEach((inc) => {
        const color = SEVERITY_COLORS[inc.severity] || "#f97316";
        const isCritical = inc.severity === "CRITICAL";

        const iconHtml = `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${isCritical ? '<div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s infinite;"></div>' : ''}
            <div style="width: 26px; height: 26px; border-radius: 8px; background: ${color}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
              ⚠️
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "incident-map-marker",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon });
        marker.on("click", () => {
          onSelectIncident(inc);
        });

        incidentLayerGroupRef.current.addLayer(marker);
      });
    });
  }, [incidents, activeLayerIds, onSelectIncident]);

  // 5. Render Infrastructure Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !infraLayerGroupRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      infraLayerGroupRef.current.clearLayers();
      if (!activeLayerIds.has("infrastructure")) return;

      infrastructure.forEach((item) => {
        const emoji = item.type === "HOSPITAL" ? "🏥" : (item.type === "RELIEF_CENTER" ? "⛺" : (item.type === "FUEL_STATION" ? "⛽" : "🏢"));
        const iconHtml = `
          <div style="width: 26px; height: 26px; border-radius: 8px; background: #0f172a; border: 2px solid #a855f7; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.6); cursor: pointer;">
            ${emoji}
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "infra-map-marker",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([item.latitude, item.longitude], { icon });
        marker.bindTooltip(
          `<strong>${item.name}</strong><br/>${item.type.replace(/_/g, " ")} • ${item.capacity_metric || item.status}`,
          { sticky: true }
        );

        infraLayerGroupRef.current.addLayer(marker);
      });
    });
  }, [infrastructure, activeLayerIds]);

  // 6. Render Authorized Government Vehicle Fleet
  useEffect(() => {
    if (!mapInstanceRef.current || !vehicleLayerGroupRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      vehicleLayerGroupRef.current.clearLayers();
      if (!activeLayerIds.has("vehicles")) return;

      vehicles.forEach((veh) => {
        const iconHtml = `
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #0284c7; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
            🚚
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "vehicle-fleet-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([veh.latitude, veh.longitude], { icon });
        marker.bindTooltip(
          `<strong>${veh.vehicle_id}</strong> (${veh.driver_name})<br/>Speed: ${veh.speed_kmh} km/h • ${veh.freshness}`,
          { sticky: true }
        );

        vehicleLayerGroupRef.current.addLayer(marker);
      });
    });
  }, [vehicles, activeLayerIds]);

  return (
    <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
