'use client';

import React from 'react';
import { AppShell } from '@/components/app-shell';

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="flex-1 h-full w-full bg-black/20 relative z-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </AppShell>
  );
}
