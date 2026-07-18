'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useProject } from '../layout';
import { useAuth } from '@/contexts/auth-context';
import { GlassCard } from '@/components';
import {
  subscribeToProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  type CreateTaskInput,
} from '@/services/tasks';
import { type Task, type TaskStatus, type TaskPriority } from '@/types';
import {
  PlusIcon,
  SearchIcon,
  CheckCircleIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  TrashIcon,
  EditIcon,
  XIcon,
} from '@/components/icons';
import { formatRelativeDate } from '@/utils';

// ── Helpers ────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10', icon: ArrowUpIcon },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: ArrowRightIcon },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: ArrowDownIcon },
};



// ── Components ─────────────────────────────────────────────

function TaskModal({
  task,
  projectId,
  onClose,
  saving,
}: {
  task?: Task | null;
  projectId: string;
  onClose: () => void;
  saving: boolean;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !user) return;
    
    const input: CreateTaskInput = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    };

    if (task) {
      await updateTask(user.uid, projectId, task.id, task.title, task.status, input);
    } else {
      await createTask(user.uid, projectId, input);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0e0e14] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white">
            <XIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Title</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={saving}
              placeholder="What needs to be done?"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving}
              placeholder="Add more details..." rows={3}
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Status</label>
              <select
                value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} disabled={saving}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#12121a] px-4 text-sm text-white outline-none transition-all focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Priority</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} disabled={saving}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#12121a] px-4 text-sm text-white outline-none transition-all focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Due Date</label>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={saving}
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 [color-scheme:dark]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:bg-white/[0.06] disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !title.trim()}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function ProjectTasksPage() {
  const { user } = useAuth();
  const { project, userRole, loading: projectLoading } = useProject();

  const canCreateTask = userRole !== 'viewer' && userRole !== null;
  const canManageAllTasks = userRole === 'owner' || userRole === 'admin';
  const canDeleteTask = canManageAllTasks;
  const canEditTask = (task: Task) => {
    if (canManageAllTasks) return true;
    if (userRole === 'member') return task.assigneeId === user?.uid || !task.assigneeId;
    return false;
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Subscribe to tasks
  useEffect(() => {
    if (!user || !project) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsubscribe = subscribeToProjectTasks(user.uid, project.id, (data, err) => {
      if (err) setError(err);
      else setTasks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, project]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, search, statusFilter]);

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    if (!project || !user) return;
    await updateTask(user.uid, project.id, task.id, task.title, task.status, { status: newStatus });
  }

  async function handleDelete(task: Task) {
    if (!project || !user) return;
    if (confirm(`Delete task "${task.title}"?`)) {
      await deleteTask(user.uid, project.id, task.id, task.title, task.status);
    }
  }

  if (projectLoading) return null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 hidden sm:flex">
            {(['all', 'todo', 'in-progress', 'done'] as const).map((s) => (
              <button
                key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  statusFilter === s ? 'bg-violet-600/20 text-violet-300 shadow-sm' : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                }`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        {canCreateTask && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white/[0.08] px-5 text-sm font-semibold text-white transition-all hover:bg-white/[0.12] active:scale-[0.98]"
          >
            <PlusIcon size={16} /> New Task
          </button>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-6 text-center text-red-400">
          {error}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
            <CheckCircleIcon size={32} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">No tasks yet</h3>
          <p className="mb-6 text-sm text-white/40">Add your first task to get started.</p>
          {canCreateTask && (
            <button onClick={() => setShowModal(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98]">
              <PlusIcon size={16} /> Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const PIcon = priorityConfig.icon;
            
            return (
              <GlassCard key={task.id} hover padding="sm" className="group flex flex-col gap-4 sm:flex-row sm:items-center">
                
                {/* Status Toggle & Content */}
                <div className="flex flex-1 items-start gap-4">
                  <button
                    onClick={() => handleStatusChange(task, task.status === 'done' ? 'todo' : 'done')}
                    disabled={!canEditTask(task)}
                    className={`mt-1 shrink-0 rounded-full transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 ${task.status === 'done' ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                  >
                    <CheckCircleIcon size={22} />
                  </button>
                  
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold transition-colors ${task.status === 'done' ? 'text-white/40 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="mt-1 text-xs text-white/40 line-clamp-1">{task.description}</p>
                    )}
                  </div>
                </div>

                {/* Meta & Actions */}
                <div className="flex items-center gap-4 sm:ml-auto">
                  <div className="flex items-center gap-2 text-xs">
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1 text-white/50">
                        <CalendarIcon size={12} />
                        {formatRelativeDate(task.dueDate)}
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 rounded-lg ${priorityConfig.bg} px-2.5 py-1 ${priorityConfig.color}`}>
                      <PIcon size={12} />
                      <span className="capitalize">{task.priority}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-l border-white/[0.08] pl-4 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 sm:pl-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      disabled={!canEditTask(task)}
                      className="h-8 rounded-lg border border-white/[0.08] bg-[#12121a] px-2 text-xs text-white outline-none disabled:opacity-50"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    {canEditTask(task) && (
                      <button onClick={() => setEditingTask(task)} className="p-1.5 text-white/30 hover:text-white transition-colors">
                        <EditIcon size={14} />
                      </button>
                    )}
                    {canDeleteTask && (
                      <button onClick={() => handleDelete(task)} className="p-1.5 text-red-400/50 hover:text-red-400 transition-colors">
                        <TrashIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </GlassCard>
            );
          })}
        </div>
      )}

      {showModal && <TaskModal projectId={project!.id} onClose={() => setShowModal(false)} saving={false} />}
      {editingTask && <TaskModal task={editingTask} projectId={project!.id} onClose={() => setEditingTask(null)} saving={false} />}
    </div>
  );
}
