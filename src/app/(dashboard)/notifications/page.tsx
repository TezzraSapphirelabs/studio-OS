'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  subscribeToNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  clearNotifications 
} from '@/services/notifications';
import type { Notification } from '@/types';
import { GlassCard, EmptyState } from '@/components';
import { 
  BellIcon, 
  CheckCircleIcon, 
  TrashIcon, 
  ClockIcon,
  MessageSquareIcon,
  CheckSquareIcon,
  FolderIcon,
  InfoIcon,
  UsersIcon,
  ActivityIcon
} from '@/components/icons';
import { formatRelativeDate } from '@/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(
      user.uid,
      async (data) => {
        // Resolve promises from subscribeToNotifications because it uses an async import
        const resolvedData = await data;
        setNotifications(resolvedData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    );
    
    return () => {
      unsub.then(u => u());
    };
  }, [user]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    await markNotificationRead(user.uid, id);
  };

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await markAllNotificationsRead(user.uid);
  };

  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      await clearNotifications(user.uid);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_completed':
        return <CheckSquareIcon size={20} className="text-white/70" />;
      case 'project_update':
        return <FolderIcon size={20} className="text-white/70" />;
      case 'mention':
      case 'comment':
        return <MessageSquareIcon size={20} className="text-white/70" />;
      case 'workspace_invite':
      case 'workspace_event':
        return <UsersIcon size={20} className="text-white/70" />;
      default:
        return <InfoIcon size={20} className="text-white/40" />;
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-3">
            <BellIcon size={28} className="text-white/70" />
            Notifications
            {unreadCount > 0 && (
              <span className="flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-white text-black text-xs font-bold shadow-lg shadow-white/10">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Stay updated on your tasks, projects, and team activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon size={16} />
            Mark all read
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrashIcon size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 glass-panel p-1 w-fit">
        {(['all', 'unread'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
              filter === tab
                ? 'bg-white/[0.06] text-white shadow-sm'
                : 'text-white/50 hover:bg-white/[0.02] hover:text-white/80'
            }`}
          >
            {tab} {tab === 'unread' && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      <GlassCard padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/80" />
            <p className="mt-4 text-sm text-white/40">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={filter === 'unread' ? <CheckCircleIcon size={36} /> : <ActivityIcon size={36} />}
            title={filter === 'unread' ? "You're all caught up!" : "No notifications yet"}
            description={filter === 'unread' ? "You don't have any unread notifications." : "When you receive notifications, they will appear here."}
            className="my-12 border-none bg-transparent"
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`relative flex gap-4 p-4 sm:p-5 transition-colors hover:bg-white/[0.02] ${
                  !notification.read ? 'bg-white text-black/[0.02]' : ''
                }`}
              >
                {!notification.read && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-white text-black shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                )}
                
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/10">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-white/80'}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-white/50 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-white/30">
                        <ClockIcon size={12} />
                        {formatRelativeDate(notification.createdAt)}
                      </div>
                      
                      {notification.link && (
                        <Link 
                          href={notification.link}
                          className="text-xs font-medium text-white/70 hover:text-white/50 transition-colors"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="shrink-0 flex items-start">
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircleIcon size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
