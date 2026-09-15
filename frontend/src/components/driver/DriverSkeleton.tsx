import React from "react";

export const DriverSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-slate-800 rounded-md" />
            <div className="h-3 w-64 bg-slate-800/80 rounded-md" />
          </div>
          <div className="h-10 w-44 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Quick Actions Grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800" />
            <div className="h-4 w-20 bg-slate-800 rounded" />
            <div className="h-3 w-28 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 rounded-2xl bg-slate-900/80 border border-slate-800 p-6" />
        <div className="h-56 rounded-2xl bg-slate-900/80 border border-slate-800 p-6" />
      </div>
    </div>
  );
};
