// ============================================================
// Studio OS — Application Constants
// ============================================================

import type { NavItem } from '@/types';

export const APP_NAME = 'Studio OS';
export const APP_DESCRIPTION = 'A modern project management operating system for creative teams';
export const APP_VERSION = '0.1.0';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Projects', href: '/projects', icon: 'folder' },
  { label: 'Tasks', href: '/tasks', icon: 'check-square' },
  { label: 'Notes', href: '/notes', icon: 'file-text' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar' },
  { label: 'Files', href: '/files', icon: 'files' },
  { label: 'AI Workspace', href: '/ai', icon: 'ai' },
  { label: 'Team', href: '/team', icon: 'users' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

export const TASK_STATUS_LABELS: Record<string, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6366f1',
  medium: '#f59e0b',
  high: '#f97316',
};

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];
