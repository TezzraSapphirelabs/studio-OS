'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard, StatCard, ProgressBar } from '@/components';
import { FolderIcon, CheckSquareIcon, UsersIcon, TrendingUpIcon, ChevronRightIcon, ClockIcon } from '@/components/icons';
import { getCompletionPercent, getDisplayName } from '@/utils';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { subscribeToProjects } from '@/services/projects';
import { subscribeToWorkspaceActivity } from '@/services/activity';
import { fetchWorkspaceMembers } from '@/services/workspace';
import { type Project, type ProjectActivity } from '@/types';
import { useAllProjectsTasks } from '@/hooks/use-tasks';

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  const [recentActivity, setRecentActivity] = useState<ProjectActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});

  const { tasks, loading: tasksLoading } = useAllProjectsTasks(user?.uid, projects);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to projects
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

    // Subscribe to activity (using user.uid as workspaceId for now, matching app architecture)
    const unsubActivity = subscribeToWorkspaceActivity(
      user.uid,
      (data) => {
        setRecentActivity(data.slice(0, 10)); // keep only top 10 recent activities
        setActivityLoading(false);
      }
    );

    // Fetch workspace members to resolve real names for activity feed
    fetchWorkspaceMembers(user.uid).then(({ members }) => {
      if (members) {
        const map: Record<string, string> = {};
        members.forEach(m => map[m.userId] = m.displayName);
        setMemberMap(map);
      }
    });

    return () => {
      unsubProjects();
      unsubActivity();
    };
  }, [user]);

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'in-progress'), [tasks]);
  
  // Calculate overdue tasks and upcoming deadlines
  const { overdueTasks, upcomingDeadlines } = useMemo(() => {
    const todayLocal = new Date();
    const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;

    const withDeadlines = tasks.filter(t => t.dueDate && t.status !== 'done');
    
    const overdue = withDeadlines.filter(t => {
      // dueDate is stored as UTC midnight of the selected date. Extract the YYYY-MM-DD.
      const dueStr = t.dueDate!.split('T')[0];
      return dueStr < todayStr;
    });

    const upcoming = withDeadlines
      .filter(t => {
        const dueStr = t.dueDate!.split('T')[0];
        return dueStr >= todayStr;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5); // top 5 upcoming

    return { overdueTasks: overdue, upcomingDeadlines: upcoming };
  }, [tasks]);

  const stats = useMemo(() => {
    let completed = 0;
    let active = 0;
    const uniqueMembers = new Set<string>();

    projects.forEach(p => {
      // In a real app we might rely on the tasks array, but relying on project counters is also ok.
      // Let's use the actual tasks array for precision since we have it!
      if (p.memberUids) {
        p.memberUids.forEach(uid => uniqueMembers.add(uid));
      }
    });

    completed = tasks.filter(t => t.status === 'done').length;
    active = tasks.filter(t => t.status !== 'done').length;

    return {
      totalProjects: projects.length,
      activeTasks: active,
      completedTasks: completed,
      teamMembers: uniqueMembers.size,
      overdueCount: overdueTasks.length,
    };
  }, [projects, tasks, overdueTasks.length]);

  const getProjectName = (projectId: string) => projects.find((p) => p.id === projectId)?.name || 'Unknown';
  const getProjectColor = (projectId: string) => projects.find((p) => p.id === projectId)?.color || '#8b5cf6';

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

  const isInitialLoading = projectsLoading || (projects.length > 0 && tasksLoading);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Good afternoon, {userProfile?.displayName || getDisplayName(user)}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isInitialLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))
        ) : (
          <>
            <StatCard
              href="/projects"
              label="Total Projects"
              value={stats.totalProjects}
              icon={<FolderIcon size={22} />}
              trend="Active & Drafts"
              trendUp={true}
              accentColor="#8b5cf6"
            />
            <StatCard
              href="/tasks?status=in-progress"
              label="Active Tasks"
              value={stats.activeTasks}
              icon={<CheckSquareIcon size={22} />}
              trend={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : 'All on track'}
              trendUp={stats.overdueCount === 0}
              accentColor={stats.overdueCount > 0 ? "#ef4444" : "#06b6d4"}
            />
            <StatCard
              href="/tasks?status=done"
              label="Completed Tasks"
              value={stats.completedTasks}
              icon={<TrendingUpIcon size={22} />}
              trend="Across all projects"
              trendUp={true}
              accentColor="#22c55e"
            />
            <StatCard
              href="/team"
              label="Team Members"
              value={stats.teamMembers}
              icon={<UsersIcon size={22} />}
              trend="View members"
              trendUp={true}
              accentColor="#ec4899"
            />
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column: Active Projects & Upcoming Deadlines */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Active Projects */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Active Projects</h2>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-xs font-medium text-white/40 transition-colors hover:text-violet-400"
              >
                View all <ChevronRightIcon size={14} />
              </Link>
            </div>
            
            {projectsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : activeProjects.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-sm text-white/40">
                No active projects found.
              </div>
            ) : (
              <div className="stagger-children grid gap-4 sm:grid-cols-2">
                {activeProjects.map((project) => {
                  const pTasks = tasks.filter(t => t.projectId === project.id);
                  const pCompleted = pTasks.filter(t => t.status === 'done').length;
                  const pTotal = pTasks.length;
                  
                  return (
                    <GlassCard key={project.id} href={`/projects/${project.id}`} hover padding="md">
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
                            <p className="text-xs text-white/40">{project.memberUids?.length || 1} members</p>
                          </div>
                        </div>
                      </div>

                      <p className="mb-4 text-xs leading-relaxed text-white/40 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-white/40">Progress</span>
                          <span className="font-medium text-white/60">
                            {pCompleted}/{pTotal} tasks
                          </span>
                        </div>
                        <ProgressBar
                          value={getCompletionPercent(pCompleted, pTotal)}
                          color={project.color}
                        />
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Upcoming Deadlines</h2>
              <Link
                href="/tasks"
                className="flex items-center gap-1 text-xs font-medium text-white/40 transition-colors hover:text-violet-400"
              >
                View all tasks <ChevronRightIcon size={14} />
              </Link>
            </div>
            
            {tasksLoading && projects.length > 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-sm text-white/40">
                No upcoming task deadlines.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((task) => (
                  <GlassCard key={task.id} hover padding="sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getProjectColor(task.projectId) }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{task.title}</p>
                          <p className="text-xs text-white/40">{getProjectName(task.projectId)}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-white/80">
                          {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-white/40 capitalize">{task.priority} Priority</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar: Activity + In-Progress */}
        <div className="space-y-6">
          {/* In-Progress Tasks */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">In Progress</h2>
              <span className="text-xs text-white/40">{inProgressTasks.length} tasks</span>
            </div>
            
            {tasksLoading && projects.length > 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : inProgressTasks.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-center text-sm text-white/40 px-4">
                No tasks currently in progress.
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressTasks.slice(0, 6).map((task) => (
                  <GlassCard key={task.id} href="/tasks" hover padding="sm">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: getProjectColor(task.projectId) }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{task.title}</p>
                        <p className="text-xs text-white/40">{getProjectName(task.projectId)}</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>
            {activityLoading ? (
              <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
            ) : recentActivity.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-sm text-white/40">
                No recent activity.
              </div>
            ) : (
              <GlassCard padding="none">
                <div className="divide-y divide-white/[0.04]">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                        <ClockIcon size={14} className="text-white/40" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/60">
                          {/* If the activity user is known or just a name */}
                          <span className="font-medium text-white/80">
                            {activity.ownerUid === user?.uid ? getDisplayName(user) : (memberMap[activity.ownerUid] || 'A member')}
                          </span>{' '}
                          {activity.action}{' '}
                          <span className="font-medium text-white/80">{activity.target}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/25">{formatActivityTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
