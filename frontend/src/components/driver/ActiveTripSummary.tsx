import React from "react";
import Link from "next/link";
import { Trip } from "@/services/driverService";
import { 
  Navigation, 
  Package, 
  Clock, 
  ArrowRight, 
  FileText, 
} from "lucide-react";

interface ActiveTripSummaryProps {
  trip?: Trip | null;
}

export const ActiveTripSummary: React.FC<ActiveTripSummaryProps> = ({ trip }) => {
  if (!trip) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs text-center space-y-3 font-sans">
        <div className="w-12 h-12 rounded-xl bg-[#F4EFEB] text-stone-400 mx-auto flex items-center justify-center">
          <Navigation className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-800">No Active Trip Assigned</h3>
          <p className="text-xs text-stone-500 mt-1">
            You are currently on standby. The regional supply dispatch desk will assign your next emergency consignment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EAE1] gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-700" />
          <h2 className="text-sm font-bold text-stone-900">Active Supply Corridor & Consignment</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#F8F4EE] text-[#7F5539] border border-[#E4D5C5]">
            {trip.trip_number}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9F5ED] text-[#1B4332] border border-[#C2E2CC] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {trip.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Origin -> Destination Route Visual Bar */}
      <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" /> Origin Point
            </div>
            <div className="text-xs sm:text-sm font-bold text-stone-900">{trip.origin_name}</div>
          </div>

          <div className="hidden sm:flex flex-1 items-center justify-center px-4">
            <div className="w-full flex items-center gap-2 text-stone-300">
              <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600" />
              <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0" />
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600" /> Destination Point
            </div>
            <div className="text-xs sm:text-sm font-bold text-stone-900">{trip.destination_name}</div>
          </div>
        </div>

        <div className="text-[11px] font-mono text-emerald-800 font-semibold pt-1 border-t border-[#E8E2D8] flex items-center justify-between">
          <span>Corridor: {trip.corridor_name}</span>
          <span className="font-bold text-stone-900">{trip.distance_km} km</span>
        </div>
      </div>

      {/* Consignment Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-0.5">
          <div className="text-[10px] text-stone-500 flex items-center gap-1 font-semibold">
            <Package className="w-3.5 h-3.5 text-emerald-700" /> Essential Cargo
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900">{trip.cargo_type}</div>
          <div className="text-[10px] text-stone-500">{trip.cargo_weight_tonnes} Tonnes</div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-0.5">
          <div className="text-[10px] text-stone-500 flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Estimated Arrival (ETA)
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900">
            {trip.estimated_arrival 
              ? new Date(trip.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : "On Schedule"}
          </div>
          <div className="text-[10px] text-emerald-800 font-semibold">+1.5 hr buffer included</div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-0.5 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-stone-500 flex items-center gap-1 font-semibold">
            <FileText className="w-3.5 h-3.5 text-purple-700" /> Consignment Notes
          </div>
          <p className="text-[11px] text-stone-600 leading-snug line-clamp-2">
            {trip.notes || "Priority government essential supply dispatch."}
          </p>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Link
          href="/dashboard/driver/route"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>View Full Waypoints & Pass Clearances</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
