"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { PlannedRoute, RouteType } from "../types/routingTypes";
import { Layers, Navigation, MapPin, Compass, AlertTriangle, CloudRain, Mountain, Droplets, Info } from "lucide-react";

interface Props {
  routes: PlannedRoute[];
  selectedRoute: PlannedRoute | null;
  onSelectRoute?: (route: PlannedRoute) => void;
  isNavigating?: boolean;
  navProgressPercent?: number;
  currentNavCoord?: [number, number] | null;
  onMapClickLocation?: (lat: number, lng: number) => void;
  simulatedRainfallMm?: number;
}

export const MapRouteLayer: React.FC<Props> = ({
  routes,
  selectedRoute,
  onSelectRoute,
  isNavigating = false,
  navProgressPercent = 0,
  currentNavCoord = null,
  onMapClickLocation,
  simulatedRainfallMm = 45,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const hazardMarkersRef = useRef<any[]>([]);
  const carMarkerRef = useRef<any>(null);

  const [mapStyle, setMapStyle] = useState<"LIGHT" | "SATELLITE" | "TERRAIN">("LIGHT");
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = require("leaflet");

    const map = L.map(mapContainerRef.current, {
      center: [25.80, 92.50],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
    });

    const tileUrls = {
      LIGHT: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      TERRAIN: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    };

    const tileLayer = L.tileLayer(tileUrls.LIGHT, {
      attribution: '&copy; OpenStreetMap contributors &amp; CARTO',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    map.on("click", (e: any) => {
      if (onMapClickLocation) {
        onMapClickLocation(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;
    (map as any)._tileLayer = tileLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on Map Style Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(map as any)._tileLayer) return;
    const L = require("leaflet");

    const tileUrls = {
      LIGHT: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      TERRAIN: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    };

    map.removeLayer((map as any)._tileLayer);
    const newLayer = L.tileLayer(tileUrls[mapStyle], {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    (map as any)._tileLayer = newLayer;
  }, [mapStyle]);

  // Update Route Polylines & Segment Risk Colors when routes change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = require("leaflet");

    // Clear existing route layers and markers
    polylinesRef.current.forEach((pl) => map.removeLayer(pl));
    polylinesRef.current = [];
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    hazardMarkersRef.current.forEach((m) => map.removeLayer(m));
    hazardMarkersRef.current = [];

    if (!routes || routes.length === 0) return;

    const allBounds = L.latLngBounds([]);

    // Render each candidate route with its individual risk-colored segments
    routes.forEach((route) => {
      try {
        const coords: number[][] = JSON.parse(route.geometry_geojson);
        const latLngs = coords.map((c) => [c[1], c[0]]);
        const isSelected = selectedRoute?.id === route.id;

        // If route has segments, draw multi-colored segments
        if (route.segments && route.segments.length > 0) {
          const segCount = route.segments.length;
          const pointsPerSeg = Math.max(2, Math.floor(latLngs.length / segCount));

          for (let i = 0; i < segCount; i++) {
            const seg = route.segments[i];
            const startIdx = i * (pointsPerSeg - 1);
            const endIdx = Math.min(latLngs.length - 1, startIdx + pointsPerSeg);
            const subLatLngs = latLngs.slice(startIdx, endIdx + 1);

            if (subLatLngs.length >= 2) {
              // Dynamically adjust risk based on simulated rainfall injection
              let effectiveStatus = seg.status;
              if (simulatedRainfallMm > 80 && seg.status === "YELLOW") effectiveStatus = "ORANGE";
              if (simulatedRainfallMm > 110 && seg.status === "ORANGE") effectiveStatus = "RED";

              const segColor =
                effectiveStatus === "RED"
                  ? "#EF4444"
                  : effectiveStatus === "ORANGE"
                  ? "#EA580C"
                  : effectiveStatus === "YELLOW"
                  ? "#F59E0B"
                  : "#10B981";

              const weight = isSelected ? 7 : 4;
              const opacity = isSelected ? 0.95 : 0.45;
              const dashArray = isSelected ? undefined : "6, 8";

              const subPoly = L.polyline(subLatLngs, {
                color: segColor,
                weight: weight,
                opacity: opacity,
                dashArray: dashArray,
                lineJoin: "round",
              }).addTo(map);

              subPoly.bindTooltip(
                `<div style="font-family: sans-serif; font-size: 11px;">
                  <b>${route.route_type}</b>: ${seg.road_name}<br/>
                  <b>AI Predicted Status:</b> <span style="color:${segColor}; font-weight:800;">${effectiveStatus}</span><br/>
                  <b>Distance:</b> ${seg.distance_km} km | <b>Risk Score:</b> ${route.risk_score}/100<br/>
                  ${seg.incident_description ? `⚠️ <i>${seg.incident_description}</i>` : ""}
                </div>`,
                { sticky: true }
              );

              subPoly.on("click", () => {
                if (onSelectRoute) onSelectRoute(route);
              });

              polylinesRef.current.push(subPoly);

              // If this segment has a severe hazard, place a hazard alert pin
              if ((effectiveStatus === "RED" || effectiveStatus === "ORANGE") && isSelected && i === 1) {
                const midPt = subLatLngs[Math.floor(subLatLngs.length / 2)];
                const hazardIcon = L.divIcon({
                  className: "custom-div-icon",
                  html: `<div style="background-color: #EF4444; color: white; width: 26px; height: 26px; border-radius: 50%; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold;">⚠️</div>`,
                  iconSize: [26, 26],
                  iconAnchor: [13, 13],
                });
                const hMarker = L.marker(midPt, { icon: hazardIcon })
                  .addTo(map)
                  .bindPopup(
                    `<b>⚠️ AI Landslide & Flood Hazard Alert</b><br/>${seg.road_name}<br/><i>${seg.incident_description || "High slope instability & heavy rainfall saturation"}</i>`
                  );
                hazardMarkersRef.current.push(hMarker);
              }
            }
          }
        } else {
          // Fallback single polyline
          const isRec = route.route_type === RouteType.RECOMMENDED;
          const strokeColor = isRec ? "#10B981" : route.risk_score > 40 ? "#EA580C" : "#0284C7";
          const polyline = L.polyline(latLngs, {
            color: strokeColor,
            weight: isSelected ? 6 : 4,
            opacity: isSelected ? 0.95 : 0.45,
            dashArray: isSelected ? undefined : "6, 8",
            lineJoin: "round",
          }).addTo(map);

          polyline.bindTooltip(
            `<b>${route.route_type}</b>: ${route.distance_km} km<br/>Risk Score: ${route.risk_score}/100 (${route.risk_level})`,
            { sticky: true }
          );

          polyline.on("click", () => {
            if (onSelectRoute) onSelectRoute(route);
          });

          polylinesRef.current.push(polyline);
        }

        if (isSelected) {
          latLngs.forEach((ll: any) => allBounds.extend(ll));
        }
      } catch (err) {
        console.warn("Failed to parse route coordinates", err);
      }
    });

    // Add Start (Origin A) and End (Destination B) Markers
    const activeRoute = selectedRoute || routes[0];
    if (activeRoute) {
      try {
        const coords: number[][] = JSON.parse(activeRoute.geometry_geojson);
        if (coords.length > 0) {
          const startPt = [coords[0][1], coords[0][0]];
          const endPt = [coords[coords.length - 1][1], coords[coords.length - 1][0]];

          // Start Marker (A - Emerald Green)
          const startIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: #10B981; color: white; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">A</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const startMarker = L.marker(startPt, { icon: startIcon })
            .addTo(map)
            .bindPopup(`<b>Starting Point (Origin):</b><br/>${activeRoute.origin_name}`);
          markersRef.current.push(startMarker);

          // End Marker (B - Crimson Red)
          const endIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: #EF4444; color: white; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">B</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const endMarker = L.marker(endPt, { icon: endIcon })
            .addTo(map)
            .bindPopup(`<b>Destination Terminal:</b><br/>${activeRoute.destination_name}`);
          markersRef.current.push(endMarker);

          allBounds.extend(startPt);
          allBounds.extend(endPt);
        }
      } catch {}
    }

    if (allBounds.isValid() && !isNavigating) {
      map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [routes, selectedRoute, onSelectRoute, isNavigating, simulatedRainfallMm]);

  // Handle Live Car Marker in Navigation Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = require("leaflet");

    if (carMarkerRef.current) {
      map.removeLayer(carMarkerRef.current);
      carMarkerRef.current = null;
    }

    if (isNavigating && currentNavCoord) {
      const carIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #1E293B; color: white; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #10B981; box-shadow: 0 4px 14px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚗</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const carMarker = L.marker(currentNavCoord, { icon: carIcon }).addTo(map);
      carMarkerRef.current = carMarker;
      map.panTo(currentNavCoord, { animate: true, duration: 0.5 });
    }
  }, [isNavigating, currentNavCoord]);

  const activeRoute = selectedRoute || routes[0];

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100 font-sans">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Layer Selector Top Left */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-stone-200 shadow-xs flex items-center gap-1 text-[11px] font-semibold text-stone-700">
        <button
          type="button"
          onClick={() => setMapStyle("LIGHT")}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            mapStyle === "LIGHT" ? "bg-emerald-800 text-white font-bold" : "hover:bg-stone-100"
          }`}
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => setMapStyle("TERRAIN")}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            mapStyle === "TERRAIN" ? "bg-emerald-800 text-white font-bold" : "hover:bg-stone-100"
          }`}
        >
          Terrain
        </button>
        <button
          type="button"
          onClick={() => setMapStyle("SATELLITE")}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            mapStyle === "SATELLITE" ? "bg-emerald-800 text-white font-bold" : "hover:bg-stone-100"
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Top Right AI Model Explainability Card */}
      {activeRoute && (
        <div className="absolute top-3 right-3 z-10 max-w-[280px] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 shadow-md text-xs space-y-2 text-stone-900 hidden sm:block">
          <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
            <div className="font-bold text-[11px] flex items-center gap-1.5 text-stone-900">
              <Mountain className="w-3.5 h-3.5 text-emerald-800" />
              <span>AI Risk Model Predictors</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
              HistGradientBoosting
            </span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-stone-600">
                <CloudRain className="w-3 h-3 text-blue-600" /> Precipitation (IMD)
              </span>
              <span className="font-mono font-bold text-stone-900">{simulatedRainfallMm} mm / 24h</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-stone-600">
                <Mountain className="w-3 h-3 text-amber-700" /> Mountain Slope Angle
              </span>
              <span className="font-mono font-bold text-stone-900">32.4° Incline</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-stone-600">
                <Droplets className="w-3 h-3 text-cyan-600" /> Soil Saturation Index
              </span>
              <span className="font-mono font-bold text-stone-900">
                {Math.min(98, Math.round(simulatedRainfallMm * 0.75 + 20))}% Saturated
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              <span className="font-bold text-stone-700">Predicted Landslide Risk</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                activeRoute.risk_score < 25
                  ? "bg-emerald-100 text-emerald-900"
                  : activeRoute.risk_score < 50
                  ? "bg-amber-100 text-amber-900"
                  : "bg-rose-100 text-rose-900"
              }`}>
                {activeRoute.risk_score}/100 ({activeRoute.risk_level})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Google-Maps-Style Risk Legend Bottom Left */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-stone-200 shadow-md text-xs space-y-1.5 text-stone-800">
        <div className="font-bold text-stone-900 flex items-center gap-1.5 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-emerald-800" />
          <span>AI Road Risk Color Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-emerald-500 rounded-full" />
            <span>Green: Low Risk (&lt;25%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-amber-500 rounded-full" />
            <span>Yellow: Rain Caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-orange-500 rounded-full" />
            <span>Orange: Mud &amp; Slush</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-rose-500 rounded-full" />
            <span>Red: Active Landslide</span>
          </div>
        </div>
      </div>
    </div>
  );
};
