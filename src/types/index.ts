// ============================================================
// Studio OS — Core Type Definitions
// ============================================================

export type UserRole = 'Owner' | 'Admin' | 'Developer' | 'Project Manager' | 'Designer' | 'Member' | 'Viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL: string | null;
  bio?: string;
  themePreference?: 'dark' | 'light' | 'system';
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
    mentions: boolean;
    projects: boolean;
    tasks: boolean;
    comments: boolean;
  };
  lastActive?: string;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'active' | 'archived' | 'draft';

export interface Project {
  id: string;
  ownerUid: string;
  memberUids: string[];
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  icon?: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ProjectMember {
  id: string; // `${projectId}_${userId}`
  projectId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: ProjectRole;
  joinedAt: string;
}

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export interface ProjectInvite {
  id: string;
  projectId: string;
  inviterUid: string;
  inviteeEmail: string;
  role: ProjectRole;
  status: InviteStatus;
  token?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  ownerUid: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string; // ISO string
  tags: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  teamMembers: number;
}

export interface ProjectActivity {
  id: string;
  projectId: string; // Used as workspaceId for workspace-level events
  workspaceId?: string; // Optional for backward compatibility, will be populated going forward
  ownerUid: string;
  action: string;
  target: string;
  createdAt: string; // ISO string
}

export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  archived: boolean;
  lastEditedBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type EventPriority = 'low' | 'medium' | 'high';
export type EventStatus = 'upcoming' | 'in-progress' | 'completed';

export interface CalendarEvent {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // HH:mm
  endTime?: string | null; // HH:mm
  isAllDay: boolean;
  priority: EventPriority;
  status: EventStatus;
  projectId?: string;
  archived: boolean;
  reminders?: number[]; // minutes before event
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    until?: string; // YYYY-MM-DD
  };
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface DriveFolder {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveFile {
  id: string;
  projectId: string;
  folderId: string | null;
  name: string;
  size: number;
  type: string;
  url: string;
  storagePath: string;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
}

// ── Phase 6 Extensions ─────────────────────────────────────

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceMember {
  id: string; // `${workspaceId}_${userId}`
  workspaceId: string; // The ownerUid of the workspace
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  inviterUid: string;
  inviteeEmail: string;
  role: WorkspaceRole;
  status: InviteStatus;
  token?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'task_assigned' | 'mention' | 'invite_accepted' | 'project_update' | 'file_uploaded' | 'workspace_event';

export interface Notification {
  id: string;
  userId: string; // The user receiving the notification
  type: NotificationType;
  title: string;
  message: string;
  link?: string; // e.g. `/projects/123/tasks/456`
  read: boolean;
  createdAt: string; // ISO string
}

export interface Comment {
  id: string;
  projectId?: string; // Included for easier security rule verification
  entityId: string; // projectId, taskId, or noteId
  entityType: 'project' | 'task' | 'note';
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string; // can contain mentions like `@username`
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface WorkspaceSettings {
  id: string; // ownerUid
  name: string;
  description: string;
  logoUrl: string | null;
  timezone: string;
  defaultLanguage: string;
  dateFormat: string;
  timeFormat: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
