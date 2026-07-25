'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard, EmptyState, ErrorState } from '@/components';
import { PlusIcon, CheckSquareIcon, SearchIcon } from '@/components/icons';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui';
import { TASK_STATUS_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import type { Task, Project, TaskStatus, TaskPriority, Tag } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToProjects } from '@/services/projects';
import { subscribeToTags } from '@/services/tags';
import { useAllProjectsTasks } from '@/hooks';
import { createTask, updateTask, deleteTask } from '@/services/tasks';
import dynamic from 'next/dynamic';

const TaskModal = dynamic(() => import('@/components/tasks/task-modal').then(m => m.TaskModal), { ssr: false });
const TaskDrawer = dynamic(() => import('@/components/tasks/task-drawer').then(m => m.TaskDrawer), { ssr: false });

const STATUSES = ['all', 'todo', 'in-progress', 'done'] as const;

export default function TasksPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const { tasks, loading: tasksLoading, error } = useAllProjectsTasks(user?.uid, projects);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubP = subscribeToProjects(
      user.uid,
      (data) => setProjects(data),
      (err) => console.error('Failed to load projects:', err)
    );
    const unsubT = subscribeToTags(user.uid, setTags);
    return () => { unsubP(); unsubT(); };
  }, [user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesTag = tagFilter === 'all' || (task.tags && task.tags.includes(tagFilter));
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPriority && matchesTag && matchesSearch;
    });
  }, [tasks, statusFilter, priorityFilter, tagFilter, searchQuery]);

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || 'Unknown';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getProjectColor = (_: string) => '#a1a1aa'; // Monochrome light gray

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
    setIsModalOpen(false);
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
        <Button 
          variant="primary"
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
        >
          <PlusIcon size={16} className="mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {status === 'all' ? 'All' : TASK_STATUS_LABELS[status as TaskStatus]} 
                {' '}({status === 'all' ? tasks.length : statusColumnCount(status)})
              </button>
            ))}
          </div>

          <div className="mx-2 h-6 w-px bg-white/10" />

          {/* Priority filter */}
          <div className="w-32">
            <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag filter */}
          <div className="w-32">
            <Select value={tagFilter} onValueChange={(val) => setTagFilter(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map(t => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Input
            icon={<SearchIcon size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      )}

      {/* Loading state */}
      {tasksLoading && tasks.length === 0 && !error && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel h-[72px] w-full animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!tasksLoading && tasks.length === 0 && !error && (
        <EmptyState 
          icon={<CheckSquareIcon size={36} />}
          title="No tasks found"
          description={projects.length === 0 
            ? "You don't have any active projects yet. Create a project first to add tasks."
            : "Get started by creating a new task or adjust your filters."
          }
          actionLabel={projects.length > 0 ? "Create Task" : undefined}
          actionIcon={projects.length > 0 ? <PlusIcon size={16} /> : undefined}
          onAction={projects.length > 0 ? () => { setSelectedTask(null); setIsModalOpen(true); } : undefined}
          primary={true}
        />
      )}

      {/* Empty filter state */}
      {!tasksLoading && tasks.length > 0 && filteredTasks.length === 0 && !error && (
        <EmptyState 
          icon={<SearchIcon size={36} />}
          title="No matching tasks"
          description="No tasks match your current filters."
        />
      )}

      {/* Task list */}
      <div className="stagger-children space-y-3">
        {filteredTasks.map((task) => (
          <GlassCard key={task.id} hover padding="none" onClick={() => handleTaskClick(task)} className="cursor-pointer">
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Status icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                task.status === 'done'
                  ? 'bg-white/[0.04]'
                  : 'bg-white/[0.04]'
              }`}>
                <CheckSquareIcon
                  size={16}
                  className={task.status === 'done' ? 'text-white/70' : 'text-white/30'}
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
                  {task.tags && task.tags.map((tagName) => {

                    return (
                      <span 
                        key={tagName} 
                        className="rounded px-1.5 py-0.5 text-[10px]"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.5)'
                        }}
                      >
                        {tagName}
                      </span>
                    );
                  })}
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
                  ? 'bg-white/[0.04] text-white/70'
                  : task.status === 'in-progress'
                    ? 'bg-white/[0.04] text-white/70'
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
        tags={tags}
        onEdit={handleEditClick}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
