// ============================================================
// Studio OS — Activity Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type ProjectActivity } from '@/types';

export const ACTIVITIES_COL = 'activities';

function normalizeDate(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (val as any).toDate === 'function') return (val as any).toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  try {
    return new Date(val as string | number).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function docToActivity(id: string, data: DocumentData): ProjectActivity {
  return {
    id,
    projectId: data.projectId ?? '',
    workspaceId: data.workspaceId,
    ownerUid: data.ownerUid ?? '',
    action: data.action ?? '',
    target: data.target ?? '',
    createdAt: normalizeDate(data.createdAt),
  };
}

export function createActivityRef() {
  return doc(collection(db, ACTIVITIES_COL));
}

export function subscribeToWorkspaceActivity(
  workspaceId: string,
  onUpdate: (activities: ProjectActivity[], error: string | null) => void
): Unsubscribe {
  // We query all activities where workspaceId == workspaceId OR projectId == workspaceId
  // Since Firestore OR queries might require newer SDK features or composite indexes,
  // we'll fetch activities where projectId == workspaceId (which handles workspace-level events)
  // and we also need project events.
  // Actually, for a fully scalable feed, we should use multiple queries or a cloud function.
  // We will fetch where projectId == workspaceId for now, and rely on the client to merge 
  // with project activities if needed, OR we just use a generic query if we start stamping workspaceId everywhere.
  
  // For Phase 6, we'll fetch where `projectId == workspaceId` (workspace-level events)
  // PLUS we'll fetch where `workspaceId == workspaceId` (project-level events going forward).
  // Due to Firestore limitations, we'll run two queries and merge them client-side.
  const qWorkspace = query(collection(db, ACTIVITIES_COL), where('projectId', '==', workspaceId));
  const qProjects = query(collection(db, ACTIVITIES_COL), where('workspaceId', '==', workspaceId));

  let workspaceActivities: ProjectActivity[] = [];
  let projectActivities: ProjectActivity[] = [];
  
  const emit = () => {
    // Merge, deduplicate by ID, and sort
    const all = [...workspaceActivities, ...projectActivities];
    const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
    unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(unique, null);
  };

  const unsubWorkspace = onSnapshot(qWorkspace, (snap) => {
    workspaceActivities = snap.docs.map(d => docToActivity(d.id, d.data()));
    emit();
  }, () => onUpdate([], friendlyError()));

  const unsubProjects = onSnapshot(qProjects, (snap) => {
    projectActivities = snap.docs.map(d => docToActivity(d.id, d.data()));
    emit();
  }, () => onUpdate([], friendlyError()));

  return () => {
    unsubWorkspace();
    unsubProjects();
  };
}

function friendlyError(): string {
  return 'Failed to load activity feed.';
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
