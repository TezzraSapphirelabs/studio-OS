'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '../layout';
import { useAuth } from '@/contexts/auth-context';
import { GlassCard } from '@/components';
import { subscribeToProjectActivity } from '@/services/activity';
import { type ProjectActivity } from '@/types';
import { formatRelativeDate } from '@/utils';
import { ActivityIcon, CheckCircleIcon, FolderIcon, EditIcon, TrashIcon } from '@/components/icons';

// Simple fallback ActivityIcon if not exported from icons.tsx
function TimelineIcon({ action, size = 20 }: { action: string; size?: number }) {
  if (action.includes('created task') || action.includes('created project')) {
    return <FolderIcon size={size} />;
  }
  if (action.includes('completed task')) {
    return <CheckCircleIcon size={size} />;
  }
  if (action.includes('deleted')) {
    return <TrashIcon size={size} />;
  }
  return <EditIcon size={size} />;
}

export default function ProjectActivityPage() {
  const { user } = useAuth();
  const { project, loading: projectLoading } = useProject();

  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !project) return;
    setLoading(true);
    const unsubscribe = subscribeToProjectActivity(user.uid, project.id, (data, err) => {
      if (err) setError(err);
      else setActivities(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, project]);

  if (projectLoading) return null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Activity Feed</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-6 text-center text-red-400">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">No activity yet</h3>
          <p className="mb-6 text-sm text-white/40">This project's history will appear here.</p>
        </div>
      ) : (
        <GlassCard padding="lg">
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/[0.08] before:to-transparent">
            {activities.map((activity, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.08] bg-[#12121a] text-white/40 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:text-violet-400 group-hover:border-violet-500/30">
                    <TimelineIcon action={activity.action} size={16} />
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-colors group-hover:bg-white/[0.04] group-hover:border-white/[0.08]">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-white/70">
                        <span className="font-semibold text-white">You</span> {activity.action}{' '}
                        <span className="font-semibold text-white">"{activity.target}"</span>
                      </p>
                      <time className="text-xs text-white/30 font-medium">
                        {formatRelativeDate(activity.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
