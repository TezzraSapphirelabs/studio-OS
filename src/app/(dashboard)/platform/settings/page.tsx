'use client';

import React from 'react';
import { GlassCard } from '@/components/glass-card';

export default function PlatformSettingsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Platform Settings</h1>
        <p className="text-white/50 mt-1">Configure global platform behavior.</p>
      </div>

      <GlassCard className="p-8 text-center text-white/50">
        Platform settings will be implemented here.
      </GlassCard>
    </div>
  );
}
