// ============================================================
// Velonos — Application Constants
// ============================================================

import type { NavItem } from '@/types';

export const APP_NAME = 'Velonos';
export const APP_DESCRIPTION = 'A modern project management operating system for creative teams';
export const APP_VERSION = '0.1.0';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Projects', href: '/projects', icon: 'folder' },
  { label: 'Tasks', href: '/tasks', icon: 'check-square' },
  { label: 'Notes', href: '/notes', icon: 'file-text' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar' },
  { label: 'Files', href: '/files', icon: 'files' },
  { label: 'Analytics', href: '/analytics', icon: 'trending-up' },
  { label: 'Tags', href: '/tags', icon: 'tag' },
  { label: 'AI Workspace', href: '/ai', icon: 'ai' },
  { label: 'Members', href: '/members', icon: 'users' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

export const TASK_STATUS_LABELS: Record<string, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#71717a',
  medium: '#a1a1aa',
  high: '#ffffff',
};

export const PROJECT_COLORS = [
  '#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8',
  '#a1a1aa', '#71717a', '#52525b', '#3f3f46',
];
