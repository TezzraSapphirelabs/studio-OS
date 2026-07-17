// ============================================================
// Studio OS — Top Bar / Header
// ============================================================

'use client';

import React from 'react';
import { SearchIcon, BellIcon, MenuIcon } from './icons';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f]/60 px-4 backdrop-blur-xl sm:px-6">
      {/* Left — menu + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
        >
          <MenuIcon size={20} />
        </button>

        <div className="relative hidden sm:block">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input
            type="text"
            placeholder="Search anything…"
            className="h-9 w-64 rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-violet-500/25"
          />
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white">
          <BellIcon size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-[#0a0a0f]" />
        </button>
      </div>
    </header>
  );
}
