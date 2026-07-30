// ============================================================
// Velonos — Workspace Service (Firestore)
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
import { type WorkspaceMember, type WorkspaceRole } from '@/types';
import { createActivityRef } from './activity';

const WORKSPACE_MEMBERS_COL = 'workspaceMembers';

// ── Helpers ────────────────────────────────────────────────

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Velonos] Firestore workspace error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this action.';
  }
  return `Something went wrong: ${msg}`;
}

export function getWorkspaceMemberDocId(workspaceId: string, userId: string) {
  return `${workspaceId}_${userId}`;
}

function docToWorkspaceMember(id: string, data: DocumentData): WorkspaceMember {
  return {
    id,
    workspaceId: data.workspaceId ?? '',
    userId: data.userId ?? '',
    email: data.email ?? '',
    displayName: data.displayName ?? 'Unknown User',
    photoURL: data.photoURL ?? null,
    role: data.role ?? 'member',
    joinedAt: data.joinedAt ?? new Date().toISOString(),
  };
}


// ── CRUD Members ───────────────────────────────────────────

export async function fetchWorkspaceMembers(workspaceId: string): Promise<{ members?: WorkspaceMember[]; error?: string }> {
  try {
    const q = query(collection(db, WORKSPACE_MEMBERS_COL), where('workspaceId', '==', workspaceId));
    const snap = await getDocs(q);
    
    const members = snap.docs.map(d => docToWorkspaceMember(d.id, d.data()));
    
    return { members };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  newRole: WorkspaceRole,
  actorUid: string
): Promise<{ error?: string }> {
  try {
    if (userId === workspaceId) {
      return { error: 'Cannot change the role of the workspace owner.' };
    }
    const batch = writeBatch(db);
    const memberRef = doc(db, WORKSPACE_MEMBERS_COL, getWorkspaceMemberDocId(workspaceId, userId));
    batch.update(memberRef, { role: newRole });

    batch.set(createActivityRef(), {
      projectId: workspaceId, // Using workspaceId as projectId for global queries
      ownerUid: actorUid,
      action: `changed workspace role to ${newRole}`,
      target: 'a member',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
  actorUid: string
): Promise<{ error?: string }> {
  try {
    if (userId === workspaceId) {
      return { error: 'Cannot remove the workspace owner.' };
    }
    const batch = writeBatch(db);
    const memberRef = doc(db, WORKSPACE_MEMBERS_COL, getWorkspaceMemberDocId(workspaceId, userId));
    batch.delete(memberRef);

    batch.set(createActivityRef(), {
      projectId: workspaceId,
      ownerUid: actorUid,
      action: 'removed a workspace member',
      target: '',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

// ── Transfer Ownership ─────────────────────────────────────

export async function transferWorkspaceOwnership(
  currentOwnerId: string,
  newOwnerId: string
): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    
    // 1. Projects
    const projectsQ = query(collection(db, 'projects'), where('ownerUid', '==', currentOwnerId));
    const projectsSnap = await getDocs(projectsQ);
    const projectIds = projectsSnap.docs.map(d => d.id);
    projectsSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));
    
    // Process related collections per project to comply with strict Firestore rules
    // chunk projectIds for 'in' queries (max 10)
    for (let i = 0; i < projectIds.length; i += 10) {
      const chunk = projectIds.slice(i, i + 10);
      if (chunk.length === 0) continue;

      // 2. Tasks
      const tasksQ = query(collection(db, 'tasks'), where('projectId', 'in', chunk));
      const tasksSnap = await getDocs(tasksQ);
      tasksSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));

      // 3. Files & Folders
      const filesQ = query(collection(db, 'files'), where('projectId', 'in', chunk));
      const filesSnap = await getDocs(filesQ);
      filesSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));
      
      const foldersQ = query(collection(db, 'folders'), where('projectId', 'in', chunk));
      const foldersSnap = await getDocs(foldersQ);
      foldersSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));

      // 4. Activity
      const activityQ = query(collection(db, 'activities'), where('projectId', 'in', chunk));
      const activitySnap = await getDocs(activityQ);
      activitySnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId })); // assuming ownerUid tracks the workspace owner
    }

    // 5. Notes (Notes are personal to the user's subcollection)

    // 6. Move members from old workspace to new workspace (optional, but good for completeness)
    const membersQ = query(collection(db, WORKSPACE_MEMBERS_COL), where('workspaceId', '==', currentOwnerId));
    const membersSnap = await getDocs(membersQ);
    membersSnap.forEach(d => {
      const data = d.data();
      batch.delete(d.ref); // Delete old doc
      const newRef = doc(db, WORKSPACE_MEMBERS_COL, getWorkspaceMemberDocId(newOwnerId, data.userId));
      batch.set(newRef, { ...data, workspaceId: newOwnerId, role: data.userId === newOwnerId ? 'owner' : (data.userId === currentOwnerId ? 'admin' : data.role) });
    });

    batch.set(createActivityRef(), {
      projectId: newOwnerId,
      ownerUid: currentOwnerId,
      action: 'transferred workspace ownership',
      target: 'to a new owner',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
