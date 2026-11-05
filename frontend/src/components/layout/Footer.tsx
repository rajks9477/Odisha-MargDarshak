import React from "react";
import { Shield, MapPin, Compass } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F4EFEB] border-t border-[#E6DFD5] text-stone-600 text-xs py-10 px-4 sm:px-6 lg:px-8 mt-auto font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-700" />
            <span className="text-stone-900 font-bold text-sm">Odisha MargDarshak Intelligence Platform</span>
          </div>
          <p className="text-stone-600 text-xs leading-relaxed max-w-lg">
            An AI-enabled logistics & accessibility monitoring grid engineered specifically for the river basins (Mahanadi, Brahmani, Baitarani, Subarnarekha), coastal cyclone zones, Eastern Ghats landslide corridors, and critical supply lines across all 30 districts of Odisha.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 text-[11px] text-[#1B4332] font-semibold">
            <span className="px-2 py-0.5 rounded-md bg-[#E9F5ED] border border-[#C2E2CC]">30 Districts of Odisha</span>
            <span className="px-2 py-0.5 rounded-md bg-[#E9F5ED] border border-[#C2E2CC]">OSDMA Integrated</span>
            <span className="px-2 py-0.5 rounded-md bg-[#E9F5ED] border border-[#C2E2CC]">ODRAF Emergency Coordination</span>
            <span className="px-2 py-0.5 rounded-md bg-[#E9F5ED] border border-[#C2E2CC]">IMD Bhubaneswar Feeds</span>
            <span className="px-2 py-0.5 rounded-md bg-[#E9F5ED] border border-[#C2E2CC]">Works Dept & NHAI Network</span>
          </div>
        </div>

        <div>
          <h4 className="text-stone-900 font-bold mb-2">Role Access Control</h4>
          <ul className="space-y-1.5 text-xs text-stone-600 font-medium">
            <li><span className="font-bold text-emerald-800">Citizen:</span> Public Incident & Flood Reporting</li>
            <li><span className="font-bold text-emerald-700">Driver:</span> Odisha Highway Route Navigation</li>
            <li><span className="font-bold text-[#7F5539]">Field Officer:</span> Geo-verification & SOPs</li>
            <li><span className="font-bold text-purple-800">District Admin:</span> DDMA Logistics Desk</li>
            <li><span className="font-bold text-stone-900">Central Admin:</span> State Command Oversight (OSDMA)</li>
          </ul>
        </div>

        <div>
          <h4 className="text-stone-900 font-bold mb-2">Government Compliance</h4>
          <div className="space-y-2 text-stone-600">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>Role-Based Access Control (RBAC) with cryptographic token verification & audit logs.</span>
            </div>
            <p className="text-[11px] text-stone-500 pt-1">
              © {new Date().getFullYear()} Odisha MargDarshak. Built for State Logistics Resilience.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
