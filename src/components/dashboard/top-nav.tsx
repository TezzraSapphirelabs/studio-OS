"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell, Sparkles, User, Menu } from "lucide-react";

export const TopNav = ({ toggleSidebar }: { toggleSidebar?: () => void }) => {
  return (
    <header className="glass-panel h-16 rounded-[24px] sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 rounded-md hover:bg-white/[0.06] transition-colors text-white/70 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <span className="text-[13px] font-semibold tracking-widest uppercase text-white/90">
            Studio OS
          </span>
        </div>
      </div>

      {/* Center - Search (Arc Command Bar style) */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/40 group-focus-within:text-white/80 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search commands, projects, files..."
            className="w-full h-10 bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 text-white text-[14px] placeholder:text-white/20 transition-all duration-300 outline-none focus:border-white/20 focus:bg-white/[0.05] hover:bg-white/[0.04]"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded-[4px] bg-white/[0.05] border border-white/[0.1] text-[10px] text-white/40 font-sans">
                ⌘
              </kbd>
              <kbd className="px-2 py-0.5 rounded-[4px] bg-white/[0.05] border border-white/[0.1] text-[10px] text-white/40 font-sans">
                K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 rounded-full hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white relative group">
          <Sparkles className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        </button>
        <div className="w-[1px] h-4 bg-white/[0.1] mx-1 sm:mx-2" />
        <Link href="/settings" className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center hover:bg-white/[0.1] transition-all overflow-hidden relative group">
          <User className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </header>
  );
};
