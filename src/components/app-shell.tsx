// ============================================================
// Velonos — App Shell (Layout wrapper with sidebar + top bar)
// ============================================================

'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { useAuth } from '@/contexts/auth-context';
import { startPresencePing } from '@/services/presence';
import { AuroraBackground } from '@/components/ui/aurora-background';

function PresenceManager({ userId }: { userId: string }) {
  React.useEffect(() => {
    const cleanup = startPresencePing(userId);
    return cleanup;
  }, [userId]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <AuroraBackground intensity="low" className="text-white font-sans selection:bg-white/20 selection:text-white">
      {user && <PresenceManager userId={user.uid} />}
      <div className="flex h-screen w-full overflow-hidden relative z-10 p-4 gap-4">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 overflow-y-auto scroll-smooth rounded-[24px]">
            <div className="max-w-7xl mx-auto w-full pb-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuroraBackground>
  );
}
