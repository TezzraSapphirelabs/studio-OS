'use client';

import React from 'react';
import { GlassCard } from '@/components/glass-card';
import { Activity } from 'lucide-react';

export default function PlatformHealthPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">System Health</h1>
        <p className="text-white/50 mt-1">Monitor platform status and audit logs.</p>
      </div>

      <GlassCard className="p-8 text-center text-emerald-400 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Activity className="w-8 h-8" />
        </div>
        <p className="text-lg">All Systems Operational</p>
      </GlassCard>
    </div>
  );
}
