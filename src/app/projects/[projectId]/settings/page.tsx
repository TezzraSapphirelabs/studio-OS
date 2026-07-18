'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useProject } from '../layout';
import { updateProject, archiveProject, unarchiveProject, deleteProject, type UpdateProjectInput } from '@/services/projects';
import { GlassCard } from '@/components';
import { PROJECT_COLORS } from '@/lib/constants';

export default function ProjectSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { project, userRole, loading: projectLoading } = useProject();

  const [formData, setFormData] = useState<UpdateProjectInput>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        color: project.color,
      });
    }
  }, [project]);

  if (projectLoading || !project) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !project) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    const result = await updateProject(user.uid, project.id, project.name, formData);
    setSaving(false);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Project settings updated.');
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function handleToggleArchive() {
    if (!user || !project) return;
    setSaving(true);
    setError(null);
    const result = project.status === 'archived'
      ? await unarchiveProject(user.uid, project.id, project.name)
      : await archiveProject(user.uid, project.id, project.name);
    
    setSaving(false);
    if (result.error) setError(result.error);
  }

  async function handleDelete() {
    if (!user || !project) return;
    if (!confirm(`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setSaving(true);
    setError(null);
    const result = await deleteProject(user.uid, project.id, project.name);
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push('/projects');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Project Settings</h2>
      </div>

      {(userRole === 'member' || userRole === 'viewer') ? (
        <GlassCard padding="lg">
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Access Denied</h3>
            <p className="text-sm text-white/50">You do not have permission to view or modify project settings. Only Owners and Admins can access this page.</p>
          </div>
        </GlassCard>
      ) : (
        <>
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>
          )}

          {/* General Settings */}
          <GlassCard padding="lg">
            <h3 className="mb-6 text-lg font-medium text-white">General Information</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/70">Project Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Q3 Marketing Site"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors hover:bg-white/[0.04] focus:border-violet-500/50 focus:bg-white/[0.04]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/70">Description</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the project"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors hover:bg-white/[0.04] focus:border-violet-500/50 focus:bg-white/[0.04]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Project Color</label>
                <div className="flex flex-wrap gap-3">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#09090b]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && (
                        <svg className="h-5 w-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-violet-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#09090b] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard padding="lg">
            <h3 className="mb-6 text-lg font-medium text-red-400">Danger Zone</h3>
            <div className="space-y-6">
              
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.04] pb-6">
                <div>
                  <h4 className="text-white font-medium">{project.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}</h4>
                  <p className="text-sm text-white/50 mt-1">
                    {project.status === 'archived' 
                      ? 'Unarchiving will make this project active and visible in your main dashboard again.'
                      : 'Archiving hides the project from active views but preserves all its data.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleArchive}
                  disabled={saving}
                  className="shrink-0 rounded-full border border-white/[0.08] bg-transparent px-5 py-2 text-sm font-medium text-white hover:bg-white/[0.04] focus:outline-none disabled:opacity-50"
                >
                  {project.status === 'archived' ? 'Unarchive' : 'Archive'}
                </button>
              </div>

              {userRole === 'owner' && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-red-400 font-medium">Delete Project</h4>
                    <p className="text-sm text-white/50 mt-1">
                      Permanently delete this project and all of its tasks. This cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="shrink-0 rounded-full border border-red-500/20 bg-transparent px-5 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 focus:outline-none disabled:opacity-50"
                  >
                    Delete Project
                  </button>
                </div>
              )}

            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
