import os

# 1. Update globals.css to completely remove dark backgrounds and enforce Luxury White
globals_css = """@import "tailwindcss";
@import "./design-system.css";

:root {
  --background: var(--ds-bg);
  --foreground: var(--ds-fg);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  
  /* Design System Colors */
  --color-ds-bg: var(--ds-bg);
  --color-ds-surface: var(--ds-surface);
  --color-ds-surface-hover: var(--ds-surface-hover);
  --color-ds-card: var(--ds-card);
  --color-ds-card-hover: var(--ds-card-hover);
  --color-ds-fg: var(--ds-fg);
  --color-ds-fg-inverse: var(--ds-fg-inverse);
  --color-ds-border: var(--ds-border);
  --color-ds-border-inverse: var(--ds-border-inverse);
  --color-ds-text-muted: var(--ds-text-muted);
  --color-ds-text-muted-inverse: var(--ds-text-muted-inverse);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }

@layer base {
  input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea, select {
    @apply flex min-h-[44px] w-full rounded-2xl border border-ds-border bg-white px-4 py-2 text-sm text-ds-fg transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-ds-fg focus:ring-ds-border disabled:cursor-not-allowed disabled:opacity-50 shadow-sm;
  }
  
  button:not([class*="ds-"]):not([class*="p-0"]):not([class*="w-full"]):not([class*="bg-transparent"]):not([class*="absolute"]):not([class*="top-"]):not([class*="right-"]):not([class*="left-"]):not([class*="bottom-"]):not([class*="z-"]):not([class*="hidden"]):not([class*="shrink-0"]) {
    @apply inline-flex items-center justify-center rounded-2xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ds-border focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] bg-ds-card text-ds-fg-inverse hover:bg-ds-card-hover h-11 px-6 py-2 text-sm shadow-md;
  }
}
"""

design_system_css = """/* 
 * Studio OS - Premium Design System (FINAL)
 * Luxury Premium Monochrome
 */

:root {
  /* Core Colors */
  --ds-bg: #F7F7F5;
  --ds-surface: #FFFFFF;
  --ds-surface-hover: #F1F1EF;
  --ds-card: #2B2D31;
  --ds-card-hover: #35383D;
  
  --ds-fg: #0A0A0A;
  --ds-fg-inverse: #FFFFFF;
  
  --ds-border: #E5E5E0;
  --ds-border-inverse: #40424A;
  
  --ds-text-muted: #8F8F8A;
  --ds-text-muted-inverse: #A0A0A5;
  
  /* Shadows & Depth */
  --ds-shadow-float: 0 12px 32px -8px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.04);
  --ds-shadow-pop: 0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 8px 24px -6px rgba(0, 0, 0, 0.06);
  --ds-shadow-sm: 0 2px 8px -2px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --ds-transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.ds-float {
  box-shadow: var(--ds-shadow-float);
  transition: var(--ds-transition);
}

.ds-float:hover {
  box-shadow: var(--ds-shadow-pop);
  transform: translateY(-4px);
}
"""

with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\globals.css', 'w', encoding='utf-8') as f:
    f.write(globals_css)

with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\app\design-system.css', 'w', encoding='utf-8') as f:
    f.write(design_system_css)

# Redesign layout files
app_shell_tsx = """'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-ds-bg text-ds-fg overflow-hidden selection:bg-ds-card selection:text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden relative z-0">
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 scroll-smooth">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
"""

sidebar_tsx = """'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import { iconMap, LogOutIcon, XIcon } from './icons';
import { useAuth } from '@/contexts/auth-context';
import { getDisplayName, getInitials } from '@/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ds-fg/10 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col
          border-r border-ds-border bg-ds-surface
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <div className="flex h-20 items-center justify-between px-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-ds-card shadow-md transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-ds-fg-inverse">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-ds-fg">
              {APP_NAME}
            </span>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ds-text-muted transition-colors hover:bg-ds-surface-hover hover:text-ds-fg lg:hidden"
          >
            <XIcon size={18} />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1.5 px-4">
          <div className="px-4 mb-4 text-xs font-semibold uppercase tracking-wider text-ds-text-muted/60">Menu</div>
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  group relative flex items-center gap-3 rounded-2xl px-4 py-3
                  text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-ds-bg text-ds-fg shadow-sm'
                    : 'text-ds-text-muted hover:bg-ds-surface-hover hover:text-ds-fg/80'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-ds-card" />
                )}
                {Icon && <Icon size={20} className={isActive ? 'text-ds-fg' : 'text-ds-text-muted group-hover:text-ds-fg/80'} />}
                <span className="tracking-wide">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-ds-card px-1.5 text-[10px] font-semibold text-ds-fg-inverse shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="rounded-3xl bg-ds-bg p-4 flex flex-col gap-4 shadow-sm border border-ds-border/50">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-ds-border shadow-sm">
                {userProfile?.photoURL ? (
                  <Image src={userProfile.photoURL} alt="Profile" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-ds-surface text-sm font-medium text-ds-fg">
                    {getInitials(getDisplayName(user, userProfile))}
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-ds-fg">
                  {getDisplayName(user, userProfile)}
                </span>
                <span className="truncate text-xs text-ds-text-muted">
                  {user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ds-surface py-2 text-sm font-medium text-ds-text-muted transition-colors hover:bg-ds-surface-hover hover:text-red-500"
            >
              <LogOutIcon size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
"""

top_bar_tsx = """'use client';

import React from 'react';
import { MenuIcon, BellIcon, SearchIcon } from './icons';
import { useAuth } from '@/contexts/auth-context';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-ds-border/50 bg-ds-bg/80 px-6 backdrop-blur-xl lg:px-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ds-text-muted transition-colors hover:bg-ds-surface-hover hover:text-ds-fg lg:hidden shadow-sm border border-ds-border/50 bg-ds-surface"
        >
          <MenuIcon size={20} />
        </button>
        
        <div className="hidden lg:flex relative w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-ds-text-muted">
            <SearchIcon size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search across workspace..." 
            className="w-full bg-ds-surface border border-ds-border rounded-full py-2.5 pl-11 pr-4 text-sm text-ds-fg focus:outline-none focus:border-ds-card focus:ring-1 focus:ring-ds-card transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ds-border bg-ds-surface text-ds-text-muted transition-colors hover:bg-ds-surface-hover hover:text-ds-fg shadow-sm">
          <BellIcon size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-ds-surface"></span>
        </button>
      </div>
    </header>
  );
}
"""

with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\app-shell.tsx', 'w', encoding='utf-8') as f:
    f.write(app_shell_tsx)
with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(sidebar_tsx)
with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\top-bar.tsx', 'w', encoding='utf-8') as f:
    f.write(top_bar_tsx)

# Now redefine the ui primitives to be fully luxury
ui_card_tsx = """import React from 'react';
import Link from 'next/link';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'light' | 'floating' | 'ghost';
  href?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ className = '', variant = 'default', href, hover, onClick, children, ...props }: CardProps) {
  const baseStyles = 'rounded-[24px] overflow-hidden transition-all duration-300';
  
  const variants = {
    default: 'bg-white text-ds-fg border border-ds-border ds-float',
    floating: 'bg-white text-ds-fg border border-ds-border ds-float shadow-xl',
    secondary: 'bg-ds-card text-ds-fg-inverse border border-ds-border-inverse ds-float',
    light: 'bg-ds-surface text-ds-fg border border-ds-border',
    ghost: 'bg-transparent text-ds-fg hover:bg-ds-surface',
  };

  const hoverStyles = hover ? 'hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer hover:border-ds-text-muted/30' : '';
  const combinedClasses = `${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className="block group w-full text-left">
        <div className={combinedClasses} {...props}>
          {children}
        </div>
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block group w-full text-left appearance-none bg-transparent p-0 m-0 border-0 outline-none">
        <div className={combinedClasses} {...props}>
          {children}
        </div>
      </button>
    );
  }

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-2 p-8 pb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-2xl font-semibold leading-tight tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-ds-text-muted ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-8 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center p-8 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}
"""

with open(r'c:\Users\isand\OneDrive\Desktop\studio-OS\src\components\ui\card.tsx', 'w', encoding='utf-8') as f:
    f.write(ui_card_tsx)
