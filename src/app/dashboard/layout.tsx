"use client";

import React, { useState } from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { TopNav } from "@/components/dashboard/top-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuroraBackground intensity="low" className="text-white font-sans selection:bg-white/20 selection:text-white">
      <div className="flex h-screen w-full overflow-hidden relative z-10 p-4 gap-4">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          <TopNav toggleSidebar={() => setSidebarOpen(true)} />
          
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
