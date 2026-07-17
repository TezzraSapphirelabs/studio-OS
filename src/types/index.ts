// ============================================================
// Studio OS — Core Type Definitions
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'draft';
  color: string;
  icon?: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  assigneeId?: string;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
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
