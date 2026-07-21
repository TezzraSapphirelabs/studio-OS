'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToProjects } from '@/services/projects';
import { useAllProjectsTasks } from '@/hooks/use-tasks';
import { subscribeToWorkspaceActivity } from '@/services/activity';
import { StatCard, GlassCard, ProgressBar } from '@/components';
import Link from 'next/link';
import { 
  FolderIcon, 
  CheckSquareIcon, 
  TrendingUpIcon, 
  ClockIcon, 
  ActivityIcon,
  CheckCircleIcon
} from '@/components/icons';
import { type Project, type ProjectActivity } from '@/types';
import { getCompletionPercent } from '@/utils';

export default function AnalyticsPage() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ProjectActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const { tasks, loading: tasksLoading } = useAllProjectsTasks(user?.uid, projects);

  useEffect(() => {
    if (!user) return;
    
    const unsubProjects = subscribeToProjects(
      user.uid,
      (data) => {
        setProjects(data);
        setProjectsLoading(false);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setProjectsLoading(false);
      }
    );

    const unsubActivity = subscribeToWorkspaceActivity(
      user.uid,
      (data) => {
        setRecentActivity(data.slice(0, 10)); // Top 10 activities
        setActivityLoading(false);
      }
    );

    return () => {
      unsubProjects();
      unsubActivity();
    };
  }, [user]);

  // Analytics Computation
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'archived'); // Assuming archived is completed for now

    const completedTasks = tasks.filter(t => t.status === 'done');
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const dueStr = t.dueDate.split('T')[0];
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return dueStr < todayStr;
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const completedThisWeek = completedTasks.filter(t => new Date(t.updatedAt) >= oneWeekAgo).length;
    const completedThisMonth = completedTasks.filter(t => new Date(t.updatedAt) >= oneMonthAgo).length;

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      completedThisWeek,
      completedThisMonth,
      completionRate: getCompletionPercent(completedTasks.length, tasks.length),
    };
  }, [projects, tasks]);

  const formatActivityTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isLoading = projectsLoading || (projects.length > 0 && tasksLoading);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Analytics Overview</h1>
        <p className="mt-1 text-sm text-white/40">Detailed metrics and productivity insights across your workspace.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Projects"
            value={stats.totalProjects}
            icon={<FolderIcon size={22} />}
            trend={`${stats.activeProjects} active, ${stats.completedProjects} completed`}
            trendUp={true}
            accentColor="#3b82f6"
            href="/projects"
          />
          <StatCard
            label="Total Tasks"
            value={stats.totalTasks}
            icon={<CheckSquareIcon size={22} />}
            trend={`${stats.pendingTasks} pending tasks`}
            trendUp={true}
            accentColor="#8b5cf6"
            href="/tasks"
          />
          <StatCard
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={<CheckCircleIcon size={22} />}
            trend={`${stats.completedTasks} tasks done`}
            trendUp={stats.completionRate > 50}
            accentColor="#10b981"
            href="/tasks?status=done"
          />
          <StatCard
            label="Overdue Tasks"
            value={stats.overdueTasks}
            icon={<ClockIcon size={22} />}
            trend={stats.overdueTasks > 0 ? 'Needs attention' : 'All caught up'}
            trendUp={stats.overdueTasks === 0}
            accentColor={stats.overdueTasks > 0 ? '#ef4444' : '#14b8a6'}
            href="/tasks?status=todo"
          />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Productivity & Progress */}
        <div className="space-y-6 lg:col-span-2">
          {/* Productivity Stats */}
          <GlassCard padding="lg">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <ActivityIcon size={20} className="text-violet-400" /> Productivity Overview
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-sm font-medium text-white/50">Completed This Week</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{stats.completedThisWeek}</span>
                  <span className="text-xs text-white/40">tasks</span>
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-sm font-medium text-white/50">Completed This Month</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{stats.completedThisMonth}</span>
                  <span className="text-xs text-white/40">tasks</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Project Progress Statistics */}
          <GlassCard padding="lg">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUpIcon size={20} className="text-fuchsia-400" /> Project Progress
            </h2>
            <div className="space-y-6">
              {projects.length === 0 ? (
                <div className="text-sm text-white/40">No projects to display.</div>
              ) : (
                projects.map(project => {
                  const pTasks = tasks.filter(t => t.projectId === project.id);
                  const pCompleted = pTasks.filter(t => t.status === 'done').length;
                  const pTotal = pTasks.length;
                  const percent = getCompletionPercent(pCompleted, pTotal);

                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} className="block space-y-2 rounded-lg p-2 transition-colors hover:bg-white/5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-white">{project.name}</span>
                        <span className="text-white/60">{pCompleted} / {pTotal} ({percent}%)</span>
                      </div>
                      <ProgressBar value={percent} color={project.color} />
                    </Link>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard padding="lg">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <ActivityIcon size={20} className="text-blue-400" /> Recent Activity
            </h2>
            {activityLoading ? (
              <div className="h-64 animate-pulse rounded-xl bg-white/5" />
            ) : recentActivity.length === 0 ? (
              <div className="text-sm text-white/40">No recent activity.</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                      <ClockIcon size={14} className="text-white/40" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/60 leading-relaxed">
                        <span className="font-medium text-white/80">A member</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium text-white/80">{activity.target}</span>
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">{formatActivityTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
