// ============================================================
// Studio OS — Members Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type ProjectMember, type ProjectRole } from '@/types';

const MEMBERS_COL = 'members';

// ── Helpers ────────────────────────────────────────────────

export function getMemberDocId(projectId: string, userId: string) {
  return `${projectId}_${userId}`;
}

function docToProjectMember(id: string, data: DocumentData): ProjectMember {
  return {
    id,
    projectId: data.projectId ?? '',
    userId: data.userId ?? '',
    email: data.email ?? '',
    displayName: data.displayName ?? 'Unknown User',
    photoURL: data.photoURL ?? null,
    role: data.role ?? 'member',
    joinedAt: data.joinedAt ?? new Date().toISOString(),
  };
}

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore members error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to manage members for this project.';
  }
  return `Something went wrong: ${msg}`;
}

// ── CRUD ───────────────────────────────────────────────────

export async function fetchProjectMembers(projectId: string): Promise<{ members?: ProjectMember[]; error?: string }> {
  try {
    const q = query(
      collection(db, MEMBERS_COL),
      where('projectId', '==', projectId)
    );
    const snap = await getDocs(q);
    const members = snap.docs.map((d) => docToProjectMember(d.id, d.data()));
    return { members };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export function subscribeToProjectMembers(
  projectId: string,
  onUpdate: (members: ProjectMember[]) => void,
  onError: (error: string) => void
) {
  const q = query(
    collection(db, MEMBERS_COL),
    where('projectId', '==', projectId)
  );

  return import('firebase/firestore').then(({ onSnapshot }) => 
    onSnapshot(q, (snap) => {
      const members = snap.docs.map((d) => docToProjectMember(d.id, d.data()));
      onUpdate(members);
    }, (err) => onError(friendlyError(err)))
  );
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  newRole: ProjectRole,
  actorUid: string,
): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    const memberRef = doc(db, MEMBERS_COL, getMemberDocId(projectId, userId));
    batch.update(memberRef, { role: newRole });

    // Optional: Log activity
    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: actorUid,
      action: `changed role to ${newRole}`,
      target: 'a member', // Ideal: Fetch user profile to log their name
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function removeMember(
  projectId: string,
  userId: string,
  actorUid: string,
): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    const memberRef = doc(db, MEMBERS_COL, getMemberDocId(projectId, userId));
    batch.delete(memberRef);

    // Remove user from the project's memberUids array
    // Wait, to safely remove from an array, we can use arrayRemove.
    const { arrayRemove } = await import('firebase/firestore');
    const projectRef = doc(db, 'projects', projectId);
    batch.update(projectRef, {
      memberUids: arrayRemove(userId),
    });

    // Log activity
    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: actorUid,
      action: 'removed a member',
      target: '',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
