// ============================================================
// Studio OS — Notifications Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Notification, type NotificationType } from '@/types';

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore notifications error:', msg);
  return `Something went wrong: ${msg}`;
}

function docToNotification(id: string, data: DocumentData): Notification {
  return {
    id,
    userId: data.userId ?? '',
    type: data.type ?? 'workspace_event',
    title: data.title ?? '',
    message: data.message ?? '',
    link: data.link,
    read: data.read ?? false,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

// ── CRUD ───────────────────────────────────────────────────

export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifications: Notification[]) => void,
  onError: (error: string) => void
) {
  // We use a subcollection pattern: users/{userId}/notifications
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc')
  );

  return import('firebase/firestore').then(({ onSnapshot }) => 
    onSnapshot(q, (snap) => {
      const notifications = snap.docs.map(d => docToNotification(d.id, d.data()));
      onUpdate(notifications);
    }, (err) => onError(friendlyError(err)))
  );
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<{ error?: string }> {
  try {
    const { setDoc } = await import('firebase/firestore');
    const ref = doc(collection(db, 'users', userId, 'notifications'));
    await setDoc(ref, {
      userId,
      type,
      title,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    });
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<{ error?: string }> {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const ref = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function markAllNotificationsRead(userId: string): Promise<{ error?: string }> {
  try {
    const q = query(collection(db, 'users', userId, 'notifications'));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    
    snap.docs.forEach(d => {
      if (!d.data().read) {
        batch.update(d.ref, { read: true });
      }
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function clearNotifications(userId: string): Promise<{ error?: string }> {
  try {
    const q = query(collection(db, 'users', userId, 'notifications'));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    
    snap.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
