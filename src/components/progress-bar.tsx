// ============================================================
// Studio OS — Animated Progress Bar
// ============================================================

'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ value, color = '#8b5cf6', height = 6, showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-full overflow-hidden rounded-full bg-white/[0.06]"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clampedValue}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 12px ${color}40`,
          }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[3ch] text-xs font-medium text-white/50">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
