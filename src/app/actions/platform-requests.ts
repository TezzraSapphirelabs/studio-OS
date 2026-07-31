'use server';

import { adminDb } from '@/lib/firebase-admin';
import { type UserProfile } from '@/types';

const PLATFORM_OWNERS_COL = 'platformOwners';

async function checkIsOwner(actorUid: string): Promise<boolean> {
  const snap = await adminDb.collection(PLATFORM_OWNERS_COL).doc(actorUid).get();
  return snap.exists;
}

export async function getPendingUsers(actorUid: string): Promise<{ users?: UserProfile[]; error?: string }> {
  try {
    const isOwner = await checkIsOwner(actorUid);
    if (!isOwner) {
      return { error: 'Unauthorized' };
    }

    const snap = await adminDb.collection('users').where('status', '==', 'pending').get();
    const users = snap.docs.map(doc => doc.data() as UserProfile);

    return { users };
  } catch (error: unknown) {
    console.error('Failed to fetch pending users:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function approveUser(actorUid: string, targetUserId: string): Promise<{ error?: string }> {
  try {
    const isOwner = await checkIsOwner(actorUid);
    if (!isOwner) {
      return { error: 'Unauthorized' };
    }

    await adminDb.collection('users').doc(targetUserId).update({
      status: 'approved',
      updatedAt: new Date().toISOString()
    });

    return {};
  } catch (error: unknown) {
    console.error('Failed to approve user:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function rejectUser(actorUid: string, targetUserId: string): Promise<{ error?: string }> {
  try {
    const isOwner = await checkIsOwner(actorUid);
    if (!isOwner) {
      return { error: 'Unauthorized' };
    }

    await adminDb.collection('users').doc(targetUserId).update({
      status: 'rejected',
      updatedAt: new Date().toISOString()
    });

    return {};
  } catch (error: unknown) {
    console.error('Failed to reject user:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
