import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
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
  console.log('[syncUserProfile] Starting for uid:', user.uid);
  if (!user) throw new Error('No authenticated user provided.');

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  console.log('[syncUserProfile] Fetched userSnap. exists():', userSnap.exists());

  // Safely attempt to bootstrap if this is the very first user on the platform.
  console.log('[syncUserProfile] Calling bootstrapPlatformOwner');
  const isFirstUser = await bootstrapPlatformOwner(user.uid);
  console.log('[syncUserProfile] bootstrapPlatformOwner returned:', isFirstUser);

  if (userSnap.exists()) {
    const profile = userSnap.data() as UserProfile;
    console.log('[syncUserProfile] Existing profile status:', profile.status);
    
    // Migration: If the user doesn't have a status, assign one based on their Platform Owner status
    if (!profile.status) {
      const docPath = `platformOwners/${user.uid}`;
      console.log('[syncUserProfile] Fetching platformOwner doc for migration from:', docPath);
      const platformOwnerSnap = await getDoc(doc(db, 'platformOwners', user.uid));
      const isOwner = platformOwnerSnap.exists();
      console.log('[syncUserProfile] platformOwner doc exists():', isOwner);
      
      profile.status = isOwner ? 'approved' : 'pending';
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
    ...(!isFirstUser && { status: 'pending' }),
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
