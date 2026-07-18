'use client';

import React from 'react';
import { useProject } from './layout';
import { GlassCard, ProgressBar } from '@/components';
import { getCompletionPercent, formatRelativeDate } from '@/utils';
import { FolderIcon, CheckSquareIcon } from '@/components/icons';
import Link from 'next/link';

export default function ProjectOverviewPage() {
  const { project, loading, error } = useProject();

  if (loading || error || !project) return null; // handled by layout

  const completion = getCompletionPercent(project.completedTaskCount, project.taskCount);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard padding="sm" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <CheckSquareIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-white/40">Total Tasks</p>
            <p className="text-xl font-bold text-white">{project.taskCount}</p>
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
            <CheckSquareIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-white/40">Completed</p>
            <p className="text-xl font-bold text-white">{project.completedTaskCount}</p>
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <FolderIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-white/40">Created</p>
            <p className="text-sm font-semibold text-white mt-1">{formatRelativeDate(project.createdAt)}</p>
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            <FolderIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-white/40">Updated</p>
            <p className="text-sm font-semibold text-white mt-1">{formatRelativeDate(project.updatedAt)}</p>
          </div>
        </GlassCard>
      </div>

      <GlassCard padding="lg">
        <h2 className="mb-6 text-lg font-semibold text-white">Project Progress</h2>
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-white/60">Overall Completion</span>
          <span className="font-bold text-white" style={{ color: project.color }}>
            {completion}%
          </span>
        </div>
        <ProgressBar value={completion} color={project.color} />
        
        <div className="mt-8">
          <Link
            href={`/projects/${project.id}/tasks`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/[0.04] px-5 text-sm font-medium text-white transition-all hover:bg-white/[0.08]"
          >
            Manage Tasks
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
