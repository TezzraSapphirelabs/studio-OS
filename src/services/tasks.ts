// ============================================================
// Studio OS — Tasks Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  onSnapshot,
  increment,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Task, type TaskStatus, type TaskPriority } from '@/types';

const TASKS_COL = 'tasks';
const PROJECTS_COL = 'projects';

// ── Helpers ────────────────────────────────────────────────

function docToTask(id: string, data: DocumentData): Task {
  return {
    id,
    ownerUid: data.ownerUid ?? '',
    projectId: data.projectId ?? '',
    title: data.title ?? '',
    description: data.description ?? '',
    status: data.status ?? 'todo',
    priority: data.priority ?? 'medium',
    assigneeId: data.assigneeId ?? undefined,
    dueDate: data.dueDate ?? undefined,
    tags: data.tags ?? [],
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this action.';
  }
  if (msg.includes('offline') || msg.includes('unavailable')) {
    return 'You appear to be offline. Please check your connection and try again.';
  }
  if (msg.includes('not-found')) {
    return 'The requested resource was not found.';
  }
  if (msg.includes('index') || msg.includes('FAILED_PRECONDITION')) {
    return 'A required database index is missing. Check the browser console for a link to create it.';
  }
  return `Something went wrong: ${msg}`;
}

// ── CRUD ───────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export async function createTask(
  uid: string,
  projectId: string,
  input: CreateTaskInput,
): Promise<{ error?: string }> {
  try {
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    // Create new task
    const taskRef = doc(collection(db, TASKS_COL));
    const isCompleted = input.status === 'done';
    
    batch.set(taskRef, {
      ownerUid: uid,
      projectId,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      status: input.status || 'todo',
      priority: input.priority || 'medium',
      dueDate: input.dueDate || null,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    // Update project stats
    const projectRef = doc(db, PROJECTS_COL, projectId);
    batch.update(projectRef, {
      taskCount: increment(1),
      completedTaskCount: isCompleted ? increment(1) : increment(0),
      updatedAt: now,
    });

    // Log activity
    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: uid,
      action: 'created task',
      target: input.title.trim(),
      createdAt: now,
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export async function updateTask(
  uid: string,
  projectId: string,
  taskId: string,
  taskTitle: string,
  currentStatus: TaskStatus,
  input: UpdateTaskInput,
): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    
    // Update task
    const taskRef = doc(db, TASKS_COL, taskId);
    const taskUpdates: Record<string, unknown> = { updatedAt: now };
    if (input.title !== undefined) taskUpdates.title = input.title.trim();
    if (input.description !== undefined) taskUpdates.description = input.description.trim();
    if (input.status !== undefined) taskUpdates.status = input.status;
    if (input.priority !== undefined) taskUpdates.priority = input.priority;
    if (input.dueDate !== undefined) taskUpdates.dueDate = input.dueDate;
    
    batch.update(taskRef, taskUpdates);

    // Update project stats if status changed between incomplete <-> done
    let completedDelta = 0;
    if (input.status && input.status !== currentStatus) {
      if (currentStatus === 'done' && input.status !== 'done') completedDelta = -1;
      else if (currentStatus !== 'done' && input.status === 'done') completedDelta = 1;

      if (completedDelta !== 0) {
        const projectRef = doc(db, PROJECTS_COL, projectId);
        batch.update(projectRef, {
          completedTaskCount: increment(completedDelta),
          updatedAt: now,
        });
      }
    }

    // Log activity
    const { createActivityRef } = await import('./activity');
    let actionStr = 'updated task';
    if (completedDelta === 1) actionStr = 'completed task';
    else if (completedDelta === -1) actionStr = 'uncompleted task';

    batch.set(createActivityRef(), {
      projectId,
      ownerUid: uid,
      action: actionStr,
      target: input.title?.trim() || taskTitle,
      createdAt: now,
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function deleteTask(
  uid: string,
  projectId: string,
  taskId: string,
  taskTitle: string,
  currentStatus: TaskStatus,
): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    
    // Delete task
    batch.delete(doc(db, TASKS_COL, taskId));

    // Update project stats
    const projectRef = doc(db, PROJECTS_COL, projectId);
    const isCompleted = currentStatus === 'done';
    batch.update(projectRef, {
      taskCount: increment(-1),
      completedTaskCount: isCompleted ? increment(-1) : increment(0),
      updatedAt: now,
    });

    // Log activity
    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: uid,
      action: 'deleted task',
      target: taskTitle,
      createdAt: now,
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

// ── Subscriptions ──────────────────────────────────────────

export function subscribeToProjectTasks(
  uid: string,
  projectId: string,
  onUpdate: (tasks: Task[], error: string | null) => void
): Unsubscribe {
  const q = query(
    collection(db, TASKS_COL),
    where('projectId', '==', projectId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      // Sort in-memory to avoid requiring composite indexes initially
      const tasks = snapshot.docs
        .map((d) => docToTask(d.id, d.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onUpdate(tasks, null);
    },
    (error) => {
      onUpdate([], friendlyError(error));
    }
  );
}
