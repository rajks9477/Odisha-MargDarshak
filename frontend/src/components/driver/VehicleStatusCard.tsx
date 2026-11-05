import React from "react";
import { Vehicle } from "@/services/driverService";
import { 
  Truck, 
  Fuel, 
  Weight, 
  Calendar, 
  Cpu
} from "lucide-react";

interface VehicleStatusCardProps {
  vehicle?: Vehicle | null;
}

export const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({ vehicle }) => {
  if (!vehicle) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs text-center space-y-3 font-sans">
        <div className="w-12 h-12 rounded-xl bg-[#F4EFEB] text-stone-400 mx-auto flex items-center justify-center">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-800">No Vehicle Assigned Currently</h3>
          <p className="text-xs text-stone-500 mt-1">
            Contact your transport depot coordinator or District Admin to assign an essential commodity vehicle.
          </p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    OPERATIONAL: { bg: "bg-[#E9F5ED]", text: "text-[#1B4332]", border: "border-[#C2E2CC]" },
    IN_TRANSIT: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
    MAINTENANCE: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
    IDLE: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" },
  };

  const currentStatusStyle = statusColors[vehicle.status] || statusColors.OPERATIONAL;

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EAE1] gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-700" />
          <h2 className="text-sm font-bold text-stone-900">Assigned Logistics Fleet Vehicle</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}>
            ● {vehicle.status.replace("_", " ")}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F8F4EE] text-[#7F5539] border border-[#E4D5C5]">
            GPS READY
          </span>
        </div>
      </div>

      {/* Main Vehicle Reg Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Vehicle Registration No.
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 tracking-wider font-mono">
            {vehicle.vehicle_number}
          </div>
          <div className="text-xs text-stone-600 font-medium mt-0.5">{vehicle.model}</div>
        </div>

        {vehicle.department && (
          <div className="text-left sm:text-right">
            <div className="text-[10px] uppercase font-bold text-stone-400">Allocated Department</div>
            <div className="text-xs font-bold text-stone-800">{vehicle.department}</div>
            <div className="text-[11px] text-emerald-800 font-semibold font-mono">
              {vehicle.district ? `${vehicle.district}, ` : ""}{vehicle.state || "Odisha"}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Key Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-0.5">
          <div className="text-[10px] text-stone-500 flex items-center gap-1 font-semibold">
            <Weight className="w-3.5 h-3.5 text-emerald-700" /> Max Payload
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900">{vehicle.capacity_tonnes} Tonnes</div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-0.5">
          <div className="text-[10px] text-stone-500 flex items-center gap-1 font-semibold">
            <Fuel className="w-3.5 h-3.5 text-amber-700" /> Fuel Spec
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900">{vehicle.fuel_type}</div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-0.5">
          <div className="text-[10px] text-stone-500 flex items-center gap-1 font-semibold">
            <Cpu className="w-3.5 h-3.5 text-emerald-700" /> Vehicle Type
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900 truncate">{vehicle.vehicle_type}</div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-0.5">
          <div className="text-[10px] text-stone-500 flex items-center gap-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-purple-700" /> Fitness Valid
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900">
            {vehicle.fitness_valid_until 
              ? new Date(vehicle.fitness_valid_until).toLocaleDateString()
              : "Valid (Current Year)"}
          </div>
        </div>
      </div>
    </div>
  );
};
