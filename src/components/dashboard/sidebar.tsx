"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  Settings 
} from "lucide-react";

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
  { label: "Team", href: "/team", icon: Users },
];

const BOTTOM_ITEMS = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar = ({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen: boolean; 
  setIsOpen: (v: boolean) => void 
}) => {
  const pathname = usePathname();

  const NavItem = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
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
              Studio OS
            </span>
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 px-3 pb-2">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        {/* Bottom Nav */}
        <div className="p-4 border-t border-white/[0.08] space-y-1">
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </aside>
    </>
  );
};
