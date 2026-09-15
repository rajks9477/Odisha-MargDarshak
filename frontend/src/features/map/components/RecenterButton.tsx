"use client";

import React from "react";
import { Locate, Navigation } from "lucide-react";

interface RecenterButtonProps {
  isFollowing: boolean;
  onRecenter: () => void;
  className?: string;
}

export const RecenterButton: React.FC<RecenterButtonProps> = ({
  isFollowing,
  onRecenter,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onRecenter}
      title={isFollowing ? "Map is following GPS position" : "Recenter on my location"}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-95 border ${
        isFollowing
          ? "bg-blue-600 border-blue-400 text-white shadow-blue-900/60 ring-2 ring-blue-500/30"
          : "bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-slate-300 shadow-slate-950/80"
      } ${className}`}
    >
      {isFollowing ? (
        <Navigation className="w-5 h-5 fill-white animate-pulse" />
      ) : (
        <Locate className="w-5 h-5 text-slate-200" />
      )}
    </button>
  );
};
