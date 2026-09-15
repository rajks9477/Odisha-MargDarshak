'use client';

import React from 'react';
import { TripStatus } from '../types/tripTypes';

interface TripStatusBadgeProps {
  status: TripStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function TripStatusBadge({ status, size = 'md' }: TripStatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'ASSIGNED':
        return {
          label: 'ASSIGNED',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          dot: 'bg-blue-500',
        };
      case 'ACCEPTED':
      case 'READY':
        return {
          label: 'READY FOR TRANSIT',
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          dot: 'bg-cyan-500',
        };
      case 'STARTED':
        return {
          label: 'ACTIVE IN TRANSIT',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'PAUSED':
        return {
          label: 'PAUSED / HALTED',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-500',
        };
      case 'COMPLETED':
        return {
          label: 'DELIVERED & COMPLETED',
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
          dot: 'bg-slate-400',
        };
      case 'CANCELLED':
        return {
          label: 'CANCELLED',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tracking-wide transition-colors ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
