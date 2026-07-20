// ============================================================
// Studio OS — Top Bar / Header
// ============================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, BellIcon, MenuIcon } from './icons';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications';
import { type Notification } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    }, (err) => console.error(err));
    return () => { unsub.then(u => u()); };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <div className="flex items-center gap-2 relative" ref={popoverRef}>
        <button 
          onClick={() => setShowPopover(!showPopover)}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <BellIcon size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-[#0a0a0f]" />
          )}
        </button>

        {/* Notifications Popover */}
        {showPopover && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#0f0f13] shadow-2xl z-50 overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-[#0a0a0f]/50">
              <h4 className="text-sm font-semibold text-white">Notifications</h4>
              {unreadCount > 0 && (
                <button 
                  onClick={() => user && markAllNotificationsRead(user.uid)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-white/40">
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`relative flex flex-col gap-1 p-4 transition-colors hover:bg-white/[0.02] ${!n.read ? 'bg-violet-500/[0.02]' : ''}`}
                      onClick={() => {
                        if (!n.read && user) markNotificationRead(user.uid, n.id);
                        setShowPopover(false);
                      }}
                    >
                      {!n.read && (
                        <div className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-500" />
                      )}
                      {n.link ? (
                        <Link href={n.link} className="flex flex-col gap-1 pl-2">
                          <p className="text-sm font-medium text-white">{n.title}</p>
                          <p className="text-xs text-white/60 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-white/40">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </Link>
                      ) : (
                        <div className="flex flex-col gap-1 pl-2">
                          <p className="text-sm font-medium text-white">{n.title}</p>
                          <p className="text-xs text-white/60 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-white/40">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
