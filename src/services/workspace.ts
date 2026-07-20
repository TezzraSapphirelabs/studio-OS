// ============================================================
// Studio OS — Workspace Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type WorkspaceMember, type WorkspaceRole, type WorkspaceInvite } from '@/types';
import { createActivityRef } from './activity';
import { sendInvitationEmail } from './invites'; // We can reuse the mock email function

const WORKSPACE_MEMBERS_COL = 'workspaceMembers';
const WORKSPACE_INVITES_COL = 'workspaceInvites';

// ── Helpers ────────────────────────────────────────────────

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore workspace error:', msg);
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

function docToWorkspaceInvite(id: string, data: DocumentData): WorkspaceInvite {
  return {
    id,
    workspaceId: data.workspaceId ?? '',
    inviterUid: data.inviterUid ?? '',
    inviteeEmail: data.inviteeEmail ?? '',
    role: data.role ?? 'member',
    status: data.status ?? 'pending',
    token: data.token,
    expiresAt: data.expiresAt,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

// ── CRUD Members ───────────────────────────────────────────

export async function fetchWorkspaceMembers(workspaceId: string): Promise<{ members?: WorkspaceMember[]; error?: string }> {
  try {
    const q = query(collection(db, WORKSPACE_MEMBERS_COL), where('workspaceId', '==', workspaceId));
    const snap = await getDocs(q);
    
    // Always append the owner as a virtual member if they aren't explicitly in the collection
    const members = snap.docs.map(d => docToWorkspaceMember(d.id, d.data()));
    
    if (!members.find(m => m.userId === workspaceId)) {
      const ownerDoc = await getDoc(doc(db, 'users', workspaceId));
      if (ownerDoc.exists()) {
        const ownerData = ownerDoc.data();
        members.unshift({
          id: `${workspaceId}_${workspaceId}`,
          workspaceId,
          userId: workspaceId,
          email: ownerData.email,
          displayName: ownerData.displayName,
          photoURL: ownerData.photoURL,
          role: 'owner',
          joinedAt: ownerData.createdAt,
        });
      }
    }
    
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

// ── Invites ────────────────────────────────────────────────

export async function inviteWorkspaceMember(
  workspaceId: string,
  inviterUid: string,
  inviteeEmail: string,
  role: WorkspaceRole
): Promise<{ invite?: WorkspaceInvite; error?: string }> {
  try {
    const emailStr = inviteeEmail.trim().toLowerCase();
    const inviterDoc = await getDoc(doc(db, 'users', inviterUid));
    if (inviterDoc.data()?.email === emailStr) {
      return { error: 'You cannot invite yourself.' };
    }

    const invitesQ = query(
      collection(db, WORKSPACE_INVITES_COL),
      where('workspaceId', '==', workspaceId),
      where('inviteeEmail', '==', emailStr),
      where('status', '==', 'pending')
    );
    const invitesSnap = await getDocs(invitesQ);
    if (!invitesSnap.empty) {
      return { error: 'A pending invitation already exists for this email.' };
    }

    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + 7);
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const data = {
      workspaceId,
      inviterUid,
      inviteeEmail: emailStr,
      role,
      status: 'pending',
      token,
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const batch = writeBatch(db);
    const inviteRef = doc(collection(db, WORKSPACE_INVITES_COL));
    batch.set(inviteRef, data);

    batch.set(createActivityRef(), {
      projectId: workspaceId,
      ownerUid: inviterUid,
      action: 'invited to workspace',
      target: emailStr,
      createdAt: now.toISOString(),
    });

    await batch.commit();
    const invite = docToWorkspaceInvite(inviteRef.id, data);
    
    // We reuse the existing mock email functionality (which expects a ProjectInvite, but the shapes are similar enough)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sendInvitationEmail(invite as any, token);

    return { invite };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function fetchWorkspaceInvites(workspaceId: string): Promise<{ invites?: WorkspaceInvite[]; error?: string }> {
  try {
    const q = query(
      collection(db, WORKSPACE_INVITES_COL),
      where('workspaceId', '==', workspaceId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const invites = snap.docs.map((d) => docToWorkspaceInvite(d.id, d.data()));
    return { invites };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function cancelWorkspaceInvite(inviteId: string, workspaceId: string, actorUid: string): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, WORKSPACE_INVITES_COL, inviteId));
    batch.set(createActivityRef(), {
      projectId: workspaceId,
      ownerUid: actorUid,
      action: 'cancelled a workspace invitation',
      target: '',
      createdAt: new Date().toISOString(),
    });
    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function acceptWorkspaceInvite(
  inviteId: string,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<{ error?: string }> {
  try {
    const now = new Date().toISOString();

    const inviteRef = doc(db, WORKSPACE_INVITES_COL, inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) {
      return { error: 'Invitation not found.' };
    }
    const inviteData = inviteSnap.data();
    if (inviteData.expiresAt && new Date(inviteData.expiresAt) < new Date()) {
      return { error: 'This invitation has expired.' };
    }

    // Fetch user profile to populate member doc with display info
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    const batch = writeBatch(db);

    // 1. Remove the pending invitation
    batch.delete(inviteRef);

    // 2. Add to workspace members collection
    const memberRef = doc(db, WORKSPACE_MEMBERS_COL, getWorkspaceMemberDocId(workspaceId, userId));
    batch.set(memberRef, {
      workspaceId,
      userId,
      email: userData?.email || '',
      displayName: userData?.displayName || 'Unknown User',
      photoURL: userData?.photoURL || null,
      role,
      joinedAt: now,
    });

    // 3. Log activity
    batch.set(createActivityRef(), {
      projectId: workspaceId,
      ownerUid: userId,
      action: 'joined the workspace',
      target: userData?.displayName || '',
      createdAt: now,
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function acceptWorkspaceInviteByToken(
  token: string,
  userId: string,
  userEmail: string,
): Promise<{ workspaceId?: string; error?: string }> {
  try {
    const invitesQ = query(
      collection(db, WORKSPACE_INVITES_COL),
      where('token', '==', token),
      where('inviteeEmail', '==', userEmail.trim().toLowerCase()),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(invitesQ);
    if (snap.empty) {
      return { error: 'Invalid or expired invitation.' };
    }
    
    const inviteDoc = snap.docs[0];
    const inviteData = inviteDoc.data();
    
    // Check expiration
    if (inviteData.expiresAt && new Date(inviteData.expiresAt) < new Date()) {
      return { error: 'This invitation has expired.' };
    }

    // Reuse acceptInvite logic
    const { error } = await acceptWorkspaceInvite(inviteDoc.id, inviteData.workspaceId, userId, inviteData.role);
    if (error) return { error };

    return { workspaceId: inviteData.workspaceId };
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
    projectsSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));
    
    // 2. Tasks
    const tasksQ = query(collection(db, 'tasks'), where('ownerUid', '==', currentOwnerId));
    const tasksSnap = await getDocs(tasksQ);
    tasksSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));
    
    // 3. Notes
    const notesQ = query(collection(db, 'notes'), where('ownerId', '==', currentOwnerId));
    const notesSnap = await getDocs(notesQ);
    notesSnap.forEach(d => batch.update(d.ref, { ownerId: newOwnerId }));
    
    // 4. Files & Folders
    const filesQ = query(collection(db, 'files'), where('ownerUid', '==', currentOwnerId));
    const filesSnap = await getDocs(filesQ);
    filesSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));
    
    const foldersQ = query(collection(db, 'folders'), where('ownerUid', '==', currentOwnerId));
    const foldersSnap = await getDocs(foldersQ);
    foldersSnap.forEach(d => batch.update(d.ref, { ownerUid: newOwnerId }));

    // 5. Activity
    const activityQ = query(collection(db, 'activities'), where('projectId', '==', currentOwnerId));
    const activitySnap = await getDocs(activityQ);
    activitySnap.forEach(d => batch.update(d.ref, { projectId: newOwnerId }));

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
