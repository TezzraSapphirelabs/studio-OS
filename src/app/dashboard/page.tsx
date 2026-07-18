'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard, StatCard, ProgressBar } from '@/components';
import { FolderIcon, CheckSquareIcon, UsersIcon, TrendingUpIcon, ChevronRightIcon, ClockIcon } from '@/components/icons';
import { mockData } from '@/services';
import { getCompletionPercent, getDisplayName } from '@/utils';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { subscribeToProjects } from '@/services/projects';
import { type Project } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, recentActivity } = mockData;
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToProjects(
      user.uid,
      (data) => {
        setProjects(data);
      },
      (err) => console.error(err)
    );
    return () => { unsub(); };
  }, [user]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');

  const stats = useMemo(() => {
    let completed = 0;
    let active = 0;
    const uniqueMembers = new Set<string>();

    projects.forEach(p => {
      completed += p.completedTaskCount || 0;
      active += (p.taskCount || 0) - (p.completedTaskCount || 0);
      if (p.memberUids) {
        p.memberUids.forEach(uid => uniqueMembers.add(uid));
      }
    });

    return {
      totalProjects: projects.length,
      activeTasks: active,
      completedTasks: completed,
      teamMembers: uniqueMembers.size,
    };
  }, [projects]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Good afternoon, {getDisplayName(user)}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          icon={<FolderIcon size={22} />}
          trend="+2 this month"
          trendUp={true}
          accentColor="#8b5cf6"
        />
        <StatCard
          label="Active Tasks"
          value={stats.activeTasks}
          icon={<CheckSquareIcon size={22} />}
          trend="12 due this week"
          trendUp={false}
          accentColor="#06b6d4"
        />
        <StatCard
          label="Completed"
          value={stats.completedTasks}
          icon={<TrendingUpIcon size={22} />}
          trend="+23% vs last month"
          trendUp={true}
          accentColor="#22c55e"
        />
        <Link href="/projects" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard
            label="Team Members"
            value={stats.teamMembers}
            icon={<UsersIcon size={22} />}
            trend="All active"
            trendUp={true}
            accentColor="#ec4899"
          />
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Projects</h2>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs font-medium text-white/40 transition-colors hover:text-violet-400"
            >
              View all <ChevronRightIcon size={14} />
            </Link>
          </div>
          <div className="stagger-children grid gap-4 sm:grid-cols-2">
            {activeProjects.map((project) => (
              <GlassCard key={project.id} hover padding="md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <FolderIcon size={18} className="" style={{ color: project.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                      <p className="text-xs text-white/40">{project.memberCount} members</p>
                    </div>
                  </div>
                </div>

                <p className="mb-4 text-xs leading-relaxed text-white/40 line-clamp-2">
                  {project.description}
                </p>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-white/40">Progress</span>
                    <span className="font-medium text-white/60">
                      {project.completedTaskCount}/{project.taskCount} tasks
                    </span>
                  </div>
                  <ProgressBar
                    value={getCompletionPercent(project.completedTaskCount, project.taskCount)}
                    color={project.color}
                  />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Sidebar: Activity + In-Progress */}
        <div className="space-y-6">
          {/* In-Progress Tasks */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">In Progress</h2>
            <div className="space-y-3">
              {inProgressTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                return (
                  <GlassCard key={task.id} hover padding="sm">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: project?.color || '#8b5cf6' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{task.title}</p>
                        <p className="text-xs text-white/40">{project?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>
            <GlassCard padding="none">
              <div className="divide-y divide-white/[0.04]">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                      <ClockIcon size={14} className="text-white/40" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/60">
                        <span className="font-medium text-white/80">
                          {activity.user === 'Current User' ? getDisplayName(user) : activity.user}
                        </span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium text-white/80">{activity.target}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/25">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
