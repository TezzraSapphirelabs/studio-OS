// ============================================================
// Velonos — Sidebar Navigation
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  CalendarDays, 
  StickyNote,
  BarChart2,
  Tag,
  Sparkles, 
  FileBox, 
  Users,

  Bell, 
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { getDisplayName, getInitials } from '@/utils';

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Files", href: "/files", icon: FileBox },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Tags", href: "/tags", icon: Tag },
  { label: "AI Workspace", href: "/ai", icon: Sparkles },
  { label: "Members", href: "/members", icon: Users },
];

const BOTTOM_ITEMS = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NavItem = ({ item, pathname, onClose }: { item: typeof NAV_ITEMS[0]; pathname: string; onClose: () => void }) => {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
        isActive 
          ? "bg-white/[0.08] text-white font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
          : "text-white/50 hover:text-white hover:bg-white/[0.04]"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
      )}
      <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-white/40 group-hover:text-white/70 transition-colors")} />
      <span className="text-sm">{item.label}</span>
    </Link>
  );
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();



  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "glass-panel fixed lg:sticky top-0 left-0 h-full w-64 rounded-[24px] z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile Header */}
        <div className="h-16 flex items-center lg:hidden px-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            <span className="text-[13px] font-semibold tracking-widest uppercase text-white/90">
              Velonos
            </span>
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 px-3 pb-2">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}

        </div>

        {/* Bottom Nav */}
        <div className="px-4 border-t border-white/[0.08] space-y-1 pt-4 pb-2">
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}
        </div>

        {/* User Profile */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 rounded-xl p-2 bg-white/[0.02] border border-white/[0.04]">
            {user?.photoURL ? (
              <Image 
                src={user.photoURL} 
                alt="Profile" 
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover border border-white/[0.08]"
                unoptimized
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white  text-xs font-bold  text-black shadow-inner">
                {getInitials(userProfile?.displayName || user?.displayName, user?.email)}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-white/90">
                {userProfile?.displayName || getDisplayName(user)}
              </p>
              <p className="truncate text-[10px] text-white/40">
                {user?.email || ''}
              </p>
            </div>
            <button 
              onClick={logout}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

    </>
  );
}
