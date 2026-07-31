import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
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

  // No longer bootstrapping Platform Owners since the feature is removed.
  // The first user will be pending, unless they are manually approved in the Firestore console.
  
  if (userSnap.exists()) {
    const profile = userSnap.data() as UserProfile;
    console.log('[syncUserProfile] Existing profile status:', profile.status);
    
    // Migration: If the user doesn't have a status, default to pending
    if (!profile.status) {
      profile.status = 'pending';
      console.log('[syncUserProfile] Setting profile.status to:', profile.status);
      await updateDoc(userRef, { 
        status: profile.status,
        updatedAt: new Date().toISOString()
      });
    }
    
    return profile;
  }

  const now = new Date().toISOString();
  
  // Document doesn't exist, create it with default Member role
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
    photoURL: user.photoURL || null,
    role: 'Member' as UserRole,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(userRef, newProfile);
  await batch.commit();

  return newProfile;
}
