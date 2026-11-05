"use client";

import React from "react";
import { IncidentType } from "../types/incidentTypes";

interface IncidentTypeOption {
  type: IncidentType;
  label: string;
  icon: string;
  tag: string;
  color: string;
}

const INCIDENT_TYPES: IncidentTypeOption[] = [
  { type: IncidentType.LANDSLIDE, label: "Landslide / Rockfall", icon: "⛰️", tag: "Prevalent in Ghats & Hilly Districts", color: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  { type: IncidentType.FLOOD, label: "Flash Flood / Waterlogging", icon: "🌊", tag: "Monsoon Hazard", color: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
  { type: IncidentType.ROAD_BLOCKAGE, label: "Road Blockage / Obstruction", icon: "🚧", tag: "Traffic Stoppage", color: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
  { type: IncidentType.ACCIDENT, label: "Vehicle Collision / Accident", icon: "💥", tag: "Emergency Support", color: "border-red-500/40 bg-red-500/10 text-red-300" },
  { type: IncidentType.BRIDGE_DAMAGE, label: "Bridge Scour / Structure Defect", icon: "🌉", tag: "Critical Route Link", color: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  { type: IncidentType.ROAD_DAMAGE, label: "Severe Potholes / Cave-in", icon: "⚠️", tag: "Slow Transit", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" },
  { type: IncidentType.DEBRIS, label: "Debris / Fallen Trees", icon: "🪵", tag: "Lane Narrowing", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  { type: IncidentType.VEHICLE_BREAKDOWN, label: "Truck Breakdown", icon: "🚚", tag: "Shoulder Block", color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" },
  { type: IncidentType.WEATHER_HAZARD, label: "Dense Fog / Hailstorm", icon: "🌫️", tag: "Low Visibility", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  { type: IncidentType.OTHER, label: "Other Mountain Hazard", icon: "📋", tag: "Field Inspection", color: "border-slate-500/40 bg-slate-500/10 text-slate-300" },
];

interface Props {
  selectedType: IncidentType;
  onSelect: (type: IncidentType) => void;
}

export const IncidentTypeSelector: React.FC<Props> = ({ selectedType, onSelect }) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        1. Select Incident Type <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
        {INCIDENT_TYPES.map((item) => {
          const isSelected = selectedType === item.type;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onSelect(item.type)}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? `${item.color} border-2 ring-2 ring-emerald-500/30 font-semibold shadow-lg`
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
              }`}
            >
              <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-sm leading-snug truncate">{item.label}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.tag}</div>
              </div>
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
