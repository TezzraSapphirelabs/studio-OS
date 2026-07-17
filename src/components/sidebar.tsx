// ============================================================
// Studio OS — Sidebar Navigation
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import { iconMap, LogOutIcon, XIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col
          border-r border-white/[0.06]
          bg-[#0a0a0f]/80 backdrop-blur-2xl
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25 transition-shadow group-hover:shadow-violet-500/40">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              {APP_NAME}
            </span>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                  text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-500" />
                )}
                {Icon && <Icon size={18} className={isActive ? 'text-violet-400' : ''} />}
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500/20 px-1.5 text-[10px] font-semibold text-violet-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">Sarah Chen</p>
              <p className="truncate text-xs text-white/40">sarah@studio.os</p>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60">
              <LogOutIcon size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
