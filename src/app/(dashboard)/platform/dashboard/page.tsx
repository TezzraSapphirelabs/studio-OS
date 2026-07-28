'use client';

import React from 'react';
import { GlassCard } from '@/components/glass-card';

export default function PlatformDashboard() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Platform Dashboard</h1>
        <p className="text-white/50 mt-1">Global platform metrics and overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">Total Workspaces</h3>
          <p className="text-4xl font-light text-white">--</p>
        </GlassCard>
        
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">Total Users</h3>
          <p className="text-4xl font-light text-white">--</p>
        </GlassCard>
        
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">System Health</h3>
          <p className="text-4xl font-light text-emerald-400">Online</p>
        </GlassCard>
      </div>
    </div>
  );
}
