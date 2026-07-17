// ============================================================
// Studio OS — App Shell (Layout wrapper with sidebar + top bar)
// ============================================================

'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#07070a]">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-[40%] left-[20%] h-[600px] w-[600px] rounded-full bg-violet-600/[0.07] blur-[128px]" />
        <div className="absolute -bottom-[20%] right-[10%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.05] blur-[128px]" />
        <div className="absolute top-[40%] -left-[10%] h-[400px] w-[400px] rounded-full bg-cyan-600/[0.04] blur-[128px]" />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
