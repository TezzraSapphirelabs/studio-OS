import React from 'react';
import { GlassCard } from './glass-card';

export function SkeletonCard() {
  return (
    <GlassCard padding="md" className="flex flex-col">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/[0.08]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-white/[0.08]" />
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.06]" />
        <div className="flex justify-between border-t border-white/[0.04] pt-3">
          <div className="h-3 w-16 rounded bg-white/[0.06]" />
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
        </div>
      </div>
    </GlassCard>
  );
}
