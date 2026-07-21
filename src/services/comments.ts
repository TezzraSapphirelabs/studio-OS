// ============================================================
// Studio OS — Comments Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Comment, type UserProfile } from '@/types';
import { createNotification } from './notifications';

const COMMENTS_COL = 'comments';

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore comments error:', msg);
  return `Something went wrong: ${msg}`;
}

function docToComment(id: string, data: DocumentData): Comment {
  return {
    id,
    projectId: data.projectId,
    entityId: data.entityId ?? '',
    entityType: data.entityType ?? 'project',
    authorId: data.authorId ?? '',
    authorName: data.authorName ?? 'Unknown',
    authorPhotoURL: data.authorPhotoURL ?? null,
    content: data.content ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export function subscribeToComments(
  entityId: string,
  projectId: string,
  onUpdate: (comments: Comment[]) => void,
  onError: (error: string) => void
) {
  const q = query(
    collection(db, COMMENTS_COL),
    where('projectId', '==', projectId),
    where('entityId', '==', entityId),
    orderBy('createdAt', 'asc')
  );

  return import('firebase/firestore').then(({ onSnapshot }) => 
    onSnapshot(q, (snap) => {
      const comments = snap.docs.map(d => docToComment(d.id, d.data()));
      onUpdate(comments);
    }, (err) => onError(friendlyError(err)))
  );
}

// Simple regex to find @mentions in text
const MENTION_REGEX = /@([a-zA-Z0-9_.-]+)/g;

async function processMentions(content: string, authorName: string, entityId: string, entityType: string) {
  const mentions = Array.from(new Set(content.match(MENTION_REGEX) || []));
  if (mentions.length === 0) return;

  const usersCol = collection(db, 'users');
  const snap = await getDocs(usersCol);
  const users = snap.docs.map(d => d.data() as UserProfile);

  for (const mention of mentions) {
    const nameWithoutAt = mention.substring(1).toLowerCase();
    // In a real app, mentions would use unique usernames. Here we match against displayName (which may have spaces) 
    // or just assume they type the first name. For robustness, we check if displayName includes the string.
    const mentionedUser = users.find(u => 
      u.displayName.toLowerCase().replace(/\s+/g, '') === nameWithoutAt ||
      u.displayName.toLowerCase().includes(nameWithoutAt)
    );

    if (mentionedUser) {
      let link = '/dashboard';
      if (entityType === 'task') link = `/tasks?id=${entityId}`;
      else if (entityType === 'project') link = `/projects/${entityId}`;
      else if (entityType === 'note') link = `/notes?id=${entityId}`;

      await createNotification(
        mentionedUser.uid,
        'mention',
        'You were mentioned',
        `${authorName} mentioned you in a ${entityType}.`,
        link
      );
    }
  }
}

export async function createComment(
  authorId: string,
  authorName: string,
  authorPhotoURL: string | null,
  entityId: string,
  entityType: 'project' | 'task' | 'note',
  projectId: string | undefined,
  content: string
): Promise<{ error?: string }> {
  try {
    const { setDoc } = await import('firebase/firestore');
    const ref = doc(collection(db, COMMENTS_COL));
    const now = new Date().toISOString();
    
    await setDoc(ref, {
      projectId, // For security rules
      entityId,
      entityType,
      authorId,
      authorName,
      authorPhotoURL,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    });

    // Process mentions asynchronously
    processMentions(content, authorName, entityId, entityType).catch(err => {
      console.error('Failed to process mentions:', err);
    });

    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, COMMENTS_COL, commentId));
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function updateComment(commentId: string, content: string): Promise<{ error?: string }> {
  try {
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, COMMENTS_COL, commentId), {
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    });
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
