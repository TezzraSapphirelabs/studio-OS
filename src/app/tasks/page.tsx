'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components';
import { PlusIcon, CheckSquareIcon } from '@/components/icons';
import { mockData } from '@/services';
import { TASK_STATUS_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import type { Task } from '@/types';

const STATUSES = ['todo', 'in-progress', 'done'] as const;

export default function TasksPage() {
  const [filter, setFilter] = useState<string>('all');
  const { tasks, projects } = mockData;

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || 'Unknown';

  const getProjectColor = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.color || '#8b5cf6';

  const priorityDot = (priority: Task['priority']) => (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: PRIORITY_COLORS[priority] }}
    />
  );

  const statusColumnCount = (status: string) => tasks.filter((t) => t.status === status).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Tasks</h1>
          <p className="mt-1 text-sm text-white/40">
            {tasks.length} total tasks across all projects
          </p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]">
          <PlusIcon size={16} />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filter === 'all'
              ? 'bg-white/[0.1] text-white'
              : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
          }`}
        >
          All ({tasks.length})
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === status
                ? 'bg-white/[0.1] text-white'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
            }`}
          >
            {TASK_STATUS_LABELS[status]} ({statusColumnCount(status)})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="stagger-children space-y-3">
        {filteredTasks.map((task) => (
          <GlassCard key={task.id} hover padding="none">
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Status icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                task.status === 'done'
                  ? 'bg-emerald-500/10'
                  : 'bg-white/[0.04]'
              }`}>
                <CheckSquareIcon
                  size={16}
                  className={task.status === 'done' ? 'text-emerald-400' : 'text-white/30'}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {priorityDot(task.priority)}
                  <p className={`truncate text-sm font-medium ${
                    task.status === 'done' ? 'text-white/40 line-through' : 'text-white'
                  }`}>
                    {task.title}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: getProjectColor(task.projectId) }}
                  >
                    {getProjectName(task.projectId)}
                  </span>
                  {task.tags.map((tag) => (
                    <span key={tag} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/30">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status badge */}
              <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex ${
                task.status === 'done'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : task.status === 'in-progress'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-white/[0.04] text-white/40'
              }`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>

              {/* Priority label */}
              <span
                className="hidden shrink-0 text-xs font-medium capitalize lg:block"
                style={{ color: PRIORITY_COLORS[task.priority] }}
              >
                {task.priority}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
