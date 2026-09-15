"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlannedRoute, RouteType, LogisticsHub } from "../types/routingTypes";
import { RoutingService, NavigationStep } from "../services/routingService";
import { routingApi } from "../api/routingApi";
import { LocationSearch } from "../components/LocationSearch";
import { MapRouteLayer } from "../components/MapRouteLayer";
import { RouteCard } from "../components/RouteCard";
import { RouteComparison } from "../components/RouteComparison";
import { RouteSummary } from "../components/RouteSummary";
import { TurnByTurnNavigationHUD } from "../components/TurnByTurnNavigationHUD";
import { RouteRiskSummaryCard } from "@/features/risk/components/RouteRiskSummaryCard";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { OfflineNotice } from "@/components/driver/OfflineNotice";
import {
  ArrowLeft,
  RefreshCw,
  Compass,
  Map as MapIcon,
  TableProperties,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Play,
  Navigation as NavigationIcon,
  CloudRain,
  Brain,
  Sliders,
  Sparkles
} from "lucide-react";

export const RoutePlanningScreen: React.FC = () => {
  const [origin, setOrigin] = useState<string>("Guwahati Central Logistic Terminal, Assam");
  const [destination, setDestination] = useState<string>("Silchar Food & Medical Depot, Assam");
  const [originHub, setOriginHub] = useState<LogisticsHub | undefined>(undefined);
  const [destinationHub, setDestinationHub] = useState<LogisticsHub | undefined>(undefined);
  const [priority, setPriority] = useState<"ESSENTIAL_SAFETY" | "BALANCED_LOGISTICS" | "FASTEST_TRANSIT">("ESSENTIAL_SAFETY");
  
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<PlannedRoute | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"MAP" | "COMPARISON" | "DETAILS">("MAP");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time AI Rainfall Prediction Injection Slider (0 to 150 mm)
  const [simulatedRainfallMm, setSimulatedRainfallMm] = useState<number>(45);

  // Turn-by-turn Navigation Simulation state
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navSteps, setNavSteps] = useState<NavigationStep[]>([]);
  const [currentNavCoord, setCurrentNavCoord] = useState<[number, number] | null>(null);
  const [navProgressPercent, setNavProgressPercent] = useState<number>(0);

  const handleCalculateRoutes = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const candidates = await RoutingService.calculateCandidateRoutes({
        origin_name: origin,
        destination_name: destination,
        origin_latitude: originHub?.latitude,
        origin_longitude: originHub?.longitude,
        destination_latitude: destinationHub?.latitude,
        destination_longitude: destinationHub?.longitude,
        mission_priority: priority,
      });

      setRoutes(candidates);
      if (candidates.length > 0) {
        setSelectedRoute(candidates[0]); // Default to Recommended
        setNavSteps(RoutingService.generateNavigationSteps(candidates[0]));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to calculate candidate routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculateRoutes();
  }, []);

  const handleUseLiveGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOrigin("Live Driver GPS Position");
          setOriginHub({
            id: "GPS_LIVE",
            name: "Live Driver GPS Position",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          setOrigin("Guwahati Central Logistic Terminal, Assam");
        }
      );
    }
  };

  const handleStartNavigation = (route: PlannedRoute) => {
    setSelectedRoute(route);
    const steps = RoutingService.generateNavigationSteps(route);
    setNavSteps(steps);
    setIsNavigating(true);
    setActiveTab("MAP");
  };

  const handleMapClickLocation = (lat: number, lng: number) => {
    if (!destination || destination.includes("Silchar")) {
      setDestination(`Selected Map Destination (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
      setDestinationHub({
        id: "CUSTOM_DEST",
        name: `Selected Map Destination (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        latitude: lat,
        longitude: lng,
      });
    } else {
      setOrigin(`Selected Map Origin (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
      setOriginHub({
        id: "CUSTOM_ORIG",
        name: `Selected Map Origin (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const handleActivateTripRoute = async (route: PlannedRoute) => {
    setActivating(true);
    setSuccessMessage(null);
    try {
      await routingApi.selectRoute(route.id);
      setRoutes((prev) =>
        prev.map((r) => ({
          ...r,
          is_selected: r.id === route.id,
        }))
      );
      setSelectedRoute({ ...route, is_selected: true });
      setSuccessMessage(`Activated ${route.route_type} corridor for your active trip dispatch!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setRoutes((prev) =>
        prev.map((r) => ({
          ...r,
          is_selected: r.id === route.id,
        }))
      );
      setSelectedRoute({ ...route, is_selected: true });
      setSuccessMessage(`Selected ${route.route_type} corridor.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/60 text-stone-900 flex flex-col pb-24 font-sans">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/driver"
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-stone-900">Google Map Route & AI Risk Navigator</h1>
              <span className="text-[10px] text-emerald-900 font-bold px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200">
                Landslide & Flood AI Model
              </span>
            </div>
            <p className="text-[11px] text-stone-500">Real-time risk color-coding & turn-by-turn navigation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedRoute && !isNavigating && (
            <button
              type="button"
              onClick={() => handleStartNavigation(selectedRoute)}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Navigation</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCalculateRoutes}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="Recalculate Routes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-800" : ""}`} />
          </button>
        </div>
      </header>

      <OfflineNotice />

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center gap-2 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Origin/Destination Search Box */}
        <LocationSearch
          origin={origin}
          destination={destination}
          onOriginChange={(val, hub) => {
            setOrigin(val);
            setOriginHub(hub);
          }}
          onDestinationChange={(val, hub) => {
            setDestination(val);
            setDestinationHub(hub);
          }}
          onUseLiveGps={handleUseLiveGps}
          onCalculate={handleCalculateRoutes}
          loading={loading}
          priority={priority}
          onPriorityChange={setPriority}
        />

        {/* Real-time AI Rainfall / Weather Risk Simulation Slider */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900">
                  Live Monsoon Rainfall & Flood Risk Simulation Slider
                </h3>
                <p className="text-[10px] text-stone-500">
                  Drag slider to inject precipitation and watch the ML Model dynamically update road segment risk colors in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-stone-500">Current Rainfall:</span>
              <span className={`px-2.5 py-0.5 rounded-lg font-bold ${
                simulatedRainfallMm > 90
                  ? "bg-rose-100 text-rose-900 border border-rose-300"
                  : simulatedRainfallMm > 50
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}>
                {simulatedRainfallMm} mm / 24h {simulatedRainfallMm > 90 ? "(Torrential Storm)" : simulatedRainfallMm > 50 ? "(Heavy Rain)" : "(Normal / Moderate)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <span className="text-[11px] font-bold text-stone-400">0 mm (Clear)</span>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={simulatedRainfallMm}
              onChange={(e) => setSimulatedRainfallMm(Number(e.target.value))}
              className="flex-1 accent-emerald-700 cursor-pointer h-2 bg-stone-200 rounded-lg"
            />
            <span className="text-[11px] font-bold text-rose-600">150 mm (Cloudburst)</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        {routes.length > 0 && (
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("MAP")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "MAP"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>GIS Navigation Map</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("COMPARISON")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "COMPARISON"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Route Risk Comparison</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("DETAILS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "DETAILS"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Turn Steps & Legs</span>
              </button>
            </div>

            <span className="text-[11px] text-stone-500 font-medium hidden sm:block">
              {routes.length} Route Alternatives Generated
            </span>
          </div>
        )}

        {/* Tab 1: GIS Map View */}
        {activeTab === "MAP" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Map Column */}
            <div className="lg:col-span-7 h-[460px] lg:h-[600px] relative">
              <MapRouteLayer
                routes={routes}
                selectedRoute={selectedRoute}
                onSelectRoute={(r) => {
                  setSelectedRoute(r);
                  setNavSteps(RoutingService.generateNavigationSteps(r));
                }}
                isNavigating={isNavigating}
                navProgressPercent={navProgressPercent}
                currentNavCoord={currentNavCoord}
                onMapClickLocation={handleMapClickLocation}
                simulatedRainfallMm={simulatedRainfallMm}
              />

              {/* Turn by Turn HUD Overlay */}
              {isNavigating && selectedRoute && (
                <TurnByTurnNavigationHUD
                  route={selectedRoute}
                  steps={navSteps}
                  onClose={() => setIsNavigating(false)}
                  onReroute={handleCalculateRoutes}
                  onStepProgressChange={(pct, coord) => {
                    setNavProgressPercent(pct);
                    setCurrentNavCoord(coord);
                  }}
                />
              )}
            </div>

            {/* Candidate Cards Column */}
            <div className="lg:col-span-5 space-y-3 overflow-y-auto max-h-[600px] no-scrollbar">
              {routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isSelected={selectedRoute?.id === route.id}
                  onSelect={(r) => {
                    setSelectedRoute(r);
                    setNavSteps(RoutingService.generateNavigationSteps(r));
                    handleActivateTripRoute(r);
                  }}
                  onStartNavigation={(r) => handleStartNavigation(r)}
                  onViewDetails={(r) => {
                    setSelectedRoute(r);
                    setNavSteps(RoutingService.generateNavigationSteps(r));
                    setActiveTab("DETAILS");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Route Comparison Table */}
        {activeTab === "COMPARISON" && (
          <div className="space-y-4">
            <RouteComparison
              routes={routes}
              selectedRouteId={selectedRoute?.id || null}
              onSelectRoute={(r) => {
                setSelectedRoute(r);
                setNavSteps(RoutingService.generateNavigationSteps(r));
                handleActivateTripRoute(r);
              }}
            />
            <RouteSummary
              route={selectedRoute}
              onActivateTripRoute={handleActivateTripRoute}
              activating={activating}
            />
          </div>
        )}

        {/* Tab 3: Detailed Legs & Corridor Advisory */}
        {activeTab === "DETAILS" && selectedRoute && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <NavigationIcon className="w-5 h-5 text-emerald-800" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Turn-by-Turn Driving Steps ({navSteps.length} Steps)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNavigation(selectedRoute)}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Live GPS Navigation</span>
                </button>
              </div>

              <div className="space-y-2">
                {navSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-stone-900">{step.instruction}</div>
                        <div className="text-[10px] text-stone-500 font-medium">{step.roadName}</div>
                        {step.hazardWarning && (
                          <div className="mt-1 text-[11px] text-amber-900 font-semibold bg-amber-50 p-1 rounded border border-amber-200">
                            {step.hazardWarning}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-stone-700 shrink-0">
                      {step.distanceKm} km
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <RouteRiskSummaryCard routeId={selectedRoute.id} />
            <RouteSummary
              route={selectedRoute}
              onActivateTripRoute={handleActivateTripRoute}
              activating={activating}
            />
          </div>
        )}
      </main>

      <DriverBottomNav />
    </div>
  );
};
