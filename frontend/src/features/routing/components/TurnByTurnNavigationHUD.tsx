"use client";

import React, { useState, useEffect } from "react";
import { PlannedRoute } from "../types/routingTypes";
import { NavigationStep } from "../services/routingService";
import {
  Navigation,
  Volume2,
  VolumeX,
  X,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Flame,
  Radio
} from "lucide-react";

interface Props {
  route: PlannedRoute;
  steps: NavigationStep[];
  onClose: () => void;
  onReroute: () => void;
  onStepProgressChange?: (progressPercent: number, currentCoord: [number, number], isSuddenHazard?: boolean) => void;
}

export const TurnByTurnNavigationHUD: React.FC<Props> = ({
  route,
  steps,
  onClose,
  onReroute,
  onStepProgressChange,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speedKmh, setSpeedKmh] = useState(48);
  const [progressPercent, setProgressPercent] = useState(0);
  const [suddenHazardActive, setSuddenHazardActive] = useState<boolean>(false);

  let coords: [number, number][] = [];
  try {
    const raw = JSON.parse(route.geometry_geojson);
    coords = raw.map((c: number[]) => [c[1], c[0]]); // [lat, lon]
  } catch {}

  const currentStep = steps[currentStepIndex] || steps[0];

  // Text to Speech Voice Guidance
  const speakInstruction = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentStep && !suddenHazardActive) {
      speakInstruction(currentStep.instruction);
    }
  }, [currentStepIndex, voiceEnabled, suddenHazardActive]);

  // Simulation Timer
  useEffect(() => {
    if (!isPlaying || coords.length === 0) return;

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        const next = prev + 1.2;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }

        // Calculate current step based on progress
        const stepIdx = Math.min(
          steps.length - 1,
          Math.floor((next / 100) * steps.length)
        );
        setCurrentStepIndex(stepIdx);

        // Interpolate coordinate along polyline
        const coordIdx = Math.min(
          coords.length - 1,
          Math.floor((next / 100) * coords.length)
        );
        if (coords[coordIdx] && onStepProgressChange) {
          onStepProgressChange(next, coords[coordIdx], suddenHazardActive);
        }

        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isPlaying, coords, steps, onStepProgressChange, suddenHazardActive]);

  // Trigger Sudden Incident Simulation
  const handleTriggerSuddenHazard = () => {
    setSuddenHazardActive(true);
    setSpeedKmh(22);
    const alertVoice = "URGENT ALERT DRIVER! Sudden Landslide and mudflow detected 2.8 kilometers ahead on your corridor. Road color turned to CRITICAL RED. Tap Reroute now to divert onto safe valley bypass!";
    speakInstruction(alertVoice);

    if (onStepProgressChange && coords.length > 0) {
      const coordIdx = Math.min(coords.length - 1, Math.floor((progressPercent / 100) * coords.length));
      onStepProgressChange(progressPercent, coords[coordIdx], true);
    }
  };

  return (
    <div className="absolute inset-x-3 top-3 z-30 flex flex-col gap-2 font-sans pointer-events-none">
      {/* 1. Main Top Turn Navigation Banner */}
      <div className={`p-4 rounded-2xl text-white shadow-xl backdrop-blur-md pointer-events-auto border transition-all ${
        suddenHazardActive 
          ? "bg-rose-950/95 border-rose-500 shadow-rose-950/50 animate-pulse" 
          : "bg-emerald-950/95 border-emerald-700/80 shadow-emerald-950/50"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
              suddenHazardActive
                ? "bg-rose-600 border-rose-300 text-white"
                : "bg-emerald-800 border-emerald-600 text-emerald-100"
            }`}>
              {suddenHazardActive ? (
                <AlertTriangle className="w-7 h-7 text-white" />
              ) : (
                <Navigation className="w-7 h-7 text-white rotate-45" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  suddenHazardActive
                    ? "bg-rose-800 text-rose-100 border border-rose-400"
                    : "bg-emerald-900 text-emerald-200 border border-emerald-700"
                }`}>
                  {suddenHazardActive ? "🚨 SUDDEN HAZARD DETECTED" : "IN-TRANSIT NAVIGATION"}
                </span>
                <span className="text-xs text-stone-300">
                  {Math.round((1 - progressPercent / 100) * route.distance_km)} km remaining
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                {suddenHazardActive 
                  ? "CRITICAL RED: Active Landslide & Debris Flow Ahead!" 
                  : (currentStep?.instruction || "Proceed along corridor")}
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                {suddenHazardActive 
                  ? "IMD Doppler detected torrential rain. Road blocked 2.8 km ahead." 
                  : (currentStep?.roadName || route.corridor_title)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                voiceEnabled
                  ? "bg-emerald-900 border-emerald-700 text-emerald-200"
                  : "bg-stone-800 border-stone-700 text-stone-400"
              }`}
              title={voiceEnabled ? "Mute Voice Assistant" : "Unmute Voice Assistant"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 transition-colors cursor-pointer"
              title="Exit Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hazard Alert Banner inside HUD */}
        {suddenHazardActive ? (
          <div className="mt-3 pt-3 border-t border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-rose-200 font-bold flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-400 animate-ping shrink-0" />
              <span>Road Color Changed to RED • Voice Warning Dispatched</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSuddenHazardActive(false);
                onReroute();
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Accept Safe Green Reroute</span>
            </button>
          </div>
        ) : currentStep?.hazardWarning ? (
          <div className="mt-2.5 pt-2 border-t border-emerald-900/60 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{currentStep.hazardWarning}</span>
          </div>
        ) : null}
      </div>

      {/* 2. Bottom Telemetry Bar & Sudden Incident Simulation Button */}
      <div className="flex items-center justify-between gap-2 pointer-events-auto">
        {/* Speedometer & ETA pill */}
        <div className="bg-stone-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-800 text-white flex items-center gap-4 text-xs shadow-lg">
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-mono">Speed</div>
            <div className="text-sm font-black font-mono text-emerald-400">{speedKmh} <span className="text-[10px] font-normal text-stone-400">km/h</span></div>
          </div>
          <div className="w-px h-6 bg-stone-800" />
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-mono">ETA</div>
            <div className="text-sm font-bold text-white">
              {Math.max(1, Math.round(((1 - progressPercent / 100) * route.estimated_time_minutes)))} min
            </div>
          </div>
        </div>

        {/* Demo Simulation Action Buttons */}
        <div className="flex items-center gap-2">
          {!suddenHazardActive && (
            <button
              type="button"
              onClick={handleTriggerSuddenHazard}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-rose-500 transition-all cursor-pointer animate-pulse"
              title="Simulate sudden landslide hazard appearing on route"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
              <span>Simulate Sudden Landslide ⚠️</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-stone-950/90 backdrop-blur-md hover:bg-stone-900 border border-stone-800 text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
