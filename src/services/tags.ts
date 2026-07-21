import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Tag } from '@/types';

export const TAGS_COL = 'tags';

function docToTag(id: string, data: DocumentData): Tag {
  return {
    id,
    workspaceId: data.workspaceId ?? '',
    name: data.name ?? '',
    color: data.color ?? '#3b82f6',
    priority: data.priority ?? false,
    status: data.status ?? false,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export function subscribeToTags(
  workspaceId: string,
  onUpdate: (tags: Tag[], error: string | null) => void
) {
  const q = query(
    collection(db, TAGS_COL),
    where('workspaceId', '==', workspaceId),
    orderBy('name', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tags = snapshot.docs.map((d) => docToTag(d.id, d.data()));
      onUpdate(tags, null);
    },
    (error) => {
      console.error('[Studio OS] Subscribe tags error:', error);
      onUpdate([], 'Failed to load tags.');
    }
  );
}

export async function createTag(
  workspaceId: string,
  name: string,
  color: string,
  priority = false,
  status = false
): Promise<{ id?: string; error?: string }> {
  try {
    const ref = doc(collection(db, TAGS_COL));
    const now = new Date().toISOString();
    
    await setDoc(ref, {
      workspaceId,
      name: name.trim(),
      color,
      priority,
      status,
      createdAt: now,
      updatedAt: now,
    });
    
    return { id: ref.id };
  } catch (error: unknown) {
    console.error('Error creating tag:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return { error: `Failed to create tag: ${msg}` };
  }
}

export async function updateTag(
  tagId: string,
  data: Partial<Pick<Tag, 'name' | 'color' | 'priority' | 'status'>>
): Promise<{ error?: string }> {
  try {
    const ref = doc(db, TAGS_COL, tagId);
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.color !== undefined) updateData.color = data.color;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    
    await updateDoc(ref, updateData);
    
    return {};
  } catch (error: unknown) {
    console.error('Error updating tag:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return { error: `Failed to update tag: ${msg}` };
  }
}

export async function deleteTag(tagId: string): Promise<{ error?: string }> {
  try {
    await deleteDoc(doc(db, TAGS_COL, tagId));
    return {};
  } catch (error: unknown) {
    console.error('Error deleting tag:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return { error: `Failed to delete tag: ${msg}` };
  }
}
