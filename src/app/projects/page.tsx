'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GlassCard, ProgressBar } from '@/components';
import { FolderIcon, PlusIcon, SearchIcon, FilterIcon, EditIcon, ArchiveIcon, ArchiveRestoreIcon, TrashIcon, MoreVerticalIcon, XIcon } from '@/components/icons';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchProjects,
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@/services/projects';
import { getCompletionPercent, formatRelativeDate } from '@/utils';
import type { Project, ProjectStatus } from '@/types';
import InvitesList from './invites-list';

// ── Color palette for new projects ─────────────────────────

const PROJECT_COLORS = [
  '#8b5cf6', '#06b6d4', '#f43f5e', '#22c55e',
  '#f59e0b', '#6366f1', '#ec4899', '#14b8a6',
];

// ── Skeleton Card ──────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/[0.08]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-white/[0.08]" />
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.06]" />
        <div className="flex justify-between border-t border-white/[0.04] pt-3">
          <div className="h-3 w-16 rounded bg-white/[0.06]" />
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
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
}

// ── Action Menu ────────────────────────────────────────────

function ActionMenu({ project, onEdit, onArchive, onUnarchive, onDelete }: {
  project: Project;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white/60"
      >
        <MoreVerticalIcon size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-white/[0.1] bg-[#12121a] shadow-2xl animate-fade-in-up">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); setOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
            <EditIcon size={13} /> Edit
          </button>
          {project.status !== 'archived' ? (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onArchive(); setOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
              <ArchiveIcon size={13} /> Archive
            </button>
          ) : (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnarchive(); setOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
              <ArchiveRestoreIcon size={13} /> Unarchive
            </button>
          )}
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); setOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 transition-colors hover:bg-red-500/10">
            <TrashIcon size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Create / Edit Modal ────────────────────────────────────

function ProjectModal({ project, onClose, onSave, saving }: {
  project?: Project | null;
  onClose: () => void;
  onSave: (data: CreateProjectInput) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, color });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0e0e14] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white">
            <XIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Project Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brand Redesign" required disabled={saving}
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this project about?" rows={3} disabled={saving}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50 resize-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Color</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e0e14] scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:bg-white/[0.06] disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? (
                <svg className="mx-auto h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ──────────────────────────────

function DeleteModal({ projectName, onClose, onConfirm, deleting }: {
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0e0e14] p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <TrashIcon size={22} />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white">Delete Project</h2>
        <p className="mb-6 text-sm text-white/50">
          Are you sure you want to delete <strong className="text-white/80">{projectName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:bg-white/[0.06] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 h-10 rounded-xl bg-red-600 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
        <FolderIcon size={36} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">No projects yet</h3>
      <p className="mb-6 max-w-sm text-sm text-white/40">
        Create your first project to start organizing your work, tracking tasks, and collaborating with your team.
      </p>
      <button
        onClick={onCreateNew}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]"
      >
        <PlusIcon size={16} />
        New Project
      </button>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <XIcon size={36} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">Failed to load projects</h3>
      <p className="mb-6 max-w-sm text-sm text-white/40">{message}</p>
      <button onClick={onRetry}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/[0.06] px-5 text-sm font-medium text-white transition-all hover:bg-white/[0.1] active:scale-[0.98]">
        Retry
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

export default function ProjectsPage() {
  const { user } = useAuth();

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Fetch projects
  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await fetchProjects(user.uid);
    if (result.error) {
      setError(result.error);
    } else {
      setProjects(result.projects || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Auto-retry on reconnect
  useEffect(() => {
    const handleOnline = () => { if (error) loadProjects(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [error, loadProjects]);

  // Filtered + searched projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [projects, search, statusFilter]);

  // ── Handlers ───────────────────────────────────────────

  async function handleCreate(input: CreateProjectInput) {
    if (!user) return;
    setSaving(true);
    const result = await createProject(user.uid, input);
    setSaving(false);
    if (result.error) {
      setToast({ type: 'error', text: result.error });
    } else if (result.project) {
      setProjects((prev) => [result.project!, ...prev]);
      setShowModal(false);
      setToast({ type: 'success', text: `"${result.project.name}" created!` });
    }
  }

  async function handleUpdate(input: CreateProjectInput) {
    if (!editingProject || !user) return;
    setSaving(true);
    const result = await updateProject(user.uid, editingProject.id, editingProject.name, input);
    setSaving(false);
    if (result.error) {
      setToast({ type: 'error', text: result.error });
    } else {
      setProjects((prev) => prev.map((p) =>
        p.id === editingProject.id
          ? { ...p, name: input.name, description: input.description, color: input.color, updatedAt: new Date().toISOString() }
          : p
      ));
      setEditingProject(null);
      setToast({ type: 'success', text: 'Project updated!' });
    }
  }

  async function handleArchive(project: Project) {
    if (!user) return;
    const result = await archiveProject(user.uid, project.id, project.name);
    if (result.error) {
      setToast({ type: 'error', text: result.error });
    } else {
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: 'archived' as const, updatedAt: new Date().toISOString() } : p));
      setToast({ type: 'success', text: `"${project.name}" archived.` });
    }
  }

  async function handleUnarchive(project: Project) {
    if (!user) return;
    const result = await unarchiveProject(user.uid, project.id, project.name);
    if (result.error) {
      setToast({ type: 'error', text: result.error });
    } else {
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: 'active' as const, updatedAt: new Date().toISOString() } : p));
      setToast({ type: 'success', text: `"${project.name}" unarchived.` });
    }
  }

  async function handleDelete() {
    if (!deletingProject || !user) return;
    setSaving(true);
    const result = await deleteProject(user.uid, deletingProject.id, deletingProject.name);
    setDeleting(false);
    if (result.error) {
      setToast({ type: 'error', text: result.error });
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setToast({ type: 'success', text: `"${deletingProject.name}" deleted.` });
    }
    setDeletingProject(null);
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[110] animate-fade-in-up rounded-xl border px-5 py-3 text-sm shadow-2xl backdrop-blur-xl ${
          toast.type === 'success'
            ? 'border-green-500/20 bg-green-500/[0.1] text-green-300'
            : 'border-red-500/20 bg-red-500/[0.1] text-red-300'
        }`}>
          {toast.text}
        </div>
      )}

      <InvitesList />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-white/40">
            {loading ? 'Loading projects…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} in your workspace`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]"
        >
          <PlusIcon size={16} />
          New Project
        </button>
      </div>

      {/* Search + Filter Bar */}
      {!loading && !error && projects.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-violet-600/20 text-violet-300 shadow-sm'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadProjects} />
      ) : projects.length === 0 ? (
        <EmptyState onCreateNew={() => setShowModal(true)} />
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchIcon size={40} className="mb-4 text-white/15" />
          <h3 className="mb-1 text-base font-medium text-white/60">No matching projects</h3>
          <p className="text-sm text-white/30">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <GlassCard key={project.id} href={`/projects/${project.id}`} hover padding="md" className="flex flex-col">
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
                      <FolderIcon size={20} style={{ color: project.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                      <p className="text-xs text-white/40">{project.memberCount} member{project.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={project.status} />
                    <ActionMenu
                      project={project}
                      onEdit={() => setEditingProject(project)}
                      onArchive={() => handleArchive(project)}
                      onUnarchive={() => handleUnarchive(project)}
                      onDelete={() => setDeletingProject(project)}
                    />
                  </div>
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
                  <span>{project.taskCount} task{project.taskCount !== 1 ? 's' : ''}</span>
                  <span>Updated {formatRelativeDate(project.updatedAt)}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreate} saving={saving} />
      )}

      {/* Edit Modal */}
      {editingProject && (
        <ProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <DeleteModal
          projectName={deletingProject.name}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
