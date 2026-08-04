'use server';

import { adminDb } from '@/lib/firebase-admin';
import { type WorkspaceRole } from '@/types';

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole,
  actorUid: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (targetUserId === workspaceId && newRole !== 'owner') {
      return { error: 'Cannot demote the workspace creator.' };
    }

    // 1. Verify actor is owner or admin
    const actorRef = adminDb.collection('workspaceMembers').doc(`${workspaceId}_${actorUid}`);
    const actorSnap = await actorRef.get();

    if (!actorSnap.exists) {
      return { error: 'You are not a member of this workspace.' };
    }

    const actorRole = actorSnap.data()?.role;
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      return { error: 'Only owners and admins can manage roles.' };
    }

    // Admins cannot grant 'owner' role
    if (newRole === 'owner' && actorRole !== 'owner') {
      return { error: 'Only owners can promote someone to an owner.' };
    }

    const targetRef = adminDb.collection('workspaceMembers').doc(`${workspaceId}_${targetUserId}`);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return { error: 'Target member not found.' };
    }

    const currentTargetRole = targetSnap.data()?.role;

    // Admins cannot demote an owner
    if (currentTargetRole === 'owner' && actorRole !== 'owner') {
      return { error: 'Admins cannot modify owner roles.' };
    }

    // 2. Enforce Max 2 Owners constraint
    if (newRole === 'owner' && currentTargetRole !== 'owner') {
      const ownerCountSnap = await adminDb.collection('workspaceMembers')
        .where('workspaceId', '==', workspaceId)
        .where('role', '==', 'owner')
        .count()
        .get();

      if (ownerCountSnap.data().count >= 2) {
        return { error: 'This workspace already has the maximum of two permanent owners.' };
      }
    }

    // 3. Prevent demoting yourself if you're the only owner
    if (newRole !== 'owner' && currentTargetRole === 'owner' && actorUid === targetUserId) {
      const ownerCountSnap = await adminDb.collection('workspaceMembers')
        .where('workspaceId', '==', workspaceId)
        .where('role', '==', 'owner')
        .count()
        .get();

      if (ownerCountSnap.data().count <= 1) {
        return { error: 'You cannot demote yourself. The workspace must have at least one owner.' };
      }
    }

    const batch = adminDb.batch();
    batch.update(targetRef, { role: newRole });

    // Activity log
    const activityRef = adminDb.collection('activities').doc();
    batch.set(activityRef, {
      projectId: workspaceId,
      ownerUid: actorUid,
      action: `changed workspace role to ${newRole}`,
      target: 'a member',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();

    return { success: true };
  } catch (error: unknown) {
    console.error('[Server Action Error]', error);
    return { error: (error as Error).message || 'Failed to update member role.' };
  }
}

export async function removeMember(
  workspaceId: string,
  targetUserId: string,
  actorUid: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (targetUserId === workspaceId) {
      return { error: 'Cannot remove the workspace creator.' };
    }

    // 1. Verify actor is owner or admin (or leaving themselves)
    const isLeaving = targetUserId === actorUid;

    let actorRole = 'none';
    if (!isLeaving) {
      const actorRef = adminDb.collection('workspaceMembers').doc(`${workspaceId}_${actorUid}`);
      const actorSnap = await actorRef.get();
      if (!actorSnap.exists) {
        return { error: 'You are not a member of this workspace.' };
      }
      actorRole = actorSnap.data()?.role;
      if (actorRole !== 'owner' && actorRole !== 'admin') {
        return { error: 'Only owners and admins can remove members.' };
      }
    }

    const targetRef = adminDb.collection('workspaceMembers').doc(`${workspaceId}_${targetUserId}`);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      return { error: 'Target member not found.' };
    }

    const targetRole = targetSnap.data()?.role;

    // Admins cannot remove an owner
    if (targetRole === 'owner' && actorRole !== 'owner' && !isLeaving) {
      return { error: 'Admins cannot remove an owner.' };
    }

    // Prevent removing yourself if you're the only owner
    if (targetRole === 'owner' && isLeaving) {
      const ownerCountSnap = await adminDb.collection('workspaceMembers')
        .where('workspaceId', '==', workspaceId)
        .where('role', '==', 'owner')
        .count()
        .get();

      if (ownerCountSnap.data().count <= 1) {
        return { error: 'You cannot leave the workspace as the only owner. Transfer ownership or delete the workspace.' };
      }
    }

    const batch = adminDb.batch();
    batch.delete(targetRef);

    if (!isLeaving) {
      const activityRef = adminDb.collection('activities').doc();
      batch.set(activityRef, {
        projectId: workspaceId,
        ownerUid: actorUid,
        action: 'removed',
        target: 'a member',
        createdAt: new Date().toISOString(),
      });
    }

    await batch.commit();

    return { success: true };
  } catch (error: unknown) {
    console.error('[Server Action Error]', error);
    return { error: (error as Error).message || 'Failed to remove member.' };
  }
}

export async function getPublicPlatformOwners() {
  try {
    const snap = await adminDb.collection('platformOwners').get();
    const owners = await Promise.all(snap.docs.map(async (d) => {
      const data = d.data();
      const userSnap = await adminDb.collection('users').doc(data.userId).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        return {
          id: data.userId,
          userId: data.userId,
          email: userData?.email || '',
          displayName: userData?.displayName || 'Platform Owner',
          photoURL: userData?.photoURL || null,
          role: 'Platform Owner',
          joinedAt: data.createdAt || userData?.createdAt || new Date().toISOString(),
          isPlatformOwner: true
        };
      }
      return null;
    }));
    return { owners: owners.filter(Boolean) };
  } catch {
    return { error: 'Failed to fetch platform owners' };
  }
}

export async function getAllWorkspaceMembers() {
  try {
    const snap = await adminDb.collection('workspaceMembers').get();
    
    const members = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        workspaceId: data.workspaceId ?? '',
        userId: data.userId ?? '',
        email: data.email ?? '',
        displayName: data.displayName ?? 'Unknown User',
        photoURL: data.photoURL ?? null,
        role: data.role ?? 'member',
        joinedAt: data.joinedAt ?? new Date().toISOString(),
      };
    });

    // Deduplicate by userId to avoid duplicate member documents
    const uniqueMembers = Array.from(new Map(members.map(m => [m.userId, m])).values());
    
    return { members: uniqueMembers };
  } catch (error) {
    return { error: 'Failed to fetch all workspace members' };
  }
}
