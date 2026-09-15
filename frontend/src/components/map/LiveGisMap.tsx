"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { 
  RoadFeature, 
  BridgeFeature, 
  DistrictFeature, 
  IncidentFeature, 
  RoadDetail 
} from "@/services/gisService";
import { GpsTelemetry } from "@/services/locationService";
import { ActiveLayers } from "./MapLayerControl";

interface LiveGisMapProps {
  roads: RoadFeature[];
  bridges: BridgeFeature[];
  districts: DistrictFeature[];
  incidents: IncidentFeature[];
  driverGps: GpsTelemetry | null;
  activeLayers: ActiveLayers;
  onSelectRoad: (road: RoadFeature) => void;
  selectedRoadId?: string | null;
}

export const LiveGisMap: React.FC<LiveGisMapProps> = ({
  roads,
  bridges,
  districts,
  incidents,
  driverGps,
  activeLayers,
  onSelectRoad,
  selectedRoadId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<{
    roads?: any;
    bridges?: any;
    districts?: any;
    incidents?: any;
    driverMarker?: any;
    driverAccuracyCircle?: any;
  }>({});

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Dynamic import to prevent SSR issues
    const L = require("leaflet");

    // Center on North East (Shillong / Guwahati region)
    const map = L.map(mapContainerRef.current, {
      center: [25.57, 91.88],
      zoom: 8,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
    });

    // Add High-Contrast CartoDB Dark Matter Base Tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Zoom Controls top-left
    L.control.zoom({ position: "topleft" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update District Boundaries Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = require("leaflet");
    const map = mapInstanceRef.current;

    if (layersGroupRef.current.districts) {
      map.removeLayer(layersGroupRef.current.districts);
      layersGroupRef.current.districts = undefined;
    }

    if (activeLayers.districts && districts.length > 0) {
      const group = L.featureGroup();
      districts.forEach((dist) => {
        if (!dist.polygon || dist.polygon.length === 0) return;
        // Swap [lon, lat] to [lat, lon] for Leaflet
        const latLngs = dist.polygon[0].map(([lon, lat]) => [lat, lon]);
        const polygon = L.polygon(latLngs, {
          color: "#3b82f6",
          weight: 1.5,
          opacity: 0.4,
          fillColor: "#1e3a8a",
          fillOpacity: 0.08,
          dashArray: "4, 4",
        });
        polygon.bindTooltip(`<strong>${dist.district_name}</strong><br/>${dist.state}`, {
          sticky: true,
          className: "leaflet-dark-tooltip",
        });
        polygon.addTo(group);
      });
      group.addTo(map);
      layersGroupRef.current.districts = group;
    }
  }, [districts, activeLayers.districts]);

  // Update Roads Layer with 4-Tier Color Coding
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = require("leaflet");
    const map = mapInstanceRef.current;

    if (layersGroupRef.current.roads) {
      map.removeLayer(layersGroupRef.current.roads);
      layersGroupRef.current.roads = undefined;
    }

    if (activeLayers.roads && roads.length > 0) {
      const group = L.featureGroup();

      const getRoadColor = (status: string) => {
        switch (status) {
          case "GREEN": return "#10b981";  // Accessible (Emerald)
          case "YELLOW": return "#f59e0b"; // Caution (Amber)
          case "ORANGE": return "#f97316"; // Major Disruption (Deep Orange)
          case "RED": return "#ef4444";    // Blocked (Crimson)
          default: return "#64748b";
        }
      };

      roads.forEach((road) => {
        if (!road.coordinates || road.coordinates.length < 2) return;
        // Swap [lon, lat] to [lat, lon]
        const latLngs = road.coordinates.map(([lon, lat]) => [lat, lon]);
        const isSelected = selectedRoadId === road.id;
        const color = getRoadColor(road.status);

        const polyline = L.polyline(latLngs, {
          color: color,
          weight: isSelected ? 8 : road.status === "RED" ? 6 : 5,
          opacity: isSelected ? 1.0 : 0.85,
          dashArray: road.status === "RED" ? "6, 6" : undefined,
          lineJoin: "round",
          lineCap: "round",
        });

        // Hover effect
        polyline.on("mouseover", () => {
          polyline.setStyle({ weight: 8, opacity: 1.0 });
        });
        polyline.on("mouseout", () => {
          if (selectedRoadId !== road.id) {
            polyline.setStyle({ weight: road.status === "RED" ? 6 : 5, opacity: 0.85 });
          }
        });

        // Tap / Click handler
        polyline.on("click", () => {
          onSelectRoad(road);
        });

        polyline.bindTooltip(`
          <div style="font-size: 11px;">
            <strong>${road.road_number}: ${road.road_name}</strong><br/>
            Status: <span style="font-weight: bold; color: ${color};">${road.status}</span>
          </div>
        `, { sticky: true, className: "leaflet-dark-tooltip" });

        polyline.addTo(group);
      });

      group.addTo(map);
      layersGroupRef.current.roads = group;
    }
  }, [roads, activeLayers.roads, selectedRoadId, onSelectRoad]);

  // Update Bridges Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = require("leaflet");
    const map = mapInstanceRef.current;

    if (layersGroupRef.current.bridges) {
      map.removeLayer(layersGroupRef.current.bridges);
      layersGroupRef.current.bridges = undefined;
    }

    if (activeLayers.bridges && bridges.length > 0) {
      const group = L.featureGroup();

      bridges.forEach((brg) => {
        const bridgeIcon = L.divIcon({
          className: "custom-gis-bridge-icon",
          html: `
            <div style="
              background: #0f172a;
              border: 2px solid ${brg.status === 'ORANGE' ? '#f97316' : '#10b981'};
              color: #f8fafc;
              border-radius: 8px;
              padding: 2px 5px;
              font-size: 9px;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 3px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
              white-space: nowrap;
            ">
              🌉 ${brg.capacity_tonnes}T
            </div>
          `,
          iconSize: [46, 20],
          iconAnchor: [23, 10],
        });

        const marker = L.marker([brg.latitude, brg.longitude], { icon: bridgeIcon });
        marker.bindPopup(`
          <div style="color: #0f172a; font-size: 12px; line-height: 1.4;">
            <strong>${brg.bridge_name}</strong><br/>
            Capacity: <strong>${brg.capacity_tonnes} Tonnes</strong><br/>
            Status: <strong>${brg.status}</strong><br/>
            District: ${brg.district_name}, ${brg.state}
          </div>
        `);
        marker.addTo(group);
      });

      group.addTo(map);
      layersGroupRef.current.bridges = group;
    }
  }, [bridges, activeLayers.bridges]);

  // Update Incidents Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = require("leaflet");
    const map = mapInstanceRef.current;

    if (layersGroupRef.current.incidents) {
      map.removeLayer(layersGroupRef.current.incidents);
      layersGroupRef.current.incidents = undefined;
    }

    if (activeLayers.incidents && incidents.length > 0) {
      const group = L.featureGroup();

      incidents.forEach((inc) => {
        const isCritical = inc.severity === "CRITICAL";
        const incidentIcon = L.divIcon({
          className: "custom-gis-incident-icon",
          html: `
            <div style="
              position: relative;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 9999px;
                background-color: ${isCritical ? '#f43f5e' : '#f59e0b'};
                opacity: 0.75;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></span>
              <div style="
                position: relative;
                width: 22px;
                height: 22px;
                border-radius: 9999px;
                background-color: #0f172a;
                border: 2px solid ${isCritical ? '#f43f5e' : '#f59e0b'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
              ">
                ⚠️
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: incidentIcon });
        marker.bindPopup(`
          <div style="color: #0f172a; font-size: 12px; line-height: 1.4;">
            <strong style="color: #e11d48;">${inc.incident_type} (${inc.severity})</strong><br/>
            <strong>${inc.road_name}</strong><br/>
            ${inc.description}<br/>
            <small>Status: ${inc.status}</small>
          </div>
        `);
        marker.addTo(group);
      });

      group.addTo(map);
      layersGroupRef.current.incidents = group;
    }
  }, [incidents, activeLayers.incidents]);

  // Update Driver GPS "My Location" Marker & Accuracy Halo
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = require("leaflet");
    const map = mapInstanceRef.current;

    // Clear previous
    if (layersGroupRef.current.driverMarker) {
      map.removeLayer(layersGroupRef.current.driverMarker);
      layersGroupRef.current.driverMarker = undefined;
    }
    if (layersGroupRef.current.driverAccuracyCircle) {
      map.removeLayer(layersGroupRef.current.driverAccuracyCircle);
      layersGroupRef.current.driverAccuracyCircle = undefined;
    }

    if (activeLayers.myLocation && driverGps) {
      const { latitude, longitude, accuracy, heading, speed } = driverGps;

      // Accuracy Halo Circle
      const accuracyCircle = L.circle([latitude, longitude], {
        radius: Math.max(accuracy, 10),
        color: "#38bdf8",
        weight: 1,
        fillColor: "#0284c7",
        fillOpacity: 0.15,
      }).addTo(map);
      layersGroupRef.current.driverAccuracyCircle = accuracyCircle;

      // Pulse Marker with Heading Arrow
      const driverIcon = L.divIcon({
        className: "custom-gis-driver-marker",
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 9999px;
              background-color: #38bdf8;
              opacity: 0.6;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <div style="
              position: relative;
              width: 24px;
              height: 24px;
              border-radius: 9999px;
              background-color: #0284c7;
              border: 2.5px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
              transform: rotate(${heading || 0}deg);
            ">
              <span style="
                width: 0; 
                height: 0; 
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-bottom: 7px solid #ffffff;
              "></span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([latitude, longitude], { icon: driverIcon, zIndexOffset: 1000 });
      marker.bindPopup(`
        <div style="color: #0f172a; font-size: 12px; line-height: 1.4;">
          <strong>My Vehicle Position</strong><br/>
          Accuracy: <strong>±${Math.round(accuracy)}m</strong><br/>
          Speed: <strong>${Math.round(speed || 0)} km/h</strong><br/>
          Heading: <strong>${Math.round(heading || 0)}°</strong>
        </div>
      `);
      marker.addTo(map);
      layersGroupRef.current.driverMarker = marker;
    }
  }, [driverGps, activeLayers.myLocation]);

  return (
    <div className="relative w-full h-[calc(100vh-210px)] sm:h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
