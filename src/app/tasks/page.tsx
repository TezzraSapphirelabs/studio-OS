'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components';
import { PlusIcon, CheckSquareIcon, SearchIcon } from '@/components/icons';
import { TASK_STATUS_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import type { Task, Project, TaskStatus, TaskPriority } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToProjects } from '@/services/projects';
import { useAllProjectsTasks } from '@/hooks';
import { TaskModal, TaskDrawer } from '@/components';
import { createTask, updateTask, deleteTask } from '@/services/tasks';

const STATUSES = ['all', 'todo', 'in-progress', 'done'] as const;

export default function TasksPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const { tasks, loading: tasksLoading, error } = useAllProjectsTasks(user?.uid, projects);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToProjects(
      user.uid,
      (data) => setProjects(data),
      (err) => console.error('Failed to load projects:', err)
    );
    return () => unsub();
  }, [user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || 'Unknown';

  const getProjectColor = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.color || '#8b5cf6';

  const priorityDot = (priority: Task['priority']) => (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: PRIORITY_COLORS[priority] }}
    />
  );

  const handleCreateOrUpdateTask = async (data: {
    title: string;
    description: string;
    projectId: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    tags: string[];
  }) => {
    if (!user) return;
    
    if (selectedTask && isModalOpen) {
      // Editing existing task
      const { error } = await updateTask(user.uid, data.projectId, selectedTask.id, selectedTask.title, selectedTask.status, data);
      if (error) throw new Error(error);
      
      // Update selected task in drawer if open
      if (isDrawerOpen) {
        setSelectedTask({ ...selectedTask, ...data, updatedAt: new Date().toISOString() });
      }
    } else {
      // Creating new task
      const { error } = await createTask(user.uid, data.projectId, data);
      if (error) throw new Error(error);
    }
  };

  const handleDeleteTask = async () => {
    if (!user || !selectedTask) return;
    if (confirm('Are you sure you want to delete this task?')) {
      const { error } = await deleteTask(user.uid, selectedTask.projectId, selectedTask.id, selectedTask.title, selectedTask.status);
      if (error) {
        alert(error);
      } else {
        setIsDrawerOpen(false);
        setSelectedTask(null);
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleEditClick = () => {
    // Open modal to edit the currently selected task
    setIsModalOpen(true);
  };

  const statusColumnCount = (status: string) => tasks.filter((t) => t.status === status).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Tasks</h1>
          <p className="mt-1 text-sm text-white/40">
            {tasks.length} total tasks across {projects.length} projects
          </p>
        </div>
        <button 
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]"
        >
          <PlusIcon size={16} />
          New Task
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-white/[0.1] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
              }`}
            >
              {status === 'all' ? 'All' : TASK_STATUS_LABELS[status as TaskStatus]} 
              {' '}({status === 'all' ? tasks.length : statusColumnCount(status)})
            </button>
          ))}

          <div className="mx-2 h-6 w-px bg-white/10" />

          {/* Priority filter */}
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-white/40 outline-none transition-colors hover:bg-white/[0.04] focus:border-violet-500 focus:text-white"
          >
            <option value="all" className="bg-[#0f0f13]">All Priorities</option>
            <option value="high" className="bg-[#0f0f13]">High</option>
            <option value="medium" className="bg-[#0f0f13]">Medium</option>
            <option value="low" className="bg-[#0f0f13]">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500 focus:bg-white/10"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {tasksLoading && tasks.length === 0 && !error && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!tasksLoading && tasks.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/20">
            <CheckSquareIcon size={32} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">No tasks found</h3>
          <p className="mb-6 max-w-sm text-sm text-white/40">
            {projects.length === 0 
              ? "You don't have any active projects yet. Create a project first to add tasks."
              : "Get started by creating a new task or adjust your filters."}
          </p>
          {projects.length > 0 && (
            <button 
              onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              <PlusIcon size={16} />
              Create Task
            </button>
          )}
        </div>
      )}

      {/* Empty filter state */}
      {!tasksLoading && tasks.length > 0 && filteredTasks.length === 0 && !error && (
        <div className="py-12 text-center text-white/40">
          No tasks match your current filters.
        </div>
      )}

      {/* Task list */}
      <div className="stagger-children space-y-3">
        {filteredTasks.map((task) => (
          <GlassCard key={task.id} hover padding="none" onClick={() => handleTaskClick(task)} className="cursor-pointer">
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Status icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                task.status === 'done'
                  ? 'bg-emerald-500/10'
                  : 'bg-white/[0.04]'
              }`}>
                <CheckSquareIcon
                  size={16}
                  className={task.status === 'done' ? 'text-emerald-400' : 'text-white/30'}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {priorityDot(task.priority)}
                  <p className={`truncate text-sm font-medium ${
                    task.status === 'done' ? 'text-white/40 line-through' : 'text-white'
                  }`}>
                    {task.title}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: getProjectColor(task.projectId) }}
                  >
                    {getProjectName(task.projectId)}
                  </span>
                  {task.tags && task.tags.map((tag) => (
                    <span key={tag} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/30">
                      {tag}
                    </span>
                  ))}
                  {task.dueDate && (
                    <span className="text-[10px] text-white/30">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex ${
                task.status === 'done'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : task.status === 'in-progress'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-white/[0.04] text-white/40'
              }`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>

              {/* Priority label */}
              <span
                className="hidden shrink-0 text-xs font-medium capitalize lg:block"
                style={{ color: PRIORITY_COLORS[task.priority] }}
              >
                {task.priority}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {isModalOpen && (
        <TaskModal 
          key={selectedTask?.id || 'new'}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); if (!isDrawerOpen) setSelectedTask(null); }}
          projects={projects}
          taskToEdit={selectedTask}
          onSubmit={handleCreateOrUpdateTask}
        />
      )}

      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedTask(null); }}
        task={selectedTask}
        project={projects.find(p => p.id === selectedTask?.projectId) || null}
        onEdit={handleEditClick}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
