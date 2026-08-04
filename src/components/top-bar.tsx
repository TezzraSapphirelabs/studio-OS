// ============================================================
// Velonos — Top Bar / Header
// ============================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Sparkles, User, Menu } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications';
import { type Notification } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/utils';
import { Input } from '@/components/ui/input';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, userProfile } = useAuth();
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
    <header className="glass-panel h-16 rounded-[24px] sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-2 rounded-md hover:bg-white/[0.06] transition-colors text-white/70 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <span className="text-[13px] font-semibold tracking-widest uppercase text-white/90">
            Velonos CPM
          </span>
        </div>
      </div>

      {/* Center - Search (Arc Command Bar style) */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative group">
          <Input
            icon={<Search className="w-4 h-4" />}
            type="text"
            placeholder="Search commands, projects, files..."
            className="w-full pr-20 text-[14px]"
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
      <div className="flex items-center gap-2 sm:gap-4 relative" ref={popoverRef}>
        <button className="p-2 rounded-full hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white relative group">
          <Sparkles className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <button 
          onClick={() => setShowPopover(!showPopover)}
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          )}
        </button>

        {/* Notifications Popover */}
        {showPopover && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#0f0f13]/90 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-white">Notifications</h4>
              {unreadCount > 0 && (
                <button 
                  onClick={() => user && markAllNotificationsRead(user.uid)}
                  className="text-xs text-white/70 hover:text-white/50 transition-colors"
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
                      className={`relative flex flex-col gap-1 p-4 transition-colors hover:bg-white/[0.04] ${!n.read ? 'bg-white/[0.04]' : ''}`}
                      onClick={() => {
                        if (!n.read && user) markNotificationRead(user.uid, n.id);
                        setShowPopover(false);
                      }}
                    >
                      {!n.read && (
                        <div className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white text-black" />
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

        <div className="w-[1px] h-4 bg-white/[0.1] mx-1 sm:mx-2" />
        
        <Link href="/settings" className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center hover:bg-white/[0.1] transition-all overflow-hidden relative group">
          {user?.photoURL ? (
            <Image src={user.photoURL} alt="Profile" width={32} height={32} unoptimized />
          ) : userProfile ? (
            <span className="text-[10px] font-bold text-white">{getInitials(userProfile.displayName || user?.displayName, user?.email)}</span>
          ) : (
            <User className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
          )}
        </Link>
      </div>
    </header>
  );
}
