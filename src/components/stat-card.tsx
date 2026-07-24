// ============================================================
// Studio OS — Stats Card Component
// ============================================================

import React from 'react';
import { GlassCard, GlassCardProps } from './glass-card';

export interface StatCardProps extends Omit<GlassCardProps, 'padding' | 'hover' | 'children'> {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accentColor?: string;
  href?: string;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, trendUp, accentColor = '#8b5cf6', href, ...props }, ref) => {
    return (
      <GlassCard ref={ref} href={href} hover padding="md" {...props}>
        {/* Accent glow */}
        <div
          className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-3xl pointer-events-none"
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
);

StatCard.displayName = "StatCard";
