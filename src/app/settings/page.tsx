'use client';

import React from 'react';
import { GlassCard } from '@/components';

export default function SettingsPage() {
  const sections = [
    {
      title: 'Profile',
      description: 'Manage your personal information and preferences',
      fields: [
        { label: 'Display Name', value: 'Sarah Chen', type: 'text' },
        { label: 'Email', value: 'sarah@studio.os', type: 'email' },
        { label: 'Role', value: 'Admin', type: 'text' },
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
                  <label className="text-sm font-medium text-white/60">{field.label}</label>
                  {field.type === 'toggle' ? (
                    <button className={`relative h-6 w-11 rounded-full transition-colors ${
                      field.value === 'Enabled'
                        ? 'bg-violet-600'
                        : 'bg-white/[0.1]'
                    }`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        field.value === 'Enabled' ? 'left-[22px]' : 'left-0.5'
                      }`} />
                    </button>
                  ) : (
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      readOnly
                      className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none transition-all focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 sm:w-64"
                    />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button className="h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]">
          Save Changes
        </button>
      </div>
    </div>
  );
}
