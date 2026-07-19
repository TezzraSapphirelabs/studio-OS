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
  projectId: string;
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
