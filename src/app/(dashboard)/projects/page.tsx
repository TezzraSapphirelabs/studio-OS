'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GlassCard, ProgressBar, SkeletonCard, EmptyState, ErrorState } from '@/components';
import { FolderIcon, PlusIcon, SearchIcon, EditIcon, ArchiveIcon, ArchiveRestoreIcon, TrashIcon, MoreVerticalIcon } from '@/components/icons';
import { Button, Input, GlassModal } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import {
  subscribeToProjects,
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  type CreateProjectInput,
} from '@/services/projects';
import { getCompletionPercent, formatRelativeDate } from '@/utils';
import type { Project, ProjectStatus } from '@/types';

// ── Color palette for new projects ─────────────────────────


// ── Status badge ───────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-white/[0.04] text-white/70 ring-white/10',
    draft: 'bg-white/[0.04] text-white/70 ring-white/10',
    archived: 'bg-white/[0.04] text-white/70 ring-white/10',
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
      <Button
        variant="icon"
        size="icon"
        onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
      >
        <MoreVerticalIcon size={14} />
      </Button>
      {open && (
        <div className="glass-panel absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); setOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 transition-colors hover:bg-white/[0.04]">
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, color: '#ffffff' });
  }

  return (
    <GlassModal isOpen onClose={onClose} title={project ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Project Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Brand Redesign"
            required
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Description</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this project about?" rows={3} disabled={saving}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-white/20 focus:bg-white/[0.05] disabled:opacity-50 resize-none"
          />
        </div>

        {/* Removed Color Picker for Monochrome Theme */}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="default" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving || !name.trim()} className="flex-1">
            {saving ? (
              <svg className="mx-auto h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : project ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </GlassModal>
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
    <GlassModal isOpen onClose={onClose} hideCloseButton className="text-center max-w-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
        <TrashIcon size={22} />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white">Delete Project</h2>
      <p className="mb-6 text-sm text-white/50">
        Are you sure you want to delete <strong className="text-white/80">{projectName}</strong>? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <Button onClick={onClose} disabled={deleting} className="flex-1">
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={deleting} className="flex-1">
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </GlassModal>
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

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToProjects(
      user.uid,
      (data) => {
        setProjects(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

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
      setToast({ type: 'success', text: `"${project.name}" archived.` });
    }
  }

  async function handleUnarchive(project: Project) {
    if (!user) return;
    const result = await unarchiveProject(user.uid, project.id, project.name);
    if (result.error) {
      setToast({ type: 'error', text: result.error });
    } else {
      setToast({ type: 'success', text: `"${project.name}" unarchived.` });
    }
  }

  async function handleDelete() {
    if (!deletingProject || !user) return;
    setDeleting(true);
    const result = await deleteProject(user.uid, deletingProject.id, deletingProject.name);
    setDeleting(false);
    if (result.error) {
      setToast({ type: 'error', text: result.error });
    } else {
      setToast({ type: 'success', text: `"${deletingProject.name}" deleted.` });
    }
    setDeletingProject(null);
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[110] animate-in slide-in-from-top-4 rounded-xl border px-5 py-3 text-sm shadow-2xl backdrop-blur-xl ${
          toast.type === 'success'
            ? 'border-white/10 bg-white text-black/[0.1] text-white/50'
            : 'border-white/10 bg-white/10/[0.1] text-white/50'
        }`}>
          {toast.text}
        </div>
      )}


      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-white/40">
            {loading ? 'Loading projects…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} in your workspace`}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <PlusIcon size={16} className="mr-2" />
          New Project
        </Button>
      </div>

      {/* Search + Filter Bar */}
      {!loading && !error && projects.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex-1">
            <Input
              icon={<SearchIcon size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
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
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
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
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : projects.length === 0 ? (
        <EmptyState 
          icon={<FolderIcon size={36} />}
          title="No projects yet"
          description="Create your first project to start organizing your work, tracking tasks, and collaborating with your team."
          actionLabel="New Project"
          actionIcon={<PlusIcon size={16} />}
          onAction={() => setShowModal(true)}
          primary={true}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState 
          icon={<SearchIcon size={36} />}
          title="No matching projects"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <GlassCard key={project.id} href={`/projects/${project.id}`} hover padding="md" className="flex flex-col">
              {/* Accent glow */}
              <div
                className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-15 blur-2xl pointer-events-none"
                style={{ backgroundColor: '#ffffff' }}
              />

              <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04]"
                    >
                      <FolderIcon size={20} className="text-white/70" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                      <p className="text-xs text-white/40">{project.memberCount} member{project.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 relative z-10">
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
