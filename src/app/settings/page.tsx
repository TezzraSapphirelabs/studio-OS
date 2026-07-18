'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { getDisplayName } from '@/utils';
import DeleteAccountModal from '@/components/modals/DeleteAccountModal';

export default function SettingsPage() {
  const { user, userRole, roleError, roleLoading, retryRoleSync } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const sections = [
    {
      title: 'Profile',
      description: 'Manage your personal information and preferences',
      fields: [
        { label: 'Display Name', value: getDisplayName(user), type: 'text' },
        { label: 'Email', value: user?.email || '', type: 'email' },
        {
          label: 'Role',
          type: 'custom',
          render: () => {
            if (roleLoading) {
              return (
                <div className="flex h-9 w-full items-center px-3 sm:w-64 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm text-white/50">
                  <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Syncing role...
                </div>
              );
            }
            if (roleError) {
              return (
                <div className="flex w-full items-center gap-2 sm:w-64">
                  <div className="flex h-9 flex-1 items-center px-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-400 overflow-hidden text-ellipsis whitespace-nowrap" title="Could not synchronize profile">
                    Sync Failed
                  </div>
                  <button
                    onClick={retryRoleSync}
                    className="flex h-9 items-center justify-center rounded-lg bg-white/[0.06] px-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.1] active:scale-95"
                  >
                    Retry
                  </button>
                </div>
              );
            }
            return (
              <input
                type="text"
                defaultValue={userRole || 'Member'}
                readOnly
                className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none sm:w-64"
              />
            );
          }
        },
      ],
    },
    {
      title: 'Appearance',
      description: 'Customize how Studio OS looks and feels',
      fields: [
        { label: 'Theme', value: 'Dark', type: 'select' },
        { label: 'Accent Color', value: 'Violet', type: 'select' },
        { label: 'Sidebar', value: 'Expanded', type: 'select' },
      ],
    },
    {
      title: 'Notifications',
      description: 'Configure how and when you receive notifications',
      fields: [
        { label: 'Email Notifications', value: 'Enabled', type: 'toggle' },
        { label: 'Push Notifications', value: 'Enabled', type: 'toggle' },
        { label: 'Weekly Digest', value: 'Disabled', type: 'toggle' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your account and workspace preferences
        </p>
      </div>

      {/* Settings sections */}
      <div className="stagger-children space-y-6">
        {sections.map((section) => (
          <GlassCard key={section.title} padding="lg">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-1 text-sm text-white/40">{section.description}</p>
            </div>
            <div className="space-y-5">
              {section.fields.map((field) => (
                <div key={field.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-white/70">{field.label}</label>
                  {field.type === 'custom' ? (
                    field.render && field.render()
                  ) : field.type === 'toggle' ? (
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value === 'Enabled' ? 'bg-violet-600' : 'bg-white/[0.1]'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value === 'Enabled' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  ) : field.type === 'select' ? (
                    <select
                      defaultValue={field.value as string}
                      className="h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] sm:w-64"
                    >
                      <option className="bg-[#0f0f13]">{field.value}</option>
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      defaultValue={field.value as string}
                      readOnly
                      className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-white/[0.05] sm:w-64"
                    />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        ))}

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
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 active:scale-95 sm:w-auto w-full"
            >
              Delete Account
            </button>
          </div>
        </GlassCard>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
      />

      {/* Save button */}
      <div className="flex justify-end">
        <button className="h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]">
          Save Changes
        </button>
      </div>
    </div>
  );
}
