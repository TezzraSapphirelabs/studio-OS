'use client';

import React from 'react';
import { XIcon, CalendarIcon, UserIcon, TagIcon, EditIcon, TrashIcon, CheckSquareIcon } from '@/components/icons';
import type { Task, Project } from '@/types';
import { TASK_STATUS_LABELS, PRIORITY_COLORS } from '@/lib/constants';

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  project: Project | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskDrawer({ isOpen, onClose, task, project, onEdit, onDelete }: TaskDrawerProps) {
  if (!isOpen || !task) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-white/10 bg-[#0f0f13] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                task.status === 'done' ? 'bg-emerald-500/10' : 'bg-white/[0.04]'
              }`}>
                <CheckSquareIcon size={16} className={task.status === 'done' ? 'text-emerald-400' : 'text-white/30'} />
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                task.status === 'done'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : task.status === 'in-progress'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-white/[0.04] text-white/40'
              }`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                title="Edit Task"
              >
                <EditIcon size={18} />
              </button>
              <button
                onClick={onDelete}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Delete Task"
              >
                <TrashIcon size={18} />
              </button>
              <div className="mx-1 h-4 w-px bg-white/10" />
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="mb-6 text-xl font-bold text-white">{task.title}</h2>

            {/* Meta Grid */}
            <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div>
                <span className="mb-1 block text-xs font-medium text-white/40">Project</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: project?.color || '#8b5cf6' }} />
                  <span className="text-sm font-medium text-white/80">{project?.name || 'Unknown'}</span>
                </div>
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-white/40">Priority</span>
                <span className="text-sm font-medium capitalize" style={{ color: PRIORITY_COLORS[task.priority] }}>
                  {task.priority}
                </span>
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-white/40">Assignee</span>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <UserIcon size={14} className="text-white/40" />
                  {task.assigneeId || 'Unassigned'}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-white/40">Due Date</span>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <CalendarIcon size={14} className="text-white/40" />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="mb-3 text-sm font-semibold text-white">Description</h3>
              {task.description ? (
                <div className="prose prose-invert max-w-none text-sm text-white/70">
                  <p className="whitespace-pre-wrap">{task.description}</p>
                </div>
              ) : (
                <p className="text-sm italic text-white/30">No description provided.</p>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-semibold text-white">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/60">
                      <TagIcon size={12} className="text-white/30" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder for Comments / Activity */}
            <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-white/40">Comments and Activity coming in Step 2</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
