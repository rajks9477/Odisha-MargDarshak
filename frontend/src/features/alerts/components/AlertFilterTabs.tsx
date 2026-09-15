"use client";

import React from "react";

export type AlertFilterTabKey = "ALL" | "CRITICAL" | "UNREAD" | "WEATHER" | "INCIDENTS" | "DIRECTIVES";

interface Props {
  activeTab: AlertFilterTabKey;
  onTabChange: (tab: AlertFilterTabKey) => void;
  unreadCount?: number;
  criticalCount?: number;
}

export const AlertFilterTabs: React.FC<Props> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
  criticalCount = 0,
}) => {
  const tabs: { key: AlertFilterTabKey; label: string; badge?: number; badgeColor?: string }[] = [
    { key: "ALL", label: "All Alerts" },
    {
      key: "CRITICAL",
      label: "Critical & High",
      badge: criticalCount > 0 ? criticalCount : undefined,
      badgeColor: "bg-red-600 text-white",
    },
    {
      key: "UNREAD",
      label: "Unread",
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: "bg-emerald-600 text-white",
    },
    { key: "WEATHER", label: "Weather & Floods" },
    { key: "INCIDENTS", label: "Hazards & Blocks" },
    { key: "DIRECTIVES", label: "Govt Directives" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              isSelected
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${tab.badgeColor || "bg-slate-700"}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
