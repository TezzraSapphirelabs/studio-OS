'use client';

import React from 'react';
import { GlassCard, ProgressBar } from '@/components';
import { FolderIcon, PlusIcon } from '@/components/icons';
import { mockData } from '@/services';
import { getCompletionPercent, formatRelativeDate } from '@/utils';

export default function ProjectsPage() {
  const { projects } = mockData;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
      draft: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
      archived: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-white/40">
            {projects.length} projects across your workspace
          </p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]">
          <PlusIcon size={16} />
          New Project
        </button>
      </div>

      {/* Projects grid */}
      <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <GlassCard key={project.id} hover padding="md" className="flex flex-col">
            {/* Accent glow */}
            <div
              className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-15 blur-2xl"
              style={{ backgroundColor: project.color }}
            />

            <div className="relative">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <FolderIcon size={20} className="" style={{ color: project.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                    <p className="text-xs text-white/40">{project.memberCount} members</p>
                  </div>
                </div>
                {statusBadge(project.status)}
              </div>

              <p className="mb-5 text-xs leading-relaxed text-white/40 line-clamp-2">
                {project.description}
              </p>

              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-white/40">Completion</span>
                  <span className="font-medium text-white/60">
                    {getCompletionPercent(project.completedTaskCount, project.taskCount)}%
                  </span>
                </div>
                <ProgressBar
                  value={getCompletionPercent(project.completedTaskCount, project.taskCount)}
                  color={project.color}
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-xs text-white/30">
                <span>{project.taskCount} tasks</span>
                <span>Updated {formatRelativeDate(project.updatedAt)}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
