import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, reauthenticateWithCredential, reauthenticateWithPopup, AuthProvider, AuthCredential } from 'firebase/auth';

const PROJECTS_COL = 'projects';
const MEMBERS_COL = 'members';
const INVITES_COL = 'projectInvites';
const ACTIVITIES_COL = 'activities';
const USERS_COL = 'users';

export async function validateAccountDeletion(uid: string): Promise<{ error?: string }> {
  try {
    const q = query(
      collection(db, PROJECTS_COL),
      where('ownerUid', '==', uid)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      return {
        error: `You cannot delete your account because you are the owner of ${snap.size} project(s). Please delete them or transfer ownership to another member before deleting your account.`
      };
    }

    return {};
  } catch (err: any) {
    return { error: err.message || 'Failed to validate account deletion.' };
  }
}

export async function deleteUserAccountData(user: User): Promise<{ error?: string }> {
  try {
    const uid = user.uid;
    const email = user.email || '';

    let batch = writeBatch(db);
    let opCount = 0;

    const commitBatchIfNeeded = async () => {
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    };

    if (email) {
      const invitesQ = query(collection(db, INVITES_COL), where('inviteeEmail', '==', email.toLowerCase()));
      const invitesSnap = await getDocs(invitesQ);
      for (const d of invitesSnap.docs) {
        batch.delete(d.ref);
        opCount++;
        await commitBatchIfNeeded();
      }
    }

    const membersQ = query(collection(db, MEMBERS_COL), where('userId', '==', uid));
    const membersSnap = await getDocs(membersQ);

    const { arrayRemove } = await import('firebase/firestore');

    for (const d of membersSnap.docs) {
      const projectId = d.data().projectId;
      batch.delete(d.ref);
      opCount++;

      if (projectId) {
        const projectRef = doc(db, PROJECTS_COL, projectId);
        batch.update(projectRef, {
          memberUids: arrayRemove(uid)
        });
        opCount++;
      }
      await commitBatchIfNeeded();
    }

    const activitiesQ = query(collection(db, ACTIVITIES_COL), where('ownerUid', '==', uid));
    const activitiesSnap = await getDocs(activitiesQ);
    for (const d of activitiesSnap.docs) {
      batch.delete(d.ref);
      opCount++;
      await commitBatchIfNeeded();
    }

    const profileRef = doc(db, USERS_COL, uid);
    batch.delete(profileRef);
    opCount++;

    if (opCount > 0) {
      await batch.commit();
    }

    return {};
  } catch (err: any) {
    console.error('Data cleanup failed:', err);
    return { error: err.message || 'Failed to clean up user data.' };
  }
}

export async function reauthenticate(user: User, providerOrCredential: AuthProvider | AuthCredential): Promise<{ error?: string }> {
  try {
    // AuthCredential has a 'signInMethod' property, while AuthProvider does not.
    if ('signInMethod' in providerOrCredential) {
      await reauthenticateWithCredential(user, providerOrCredential as AuthCredential);
    } else {
      await reauthenticateWithPopup(user, providerOrCredential as AuthProvider);
    }
    return {};
  } catch (err: any) {
    if (err.code === 'auth/wrong-password') {
      return { error: 'Incorrect password.' };
    }
    if (err.code === 'auth/popup-closed-by-user') {
      return { error: 'Authentication popup closed.' };
    }
    return { error: err.message || 'Failed to re-authenticate.' };
  }
}
