import React from "react";
import { UserRole, ROLE_CONFIGS } from "@/lib/constants";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = "md", showDot = true }) => {
  const config = ROLE_CONFIGS[role] || {
    label: role,
    badgeColor: "bg-stone-100 text-stone-800 border-stone-200"
  };

  const sizeClasses = {
    sm: "text-[10px] font-medium px-2 py-0.5",
    md: "text-xs font-semibold px-2.5 py-0.5",
    lg: "text-xs font-bold px-3 py-1",
  };

  const dotColors: Record<UserRole, string> = {
    CITIZEN: "bg-emerald-600",
    DRIVER: "bg-slate-600",
    FIELD_OFFICER: "bg-amber-600",
    DISTRICT_ADMIN: "bg-indigo-600",
    CENTRAL_ADMIN: "bg-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border shadow-2xs font-sans tracking-tight ${sizeClasses[size]} ${config.badgeColor}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[role] || "bg-stone-400"}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};
