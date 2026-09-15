"use client";

import React from "react";

const QUICK_TAGS = [
  "Boulders blocking downhill lane",
  "Mudslide across both lanes",
  "Water level above tire height",
  "Bridge approach washed away",
  "Heavy truck stuck on mountain curve",
  "Single-lane vehicle movement only",
];

interface Props {
  description: string;
  onChange: (desc: string) => void;
}

export const IncidentDescription: React.FC<Props> = ({ description, onChange }) => {
  const maxLen = 500;

  const appendTag = (tag: string) => {
    if (!description.trim()) {
      onChange(tag);
    } else if (!description.includes(tag)) {
      onChange(`${description}. ${tag}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          3. What Happened? <span className="text-red-400">*</span>
        </label>
        <span className={`text-[11px] ${description.length > 450 ? "text-amber-400 font-bold" : "text-slate-500"}`}>
          {description.length}/{maxLen}
        </span>
      </div>

      <textarea
        value={description}
        onChange={(e) => onChange(e.target.value.slice(0, maxLen))}
        rows={3}
        placeholder="e.g. Large mudslide and boulders blocked the uphill carriageway near Sonapur tunnel..."
        className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
      />

      {/* Quick Field Tags */}
      <div className="space-y-1">
        <div className="text-[10px] text-slate-400">Quick Field Notes:</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => appendTag(tag)}
              className="text-[11px] px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-slate-300 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
