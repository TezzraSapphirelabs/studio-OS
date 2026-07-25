'use client';

import React, { useState } from 'react';
import { CalendarIcon, FolderIcon, UserIcon, TagIcon } from '@/components/icons';
import type { Project, TaskPriority, TaskStatus, Task } from '@/types';
import { GlassModal } from '@/components/ui/glass-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'New Task'}
      className="max-w-2xl p-0 sm:p-0"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-6 rounded-lg bg-white/[0.04] p-3 text-sm text-white/70">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">Task Title <span className="text-white/70">*</span></label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Design new landing page"
                autoFocus
              />
            </div>
            
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                rows={4}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Project & Assignee */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Project <span className="text-white/70">*</span></label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val || '')} disabled={!!taskToEdit}>
                  <SelectTrigger icon={<FolderIcon size={16} />}>
                    <SelectValue placeholder="Select Project">
                      {projects.find(p => p.id === projectId)?.name || "Select Project"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Assignee (Email or UID)</label>
                <Input
                  type="text"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  placeholder="Assign to..."
                  icon={<UserIcon size={16} />}
                />
              </div>
            </div>

            {/* Status & Priority */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Status</label>
                <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Priority</label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                icon={<CalendarIcon size={16} />}
                className="[color-scheme:dark]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">Labels / Tags</label>
              <Input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. bug, feature, urgent"
                icon={<TagIcon size={16} />}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-white/10 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
