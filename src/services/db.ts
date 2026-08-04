import { doc, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { type UserProfile, type UserRole } from '@/types';

/**
 * Synchronizes the Firebase Auth user with the Firestore users collection.
 * If the user document doesn't exist, it creates one with the default 'Member' role.
 * 
 * @param user The authenticated Firebase user.
 * @returns The user's profile from Firestore.
 */
export async function syncUserProfile(user: User): Promise<UserProfile> {
  console.log('[syncUserProfile] Starting for uid:', user.uid);
  if (!user) throw new Error('No authenticated user provided.');

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  console.log('[syncUserProfile] Fetched userSnap. exists():', userSnap.exists());

  const now = new Date().toISOString();
  
  // Ensure the user is in the workspaceMembers collection (their own workspace)
  const memberRef = doc(db, 'workspaceMembers', `${user.uid}_${user.uid}`);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    await setDoc(memberRef, {
      workspaceId: user.uid,
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
      photoURL: user.photoURL || null,
      role: 'owner',
      joinedAt: now,
    });
  }

  if (userSnap.exists()) {
    const profile = userSnap.data() as UserProfile;
    return profile;
  }

  // Document doesn't exist, create it with default Member role
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
    photoURL: user.photoURL || null,
    role: 'Member' as UserRole,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(userRef, newProfile);
  await batch.commit();

  return newProfile;
}
