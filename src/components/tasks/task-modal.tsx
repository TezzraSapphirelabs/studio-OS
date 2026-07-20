'use client';

import React, { useState } from 'react';
import { XIcon, CalendarIcon, FolderIcon, UserIcon, TagIcon, PaperclipIcon } from '@/components/icons';
import type { Project, TaskPriority, TaskStatus, Task } from '@/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  taskToEdit?: Task | null;
  onSubmit: (data: {
    title: string;
    description: string;
    projectId: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    tags: string[];
  }) => Promise<void>;
}

export function TaskModal({ isOpen, onClose, projects, taskToEdit, onSubmit }: TaskModalProps) {
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [projectId, setProjectId] = useState(taskToEdit?.projectId || (projects.length > 0 ? projects[0].id : ''));
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'medium');
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '');
  const [assigneeId, setAssigneeId] = useState(taskToEdit?.assigneeId || '');
  const [tagsInput, setTagsInput] = useState(taskToEdit?.tags?.join(', ') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!projectId) {
      setError('Project is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        projectId,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeId: assigneeId.trim() || undefined,
        tags,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl scale-100 transform overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13] shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {taskToEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Task Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Design new landing page"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details about this task..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Project & Assignee */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Project <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <FolderIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
                      disabled={!!taskToEdit} // Can't change project of existing task currently
                    >
                      <option value="" disabled className="bg-[#0f0f13]">Select Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#0f0f13]">{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Assignee (Email or UID)</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      placeholder="Assign to..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
                  >
                    <option value="todo" className="bg-[#0f0f13]">To Do</option>
                    <option value="in-progress" className="bg-[#0f0f13]">In Progress</option>
                    <option value="done" className="bg-[#0f0f13]">Done</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
                  >
                    <option value="low" className="bg-[#0f0f13]">Low</option>
                    <option value="medium" className="bg-[#0f0f13]">Medium</option>
                    <option value="high" className="bg-[#0f0f13]">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Due Date</label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-violet-500 focus:bg-white/10 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Labels / Tags</label>
                <div className="relative">
                  <TagIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. bug, feature, urgent"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            >
              <PaperclipIcon size={16} />
              Attach File (Coming soon)
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
