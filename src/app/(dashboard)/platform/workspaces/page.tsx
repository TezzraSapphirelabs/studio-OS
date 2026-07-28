'use client';

import React from 'react';
import { GlassCard } from '@/components/glass-card';

export default function PlatformWorkspacesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Global Workspaces</h1>
        <p className="text-white/50 mt-1">View and manage all workspaces across the platform.</p>
      </div>

      <GlassCard className="p-8 text-center text-white/50">
        Global workspace management will be implemented here.
      </GlassCard>
    </div>
  );
}
