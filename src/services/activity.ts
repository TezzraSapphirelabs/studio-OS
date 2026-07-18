// ============================================================
// Studio OS — Activity Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type ProjectActivity } from '@/types';

export const ACTIVITIES_COL = 'activities';

function normalizeDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  try {
    return new Date(val).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function docToActivity(id: string, data: DocumentData): ProjectActivity {
  return {
    id,
    projectId: data.projectId ?? '',
    ownerUid: data.ownerUid ?? '',
    action: data.action ?? '',
    target: data.target ?? '',
    createdAt: normalizeDate(data.createdAt),
  };
}

export function createActivityRef() {
  return doc(collection(db, ACTIVITIES_COL));
}

export function subscribeToProjectActivity(
  uid: string,
  projectId: string,
  onUpdate: (activities: ProjectActivity[], error: string | null) => void
): Unsubscribe {
  // We query by projectId and ownerUid. 
  // We don't use orderBy yet because it would require a composite index on [ownerUid, projectId, createdAt].
  // We will sort client side for now.
  const q = query(
    collection(db, ACTIVITIES_COL),
    where('projectId', '==', projectId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs
        .map((d) => docToActivity(d.id, d.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(activities, null);
    },
    (error) => {
      console.error('[Studio OS] Activity subscribe error:', error);
      onUpdate([], 'Failed to load activity feed.');
    }
  );
}
