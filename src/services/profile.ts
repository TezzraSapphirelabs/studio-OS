// ============================================================
// Studio OS — Profile Service (Firestore)
// ============================================================

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type UserProfile } from '@/types';

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this action.';
  }
  return `Something went wrong: ${msg}`;
}

export async function fetchUserProfile(uid: string): Promise<{ profile?: UserProfile | null; error?: string }> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return { profile: null };
    }
    const data = userDoc.data();
    return {
      profile: {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        photoURL: data.photoURL ?? null,
        bio: data.bio ?? '',
        themePreference: data.themePreference ?? 'dark',
        notificationPreferences: data.notificationPreferences ?? {
          email: true,
          inApp: true,
          mentions: true,
          projects: true,
          tasks: true,
          comments: true,
        },
        lastActive: data.lastActive,
        isOnline: data.isOnline,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as UserProfile
    };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<{ error?: string }> {
  try {
    const now = new Date().toISOString();
    const userRef = doc(db, 'users', uid);
    
    // We only allow updating certain fields
    const safeUpdates: Record<string, unknown> = {
      updatedAt: now,
    };

    if (updates.displayName !== undefined) safeUpdates.displayName = updates.displayName;
    if (updates.photoURL !== undefined) safeUpdates.photoURL = updates.photoURL;
    if (updates.bio !== undefined) safeUpdates.bio = updates.bio;
    if (updates.themePreference !== undefined) safeUpdates.themePreference = updates.themePreference;
    if (updates.notificationPreferences !== undefined) safeUpdates.notificationPreferences = updates.notificationPreferences;

    await updateDoc(userRef, safeUpdates);
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
