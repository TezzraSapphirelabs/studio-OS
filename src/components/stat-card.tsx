// ============================================================
// Studio OS — Stats Card Component
// ============================================================

import React from 'react';
import { GlassCard } from './glass-card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accentColor?: string;
}

export function StatCard({ label, value, icon, trend, trendUp, accentColor = '#8b5cf6' }: StatCardProps) {
  return (
    <GlassCard hover padding="md">
      {/* Accent glow */}
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/50">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${
              trendUp ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {trend}
            </p>
          )}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
      </div>
    </GlassCard>
  );
}
