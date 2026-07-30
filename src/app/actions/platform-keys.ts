'use server';

import { adminDb } from '@/lib/firebase-admin';
import crypto from 'node:crypto';

const PLATFORM_KEYS_COL = 'platformAccessKeys';
const PLATFORM_OWNERS_COL = 'platformOwners';
const PLATFORM_AUDIT_COL = 'platformAuditLogs';

export interface PlatformKeyData {
  id: string; // Document ID (the key hash)
  createdAt: string;
  createdBy: string;
  expiresAt: string | null;
  maxUses: number | null; // null = unlimited
  uses: number;
  isActive: boolean;
}

export interface PlatformOwnerData {
  userId: string;
  addedAt: string;
  displayName?: string;
  email?: string;
  status?: string;
}

function hashKey(plaintextKey: string): string {
  return crypto.createHash('sha256').update(plaintextKey).digest('hex');
}

/**
 * Checks if the platform owners collection is empty.
 * If so, makes the provided user the first platform owner.
 * Returns true if the user was just bootstrapped, false otherwise.
 */
export async function bootstrapPlatformOwner(userId: string): Promise<boolean> {
  try {
    const snap = await adminDb.collection(PLATFORM_OWNERS_COL).limit(1).get();
    if (snap.empty) {
      await adminDb.collection(PLATFORM_OWNERS_COL).doc(userId).set({
        userId,
        addedAt: new Date().toISOString(),
      });
      await adminDb.collection(PLATFORM_AUDIT_COL).add({
        action: 'BOOTSTRAP',
        userId,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('[bootstrapPlatformOwner]', error);
    return false;
  }
}

/**
 * Generates a new Platform Access Key.
 * Only an existing Platform Owner can call this.
 */
export async function generatePlatformKey(actorUid: string, maxUses: number | null = 1) {
  try {
    // Verify actor is platform owner
    const actorSnap = await adminDb.collection(PLATFORM_OWNERS_COL).doc(actorUid).get();
    if (!actorSnap.exists) {
      return { error: 'Unauthorized. Only Platform Owners can generate keys.' };
    }

    // Check limit of platform owners (max 2)
    const ownersSnap = await adminDb.collection(PLATFORM_OWNERS_COL).get();
    if (ownersSnap.size >= 2) {
      return { error: 'Maximum number of Platform Owners (2) reached.' };
    }

    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = hashKey(rawKey);
    const now = new Date().toISOString();

    const keyData: PlatformKeyData = {
      id: keyHash,
      createdAt: now,
      createdBy: actorUid,
      expiresAt: null,
      maxUses: maxUses,
      uses: 0,
      isActive: true,
    };

    await adminDb.collection(PLATFORM_KEYS_COL).doc(keyHash).set(keyData);
    
    await adminDb.collection(PLATFORM_AUDIT_COL).add({
      action: 'GENERATE_KEY',
      actorUid,
      keyHash,
      timestamp: now,
    });

    return { plaintextKey: rawKey };
  } catch (error: unknown) {
    console.error('[generatePlatformKey]', error);
    return { error: (error as Error).message || 'Failed to generate key.' };
  }
}

/**
 * Validates a Platform Access Key and grants the user Platform Owner status.
 */
export async function validatePlatformKey(plaintextKey: string, userId: string) {
  try {
    // Check max owners first
    const ownersSnap = await adminDb.collection(PLATFORM_OWNERS_COL).get();
    if (ownersSnap.size >= 2) {
      return { error: 'Maximum number of Platform Owners (2) reached. Registration closed.' };
    }
    
    // Check if user is already an owner
    const existingOwner = await adminDb.collection(PLATFORM_OWNERS_COL).doc(userId).get();
    if (existingOwner.exists) {
        return { error: 'You are already a Platform Owner.' };
    }

    const keyHash = hashKey(plaintextKey);
    const keyRef = adminDb.collection(PLATFORM_KEYS_COL).doc(keyHash);
    
    const result = await adminDb.runTransaction(async (t) => {
      const keySnap = await t.get(keyRef);
      if (!keySnap.exists) {
        throw new Error('Invalid or expired Platform Access Key.');
      }

      const keyData = keySnap.data() as PlatformKeyData;

      if (!keyData.isActive) {
        throw new Error('This key has been revoked or is inactive.');
      }

      if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
        throw new Error('This key has expired.');
      }

      if (keyData.maxUses !== null && keyData.uses >= keyData.maxUses) {
        throw new Error('This key has reached its usage limit.');
      }

      // Update key usage
      t.update(keyRef, {
        uses: keyData.uses + 1,
        isActive: keyData.maxUses !== null && (keyData.uses + 1) >= keyData.maxUses ? false : true,
      });

      // Add to platformOwners
      const ownerRef = adminDb.collection(PLATFORM_OWNERS_COL).doc(userId);
      t.set(ownerRef, {
        userId,
        addedAt: new Date().toISOString()
      });
      
      // Audit log
      const auditRef = adminDb.collection(PLATFORM_AUDIT_COL).doc();
      t.set(auditRef, {
          action: 'VALIDATE_KEY',
          userId,
          keyHash,
          timestamp: new Date().toISOString()
      });

      // Update the user's status so they are removed from the Pending Access Requests list
      const userProfileRef = adminDb.collection('users').doc(userId);
      t.update(userProfileRef, {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });

      return true;
    });

    return { success: result };
  } catch (error: unknown) {
    console.error('[validatePlatformKey]', error);
    const msg = (error as Error).message;
    if (msg.includes('Maximum number') || msg.includes('already a Platform Owner')) {
        return { error: msg };
    }
    return { error: 'Invalid or expired Platform Access Key.' };
  }
}

/**
 * Revokes a key.
 */
export async function revokePlatformKey(keyHash: string, actorUid: string) {
  try {
    const actorSnap = await adminDb.collection(PLATFORM_OWNERS_COL).doc(actorUid).get();
    if (!actorSnap.exists) {
      return { error: 'Unauthorized.' };
    }

    await adminDb.collection(PLATFORM_KEYS_COL).doc(keyHash).update({
      isActive: false
    });
    
    await adminDb.collection(PLATFORM_AUDIT_COL).add({
      action: 'REVOKE_KEY',
      actorUid,
      keyHash,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('[revokePlatformKey]', error);
    return { error: (error as Error).message || 'Failed to revoke key.' };
  }
}

export async function getPlatformKeys(actorUid: string) {
  try {
    const actorSnap = await adminDb.collection(PLATFORM_OWNERS_COL).doc(actorUid).get();
    if (!actorSnap.exists) {
      return { error: 'Unauthorized.' };
    }

    const q = adminDb.collection(PLATFORM_KEYS_COL).orderBy('createdAt', 'desc');
    const snap = await q.get();
    const keys = snap.docs.map(doc => doc.data() as PlatformKeyData);
    return { keys };
  } catch (error: unknown) {
    console.error('[getPlatformKeys]', error);
    return { error: 'Failed to fetch keys.' };
  }
}

export async function getPlatformOwners(actorUid: string) {
  try {
    const actorSnap = await adminDb.collection(PLATFORM_OWNERS_COL).doc(actorUid).get();
    if (!actorSnap.exists) {
      return { error: 'Unauthorized.' };
    }

    const snap = await adminDb.collection(PLATFORM_OWNERS_COL).get();
    const owners = await Promise.all(snap.docs.map(async (doc) => {
      const data = doc.data() as PlatformOwnerData;
      const userSnap = await adminDb.collection('users').doc(data.userId).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        data.displayName = userData?.displayName;
        data.email = userData?.email;
      }
      data.status = 'Active';
      return data;
    }));
    return { owners };
  } catch (error: unknown) {
    console.error('[getPlatformOwners]', error);
    return { error: 'Failed to fetch owners.' };
  }
}

export async function removePlatformOwner(actorUid: string, targetUid: string) {
  try {
    if (actorUid === targetUid) {
      return { error: 'You cannot remove yourself.' };
    }

    const actorRef = adminDb.collection(PLATFORM_OWNERS_COL).doc(actorUid);
    const targetRef = adminDb.collection(PLATFORM_OWNERS_COL).doc(targetUid);
    const targetUserRef = adminDb.collection('users').doc(targetUid);
    const auditRef = adminDb.collection(PLATFORM_AUDIT_COL).doc();

    await adminDb.runTransaction(async (t) => {
      const actorSnap = await t.get(actorRef);
      if (!actorSnap.exists) {
        throw new Error('Unauthorized.');
      }
      
      const targetSnap = await t.get(targetRef);
      if (!targetSnap.exists) {
        throw new Error('Target is not a Platform Owner.');
      }

      const targetUserSnap = await t.get(targetUserRef);

      // 1. Remove from Platform Owners
      t.delete(targetRef);
      
      // 2. Demote user profile status back to pending
      if (targetUserSnap.exists) {
        t.update(targetUserRef, {
          status: 'pending',
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Create Audit Log
      t.set(auditRef, {
        action: 'REMOVE_OWNER',
        actorUid,
        targetUid,
        timestamp: new Date().toISOString(),
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('[removePlatformOwner]', error);
    return { error: (error as Error).message || 'Failed to remove owner.' };
  }
}

export async function verifyPlatformOwnerDeletion(uid: string) {
  try {
    const ownerSnap = await adminDb.collection(PLATFORM_OWNERS_COL).doc(uid).get();
    if (ownerSnap.exists) {
      const allOwners = await adminDb.collection(PLATFORM_OWNERS_COL).get();
      if (allOwners.size <= 1) {
        return { error: 'You are the last Platform Owner. Add another Platform Owner before deleting this account.' };
      }
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('[verifyPlatformOwnerDeletion]', error);
    return { error: 'Failed to verify platform owner deletion.' };
  }
}
