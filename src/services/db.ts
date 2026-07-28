import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { type UserProfile, type UserRole } from '@/types';
import { bootstrapPlatformOwner } from '@/app/actions/platform-keys';

/**
 * Synchronizes the Firebase Auth user with the Firestore users collection.
 * If the user document doesn't exist, it creates one with the default 'Member' role.
 * 
 * @param user The authenticated Firebase user.
 * @returns The user's profile from Firestore.
 */
export async function syncUserProfile(user: User): Promise<UserProfile> {
  if (!user) throw new Error('No authenticated user provided.');

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // Safely attempt to bootstrap if this is the very first user on the platform.
  const isFirstUser = await bootstrapPlatformOwner(user.uid);

  if (userSnap.exists()) {
    // Document exists, return the profile
    return userSnap.data() as UserProfile;
  }

  const now = new Date().toISOString();
  
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

  if (isFirstUser) {
    // First user ever -> Also gets a personal workspace to start
    const memberRef = doc(db, 'workspaceMembers', `${user.uid}_${user.uid}`);
    batch.set(memberRef, {
      workspaceId: user.uid,
      userId: user.uid,
      email: user.email || '',
      displayName: newProfile.displayName,
      photoURL: newProfile.photoURL,
      role: 'owner',
      joinedAt: now,
    });
  }

  await batch.commit();

  return newProfile;
}
