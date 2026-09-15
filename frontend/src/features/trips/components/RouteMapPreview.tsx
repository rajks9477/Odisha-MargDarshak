'use client';

import React, { useEffect, useRef } from 'react';
import { TripRouteGeometry } from '../types/tripTypes';
import { GpsTelemetry } from '@/services/locationService';

interface RouteMapPreviewProps {
  route: TripRouteGeometry;
  gps?: GpsTelemetry | null;
  className?: string;
}

export default function RouteMapPreview({
  route,
  gps,
  className = 'h-72 w-full rounded-2xl overflow-hidden border border-slate-800',
}: RouteMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const startLat = route.coordinates[0]?.[1] || 26.18;
        const startLng = route.coordinates[0]?.[0] || 91.73;

        const map = L.map(mapContainerRef.current, {
          center: [startLat, startLng],
          zoom: 9,
          zoomControl: false,
          attributionControl: false,
        });

        // Dark matter tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Draw Route Polyline
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
      }

      const latLngs = route.coordinates.map((c) => [c[1], c[0]] as [number, number]);

      if (latLngs.length > 0) {
        const polyline = L.polyline(latLngs, {
          color: '#06b6d4', // Cyan glowing route line
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);

        // Add Origin & Destination markers
        const originLatLon = latLngs[0];
        const destLatLon = latLngs[latLngs.length - 1];

        const originIcon = L.divIcon({
          className: 'origin-marker',
          html: `<div style="background-color: #10b981; color: white; font-weight: bold; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">A</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const destIcon = L.divIcon({
          className: 'dest-marker',
          html: `<div style="background-color: #ef4444; color: white; font-weight: bold; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">B</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker(originLatLon, { icon: originIcon }).bindPopup(`<b>Origin Depot:</b> ${route.origin_name}`).addTo(map);
        L.marker(destLatLon, { icon: destIcon }).bindPopup(`<b>Destination Depot:</b> ${route.destination_name}`).addTo(map);

        routeLayerRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
      }

      // Update Driver Live GPS Marker
      if (gps) {
        if (!driverMarkerRef.current) {
          const driverIcon = L.divIcon({
            className: 'driver-live-marker',
            html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px #3b82f6;"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          driverMarkerRef.current = L.marker([gps.latitude, gps.longitude], { icon: driverIcon }).addTo(map);
        } else {
          driverMarkerRef.current.setLatLng([gps.latitude, gps.longitude]);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [route, gps]);

  return <div ref={mapContainerRef} className={className} />;
}
