// ============================================================
// Studio OS — Projects Service (Firestore)
// ============================================================
// CRUD operations for user-scoped projects in Firestore.
// Every project is owned by the authenticated user's UID.
// ============================================================

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Project, type ProjectStatus } from '@/types';

const PROJECTS_COL = 'projects';

// ── Helpers ────────────────────────────────────────────────

function docToProject(id: string, data: DocumentData): Project {
  return {
    id,
    ownerUid: data.ownerUid ?? '',
    memberUids: Array.from(new Set([...(data.memberUids ?? []), data.ownerUid ?? ''])).filter(Boolean),
    name: data.name ?? '',
    description: data.description ?? '',
    status: data.status ?? 'active',
    color: data.color ?? '#8b5cf6',
    icon: data.icon ?? undefined,
    memberCount: data.memberCount ?? 0,
    taskCount: data.taskCount ?? 0,
    completedTaskCount: data.completedTaskCount ?? 0,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  // Always log the real error for debugging
  console.error('[Studio OS] Firestore error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this action.';
  }
  if (msg.includes('offline') || msg.includes('unavailable')) {
    return 'You appear to be offline. Please check your connection and try again.';
  }
  if (msg.includes('not-found')) {
    return 'The requested project was not found.';
  }
  if (msg.includes('index') || msg.includes('FAILED_PRECONDITION')) {
    return 'A required database index is missing. Check the browser console for a link to create it.';
  }
  return `Something went wrong: ${msg}`;
}

// ── CRUD ───────────────────────────────────────────────────

export interface CreateProjectInput {
  name: string;
  description: string;
  color: string;
  status?: ProjectStatus;
}

export async function createProject(
  uid: string,
  input: CreateProjectInput,
): Promise<{ project?: Project; error?: string }> {
  try {
    const now = new Date().toISOString();
    const data = {
      ownerUid: uid,
      memberUids: [uid],
      name: input.name.trim(),
      description: input.description.trim(),
      color: input.color,
      status: input.status || 'active',
      memberCount: 1,
      taskCount: 0,
      completedTaskCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    const ref = doc(collection(db, PROJECTS_COL));
    batch.set(ref, data);

    // Fetch user profile to populate members collection
    const { getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();

    // Add owner to members collection
    const memberRef = doc(db, 'members', `${ref.id}_${uid}`);
    batch.set(memberRef, {
      projectId: ref.id,
      userId: uid,
      email: userData?.email || '',
      displayName: userData?.displayName || 'Unknown User',
      photoURL: userData?.photoURL || null,
      role: 'owner',
      joinedAt: now,
    });

    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId: ref.id,
      ownerUid: uid,
      action: 'created project',
      target: input.name.trim(),
      createdAt: now,
    });

    await batch.commit();

    return { project: docToProject(ref.id, data) };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function fetchProjects(
  uid: string,
): Promise<{ projects?: Project[]; error?: string }> {
  try {
    const projectMap = new Map<string, Project>();

    // Query 1: projects I own (always works)
    const qOwned = query(
      collection(db, PROJECTS_COL),
      where('ownerUid', '==', uid)
    );
    const snapOwned = await getDocs(qOwned);
    snapOwned.docs.forEach(d => projectMap.set(d.id, docToProject(d.id, d.data())));

    // Query 2: projects I'm a member of (may fail on legacy docs without memberUids)
    try {
      const qMember = query(
        collection(db, PROJECTS_COL),
        where('memberUids', 'array-contains', uid)
      );
      const snapMember = await getDocs(qMember);
      snapMember.docs.forEach(d => projectMap.set(d.id, docToProject(d.id, d.data())));
    } catch {
      // Silently ignore — owned projects already loaded above
    }

    const projects = Array.from(projectMap.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { projects };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export function subscribeToProjects(
  uid: string,
  onUpdate: (projects: Project[]) => void,
  onError: (error: string) => void
) {
  const qOwned = query(collection(db, PROJECTS_COL), where('ownerUid', '==', uid));
  const qMember = query(collection(db, PROJECTS_COL), where('memberUids', 'array-contains', uid));

  const projectMap = new Map<string, Project>();
  let ownedLoaded = false;
  let memberLoaded = false;

  const emit = () => {
    if (ownedLoaded && memberLoaded) {
      const projects = Array.from(projectMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onUpdate(projects);
    }
  };

  const unsubOwned = import('firebase/firestore').then(({ onSnapshot }) => 
    onSnapshot(qOwned, (snap) => {
      snap.docs.forEach(d => projectMap.set(d.id, docToProject(d.id, d.data())));
      ownedLoaded = true;
      emit();
    }, (err) => onError(friendlyError(err)))
  );

  const unsubMember = import('firebase/firestore').then(({ onSnapshot }) => 
    onSnapshot(qMember, (snap) => {
      snap.docs.forEach(d => projectMap.set(d.id, docToProject(d.id, d.data())));
      memberLoaded = true;
      emit();
    }, () => {
      // memberUids query may fail on legacy docs — treat as loaded with no results
      memberLoaded = true;
      emit();
    })
  );

  return () => {
    unsubOwned.then(u => u());
    unsubMember.then(u => u());
  };
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
}

export async function updateProject(
  uid: string,
  projectId: string,
  projectName: string,
  input: UpdateProjectInput,
): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const ref = doc(db, PROJECTS_COL, projectId);
    
    const updates: Record<string, unknown> = { updatedAt: now };
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.description !== undefined) updates.description = input.description.trim();
    if (input.color !== undefined) updates.color = input.color;
    if (input.status !== undefined) updates.status = input.status;
    batch.update(ref, updates);

    let action = 'updated project';
    if (input.status === 'archived') action = 'archived project';
    if (input.status === 'active' && updates.status) action = 'unarchived project';

    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: uid,
      action,
      target: input.name?.trim() || projectName,
      createdAt: now,
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function archiveProject(uid: string, projectId: string, projectName: string): Promise<{ error?: string }> {
  return updateProject(uid, projectId, projectName, { status: 'archived' });
}

export async function unarchiveProject(uid: string, projectId: string, projectName: string): Promise<{ error?: string }> {
  return updateProject(uid, projectId, projectName, { status: 'active' });
}

export async function deleteProject(uid: string, projectId: string, projectName: string): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    batch.delete(doc(db, PROJECTS_COL, projectId));

    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: uid,
      action: 'deleted project',
      target: projectName,
      createdAt: now,
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
