// ============================================================
// Studio OS — Settings Service (Firestore)
// ============================================================

import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type WorkspaceSettings } from '@/types';
import { createActivityRef } from './activity';

const WORKSPACES_COL = 'workspaces';

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Studio OS] Firestore error:', msg);
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this action.';
  }
  return `Something went wrong: ${msg}`;
}

export async function fetchWorkspaceSettings(workspaceId: string): Promise<{ settings?: WorkspaceSettings | null; error?: string }> {
  try {
    const settingsDoc = await getDoc(doc(db, WORKSPACES_COL, workspaceId));
    if (!settingsDoc.exists()) {
      return { settings: null };
    }
    const data = settingsDoc.data();
    return {
      settings: {
        id: settingsDoc.id,
        name: data.name ?? 'My Workspace',
        description: data.description ?? '',
        logoUrl: data.logoUrl ?? null,
        timezone: data.timezone ?? 'UTC',
        defaultLanguage: data.defaultLanguage ?? 'en',
        dateFormat: data.dateFormat ?? 'MM/DD/YYYY',
        timeFormat: data.timeFormat ?? '12h',
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      },
    };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function saveWorkspaceSettings(
  workspaceId: string,
  updates: Partial<WorkspaceSettings>,
  actorUid: string
): Promise<{ error?: string }> {
  try {
    const now = new Date().toISOString();
    const settingsRef = doc(db, WORKSPACES_COL, workspaceId);
    const snap = await getDoc(settingsRef);

    const batch = writeBatch(db);

    if (!snap.exists()) {
      // Create new settings document
      const newSettings: WorkspaceSettings = {
        id: workspaceId,
        name: updates.name ?? 'My Workspace',
        description: updates.description ?? '',
        logoUrl: updates.logoUrl ?? null,
        timezone: updates.timezone ?? 'UTC',
        defaultLanguage: updates.defaultLanguage ?? 'en',
        dateFormat: updates.dateFormat ?? 'MM/DD/YYYY',
        timeFormat: updates.timeFormat ?? '12h',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(settingsRef, newSettings);
    } else {
      batch.update(settingsRef, {
        ...updates,
        updatedAt: now,
      });
    }

    // Log activity
    batch.set(createActivityRef(), {
      projectId: workspaceId,
      ownerUid: actorUid,
      action: 'updated workspace settings',
      target: '',
      createdAt: now,
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function deleteWorkspace(workspaceId: string, actorUid: string): Promise<{ error?: string }> {
  try {
    // Note: Actually deleting a workspace with all its subcollections and resources
    // requires a Firebase Extension or Cloud Function in a production environment.
    // For Studio OS Phase 8, we will delete the workspace settings document,
    // which signifies the workspace itself is deleted.
    
    // In a real application, you would:
    // 1. Delete all projects, tasks, notes, files, folders.
    // 2. Delete all workspace members and invites.
    // 3. Delete the workspace settings.
    
    const batch = writeBatch(db);
    batch.delete(doc(db, WORKSPACES_COL, workspaceId));

    // Log the deletion (this might be orphaned, but we log it anyway)
    batch.set(createActivityRef(), {
      projectId: workspaceId,
      ownerUid: actorUid,
      action: 'deleted the workspace',
      target: '',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
    return {};
  } catch (error) {
    return { error: friendlyError(error) };
  }
}
