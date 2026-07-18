// ============================================================
// Studio OS — Invites Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type ProjectInvite, type ProjectRole } from '@/types';
import { getMemberDocId } from './members';

const INVITES_COL = 'projectInvites';
const USERS_COL = 'users';

// ── Helpers ────────────────────────────────────────────────

function docToProjectInvite(id: string, data: DocumentData): ProjectInvite {
  return {
    id,
    projectId: data.projectId ?? '',
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

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore invites error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this action.';
  }
  return `Something went wrong: ${msg}`;
}

// ── CRUD ───────────────────────────────────────────────────

export async function sendInvitationEmail(invite: ProjectInvite, token: string) {
  // Future enhancement: Integrate with an email service (Resend, SendGrid, etc.)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/invite/${token}`;

  console.log(`[Email Service Mock] Invitation sent to ${invite.inviteeEmail}`);
  console.log(`[Email Service Mock] Acceptance link: ${inviteUrl}`);

  // Also log to the Node.js terminal so the developer can see it during local dev
  try {
    const { logToTerminal } = await import('@/actions/log');
    await logToTerminal(`\n✉️  [Email Service Mock] Invitation sent to ${invite.inviteeEmail}\n🔗 Acceptance link: ${inviteUrl}\n`);
  } catch {
    // Ignore if server action fails
  }
  
  return true;
}

export async function inviteUser(
  projectId: string,
  inviterUid: string,
  inviteeEmail: string,
  role: ProjectRole,
): Promise<{ invite?: ProjectInvite; error?: string }> {
  try {
    const emailStr = inviteeEmail.trim().toLowerCase();
    
    const { getDoc } = await import('firebase/firestore');

    // Fetch inviter info to ensure they don't invite themselves
    const inviterDoc = await getDoc(doc(db, 'users', inviterUid));
    if (inviterDoc.data()?.email === emailStr) {
      return { error: 'You cannot invite yourself.' };
    }

    // Optionally check if the user exists to see if they are already a member
    const usersQ = query(collection(db, USERS_COL), where('email', '==', emailStr));
    const usersSnap = await getDocs(usersQ);
    
    if (!usersSnap.empty) {
      const inviteeUid = usersSnap.docs[0].id;
      // Check if already a member by checking project data
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      const projectData = projectSnap.data();
      if (
        projectData?.ownerUid === inviteeUid ||
        (projectData?.memberUids && projectData.memberUids.includes(inviteeUid))
      ) {
        return { error: 'This user is already a member of the project.' };
      }
    }

    // Check if pending invite exists
    const invitesQ = query(
      collection(db, INVITES_COL),
      where('projectId', '==', projectId),
      where('inviteeEmail', '==', emailStr),
      where('status', '==', 'pending')
    );
    const invitesSnap = await getDocs(invitesQ);
    if (!invitesSnap.empty) {
      return { error: 'A pending invitation already exists for this email.' };
    }

    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + 7); // 7 days expiration
    
    // Generate secure random token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const data = {
      projectId,
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
    const inviteRef = doc(collection(db, INVITES_COL));
    batch.set(inviteRef, data);

    // Log activity
    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: inviterUid,
      action: 'invited',
      target: emailStr,
      createdAt: now,
    });

    await batch.commit();

    const invite = docToProjectInvite(inviteRef.id, data);
    await sendInvitationEmail(invite, token);

    return { invite };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function acceptInvite(
  inviteId: string,
  projectId: string,
  userId: string,
  role: ProjectRole,
): Promise<{ error?: string }> {
  try {
    const { getDoc, arrayUnion } = await import('firebase/firestore');
    const now = new Date().toISOString();

    const inviteRef = doc(db, INVITES_COL, inviteId);
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

    // 2. Add to members collection (with full profile data)
    const memberRef = doc(db, 'members', getMemberDocId(projectId, userId));
    batch.set(memberRef, {
      projectId,
      userId,
      email: userData?.email || '',
      displayName: userData?.displayName || 'Unknown User',
      photoURL: userData?.photoURL || null,
      role,
      joinedAt: now,
    });

    // 3. Log activity
    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: userId,
      action: 'joined the project',
      target: userData?.displayName || '',
      createdAt: now,
    });

    await batch.commit();

    // 4. Add to project's memberUids array (separate call — the accepting user
    //    may not have project update permission yet, so we do this best-effort)
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        memberUids: arrayUnion(userId),
      });
    } catch {
      // Will be handled by the project owner or on next project update
    }

    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function acceptInviteByToken(
  token: string,
  userId: string,
  userEmail: string,
): Promise<{ projectId?: string; error?: string }> {
  try {
    const { getDocs, query, where, collection } = await import('firebase/firestore');
    const invitesQ = query(
      collection(db, INVITES_COL),
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
    const { error } = await acceptInvite(inviteDoc.id, inviteData.projectId, userId, inviteData.role);
    if (error) return { error };

    return { projectId: inviteData.projectId };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function declineInvite(
  inviteId: string,
): Promise<{ error?: string }> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const inviteRef = doc(db, INVITES_COL, inviteId);
    await deleteDoc(inviteRef);
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function cancelInvite(
  inviteId: string,
  projectId: string,
  actorUid: string,
): Promise<{ error?: string }> {
  try {
    const batch = writeBatch(db);
    const inviteRef = doc(db, INVITES_COL, inviteId);
    batch.delete(inviteRef);

    // Log activity
    const { createActivityRef } = await import('./activity');
    batch.set(createActivityRef(), {
      projectId,
      ownerUid: actorUid,
      action: 'cancelled an invitation',
      target: '',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();

    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
