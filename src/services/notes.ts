// ============================================================
// Studio OS — Notes Service (Firestore)
// ============================================================

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Note } from '@/types';

// ── Helpers ────────────────────────────────────────────────

function docToNote(id: string, data: DocumentData): Note {
  return {
    id,
    ownerId: data.ownerId ?? '',
    title: data.title ?? '',
    content: data.content ?? '',
    archived: data.archived ?? false,
    lastEditedBy: data.lastEditedBy ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this action.';
  }
  if (msg.includes('offline') || msg.includes('unavailable')) {
    return 'You appear to be offline. Please check your connection and try again.';
  }
  if (msg.includes('not-found')) {
    return 'The requested resource was not found.';
  }
  return `Something went wrong: ${msg}`;
}

// ── CRUD ───────────────────────────────────────────────────

export interface CreateNoteInput {
  title: string;
  content?: string;
}

export async function createNote(
  uid: string,
  input: CreateNoteInput,
): Promise<{ id?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    
    // Notes are a subcollection under users
    const notesRef = collection(db, 'users', uid, 'notes');
    const newNoteRef = doc(notesRef);
    
    await setDoc(newNoteRef, {
      ownerId: uid,
      title: input.title.trim() || 'Untitled Note',
      content: input.content || '',
      archived: false,
      lastEditedBy: uid,
      createdAt: now,
      updatedAt: now,
    });

    return { id: newNoteRef.id };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  archived?: boolean;
}

export async function updateNote(
  uid: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<{ error?: string }> {
  try {
    const now = new Date().toISOString();
    
    const noteRef = doc(db, 'users', uid, 'notes', noteId);
    
    const updates: Record<string, unknown> = { 
      updatedAt: now,
      lastEditedBy: uid,
    };
    
    if (input.title !== undefined) updates.title = input.title;
    if (input.content !== undefined) updates.content = input.content;
    if (input.archived !== undefined) updates.archived = input.archived;
    
    await updateDoc(noteRef, updates);

    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function deleteNote(
  uid: string,
  noteId: string,
): Promise<{ error?: string }> {
  try {
    const noteRef = doc(db, 'users', uid, 'notes', noteId);
    await deleteDoc(noteRef);
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

// ── Subscriptions ──────────────────────────────────────────

export function subscribeToUserNotes(
  uid: string,
  onUpdate: (notes: Note[], error: string | null) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', uid, 'notes')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notes = snapshot.docs
        .map((d) => docToNote(d.id, d.data()))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); // Sort by last edited descending
      onUpdate(notes, null);
    },
    (error) => {
      onUpdate([], friendlyError(error));
    }
  );
}
