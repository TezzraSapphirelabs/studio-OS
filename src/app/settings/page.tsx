'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { getDisplayName } from '@/utils';
import DeleteAccountModal from '@/components/modals/DeleteAccountModal';
import { fetchUserProfile, updateUserProfile } from '@/services/profile';
import { fetchWorkspaceSettings, saveWorkspaceSettings, deleteWorkspace } from '@/services/settings';
import { subscribeToWorkspaceActivity } from '@/services/activity';
import { type UserProfile, type WorkspaceSettings, type ProjectActivity } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { uploadFileToStorage, getFileUrl } from '@/lib/storage/client';

export default function SettingsPage() {
  const { user, retryRoleSync } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'activity'>('profile');
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Workspace State
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [isWorkspaceSaving, setIsWorkspaceSaving] = useState(false);
  
  const [detectedTimezone] = useState(() => {
    if (typeof window !== 'undefined') return Intl.DateTimeFormat().resolvedOptions().timeZone;
    return '';
  });

  // Activity State
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  
  const workspaceId = user?.uid; // Treat ownerUid as workspaceId

  useEffect(() => {
    if (!user) return;

    const tz = detectedTimezone;

    // Load Profile
    fetchUserProfile(user.uid).then(({ profile }) => {
      if (profile) setProfile(profile);
    });

    // Load Workspace Settings
    if (workspaceId) {
      fetchWorkspaceSettings(workspaceId).then(({ settings }) => {
        if (settings) {
          // If timezone differs, save the auto-detected one in the background
          if (settings.timezone !== tz) {
            settings.timezone = tz;
            saveWorkspaceSettings(workspaceId, settings, user.uid);
          }
          setWorkspace(settings);
        } else {
          // Initialize defaults
          const defaults = {
            id: workspaceId,
            name: 'My Workspace',
            description: '',
            logoUrl: null,
            timezone: tz,
            defaultLanguage: 'en',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setWorkspace(defaults);
          saveWorkspaceSettings(workspaceId, defaults, user.uid);
        }
      });
    }
  }, [user, workspaceId, detectedTimezone]);

  useEffect(() => {
    if (!workspaceId || activeTab !== 'activity') return;
    const unsub = subscribeToWorkspaceActivity(workspaceId, (data) => {
      setActivities(data);
    });
    return () => unsub();
  }, [workspaceId, activeTab]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsProfileSaving(true);
    await updateUserProfile(user.uid, {
      displayName: profile.displayName,
      bio: profile.bio,
      photoURL: profile.photoURL,
      themePreference: profile.themePreference,
      notificationPreferences: profile.notificationPreferences
    });
    await retryRoleSync();
    setIsProfileSaving(false);
    toast('Profile updated successfully', 'success');
  };

  const handleWorkspaceSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workspaceId || !workspace) return;
    setIsWorkspaceSaving(true);
    await saveWorkspaceSettings(workspaceId, {
      name: workspace.name,
      description: workspace.description,
      logoUrl: workspace.logoUrl,
      timezone: workspace.timezone,
      defaultLanguage: workspace.defaultLanguage,
      dateFormat: workspace.dateFormat,
      timeFormat: workspace.timeFormat
    }, user.uid);
    setIsWorkspaceSaving(false);
    toast('Workspace settings saved', 'success');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'workspace') => {
    if (!e.target.files || e.target.files.length === 0 || !user || !workspaceId) return;
    const file = e.target.files[0];
    const key = `settings/${type}/${user.uid}_${Date.now()}_${file.name}`;
    
    uploadFileToStorage(
      file,
      key,
      undefined,
      (err) => alert(`Upload failed: ${err.message}`),
      () => {
        const url = getFileUrl(key);
        if (type === 'profile' && profile) {
          setProfile({ ...profile, photoURL: url });
        } else if (type === 'workspace' && workspace) {
          setWorkspace({ ...workspace, logoUrl: url });
        }
      }
    );
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId || !user) return;
    if (confirm('Are you sure you want to permanently delete this workspace and all its data? This cannot be undone.')) {
      const { error } = await deleteWorkspace(workspaceId, user.uid);
      if (error) alert(error);
      else {
        alert('Workspace deleted. (In a full production environment, this would delete all related collections via a Cloud Function).');
        window.location.reload();
      }
    }
  };

  if (!user || (!profile && activeTab === 'profile') || (!workspace && activeTab === 'workspace')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
      </div>
    );
  }

  const isOwner = workspaceId === user.uid;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your account, workspace preferences, and view audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-white/[0.02] p-1 border border-white/[0.04]">
        {(['profile', 'workspace', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white/[0.06] text-white shadow-sm'
                : 'text-white/50 hover:bg-white/[0.02] hover:text-white/80'
            } capitalize`}
          >
            {tab === 'activity' ? 'Audit & Activity' : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && profile && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <GlassCard padding="lg">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Public Profile</h2>
                <p className="mt-1 text-sm text-white/40">Manage your personal information.</p>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Profile Photo</label>
                  <div className="flex items-center gap-4 sm:w-64">
                    {profile.photoURL ? (
                      <Image src={profile.photoURL} alt="Profile" width={40} height={40} className="h-10 w-10 rounded-full object-cover border border-white/10" unoptimized />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 font-bold">
                        {profile.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="cursor-pointer text-sm font-medium text-violet-400 hover:text-violet-300">
                      Change
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'profile')} />
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Display Name</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] sm:w-64"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/50 outline-none cursor-not-allowed sm:w-64"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                  <label className="text-sm font-medium text-white/70 pt-2">Bio</label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="h-24 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] sm:w-64 resize-none"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard padding="lg">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Appearance</h2>
                <p className="mt-1 text-sm text-white/40">Customize how Studio OS looks for you.</p>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Theme</label>
                  <select
                    value={profile.themePreference || 'dark'}
                    onChange={(e) => {
                      const newTheme = e.target.value as UserProfile['themePreference'];
                      setProfile({ ...profile, themePreference: newTheme });
                      
                      const html = document.documentElement;
                      if (newTheme === 'dark') {
                        html.classList.add('dark');
                      }
                    }}
                    className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] sm:w-64"
                  >
                    <option value="dark" className="bg-[#0f0f13]">Dark</option>
                  </select>
                </div>
              </div>
            </GlassCard>

            <GlassCard padding="lg">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                <p className="mt-1 text-sm text-white/40">Choose what you get notified about.</p>
              </div>
              <div className="space-y-4">
                {(['email', 'inApp', 'mentions', 'projects', 'tasks', 'comments'] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white/70 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const currentPrefs = profile.notificationPreferences || ({} as NonNullable<UserProfile['notificationPreferences']>);
                        const currentValue = currentPrefs[key] !== false; // Default is true
                        setProfile({
                          ...profile,
                          notificationPreferences: {
                            ...currentPrefs,
                            [key]: !currentValue
                          } as NonNullable<UserProfile['notificationPreferences']>
                        });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.notificationPreferences?.[key] !== false ? 'bg-violet-600' : 'bg-white/[0.1]'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.notificationPreferences?.[key] !== false ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProfileSaving}
                className="flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {isProfileSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
            
            {/* Danger Zone */}
            <GlassCard padding="lg" className="border-red-500/20 bg-red-500/[0.02]">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
                <p className="mt-1 text-sm text-white/40">Irreversible actions related to your account.</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Delete Account</h3>
                  <p className="text-xs text-white/40">Permanently remove your account and all associated data.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 active:scale-95 sm:w-auto w-full"
                >
                  Delete Account
                </button>
              </div>
            </GlassCard>
          </form>
        )}

        {/* WORKSPACE TAB */}
        {activeTab === 'workspace' && workspace && (
          <form onSubmit={handleWorkspaceSave} className="space-y-6">
            <GlassCard padding="lg">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Workspace Details</h2>
                <p className="mt-1 text-sm text-white/40">Manage your organization&apos;s core details.</p>
              </div>
              
              {!isOwner && (
                <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-400">
                  Only the workspace owner can modify these settings.
                </div>
              )}

              <div className="space-y-5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Workspace Logo</label>
                  <div className="flex items-center gap-4 sm:w-64">
                    {workspace.logoUrl ? (
                      <Image src={workspace.logoUrl} alt="Workspace Logo" width={40} height={40} className="h-10 w-10 rounded-xl object-cover border border-white/10" unoptimized />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 border border-white/10">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    {isOwner && (
                      <label className="cursor-pointer text-sm font-medium text-violet-400 hover:text-violet-300">
                        Upload
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'workspace')} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Workspace Name</label>
                  <input
                    type="text"
                    value={workspace.name}
                    onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                    disabled={!isOwner}
                    className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] sm:w-64 disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                  <label className="text-sm font-medium text-white/70 pt-2">Description</label>
                  <textarea
                    value={workspace.description || ''}
                    onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
                    disabled={!isOwner}
                    placeholder="Describe your workspace..."
                    className="h-24 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] sm:w-64 resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard padding="lg">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Localization</h2>
                <p className="mt-1 text-sm text-white/40">Configure timezone and regional formats.</p>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Timezone</label>
                  <div className="flex h-9 w-full sm:w-64 items-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/60">
                    {detectedTimezone || workspace.timezone} (Auto-detected)
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">Language</label>
                  <div className="flex h-9 w-full sm:w-64 items-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/60">
                    English (Default)
                  </div>
                </div>
              </div>
            </GlassCard>

            {isOwner && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isWorkspaceSaving}
                  className="flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                >
                  {isWorkspaceSaving ? 'Saving...' : 'Save Workspace Changes'}
                </button>
              </div>
            )}
            
            {/* Workspace Danger Zone */}
            {isOwner && (
              <GlassCard padding="lg" className="border-red-500/20 bg-red-500/[0.02]">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-red-500">Workspace Administration</h2>
                  <p className="mt-1 text-sm text-white/40">Irreversible actions related to your workspace.</p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Delete Workspace</h3>
                    <p className="text-xs text-white/40">Permanently remove the workspace, all projects, members, and data.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteWorkspace}
                    className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 active:scale-95 sm:w-auto w-full"
                  >
                    Delete Workspace
                  </button>
                </div>
              </GlassCard>
            )}
          </form>
        )}

        {/* ACTIVITY LOG TAB */}
        {activeTab === 'activity' && (
          <GlassCard padding="none" className="overflow-hidden">
            <div className="p-6 border-b border-white/[0.04]">
              <h2 className="text-lg font-semibold text-white">Audit & Activity Log</h2>
              <p className="mt-1 text-sm text-white/40">A chronologically ordered list of all actions in this workspace.</p>
            </div>
            {activities.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-white/40">
                No activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/60">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/90">
                        <span className="font-semibold text-white">{getDisplayName(user)}</span> {/* Ideally fetch user names */}
                        {' '}{activity.action}{' '}
                        {activity.target && <span className="font-medium text-violet-400">{activity.target}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
      />
    </div>
  );
}
