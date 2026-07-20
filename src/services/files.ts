import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DriveFile, DriveFolder } from '@/types';
import { uploadFileToStorage, deleteFileFromStorage, getFileUrl } from '@/lib/storage/client';

// ============================================================
// Folders
// ============================================================

export async function createFolder(
  projectId: string,
  name: string,
  parentId: string | null,
  ownerUid: string
): Promise<string> {
  const newFolderRef = doc(collection(db, 'folders'));
  const folderData: DriveFolder = {
    id: newFolderRef.id,
    projectId,
    name,
    parentId,
    ownerUid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(newFolderRef, folderData);
  return newFolderRef.id;
}

export async function updateFolder(
  folderId: string,
  updates: Partial<Omit<DriveFolder, 'id' | 'projectId' | 'ownerUid' | 'createdAt'>>
): Promise<void> {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteFolder(folderId: string): Promise<void> {
  // Note: in a real app, this should recursively delete files and subfolders,
  // or a cloud function should handle it. For now we just delete the document.
  await deleteDoc(doc(db, 'folders', folderId));
}

export function subscribeToFolders(
  projectId: string,
  callback: (folders: DriveFolder[]) => void
): () => void {
  const q = query(
    collection(db, 'folders'),
    where('projectId', '==', projectId)
  );

  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map((doc) => doc.data() as DriveFolder);
    // Sort client side by name
    folders.sort((a, b) => a.name.localeCompare(b.name));
    callback(folders);
  });
}

// ============================================================
// Files
// ============================================================

export function uploadFile(
  projectId: string,
  folderId: string | null,
  ownerUid: string,
  file: File,
  onProgress?: (progress: number) => void,
  onError?: (error: Error) => void,
  onComplete?: (fileData: DriveFile) => void
) {
  // Create a unique storage path
  const fileId = doc(collection(db, 'files')).id;
  const storagePath = `project-files/${projectId}/${fileId}_${file.name}`;

  const uploader = uploadFileToStorage(
    file,
    storagePath,
    onProgress,
    onError,
    async () => {
      try {
        const downloadUrl = getFileUrl(storagePath);

        const newFileData: DriveFile = {
          id: fileId,
          projectId,
          folderId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: downloadUrl,
          storagePath,
          ownerUid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'files', fileId), newFileData);

        if (onComplete) onComplete(newFileData);
      } catch (error) {
        if (onError) onError(error as Error);
      }
    }
  );

  return { cancel: () => uploader.abort() };
}

export async function updateFile(
  fileId: string,
  updates: Partial<Omit<DriveFile, 'id' | 'projectId' | 'ownerUid' | 'createdAt' | 'size' | 'type' | 'url' | 'storagePath'>>
): Promise<void> {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteFile(fileId: string, storagePath: string): Promise<void> {
  // Delete from Storage first
  try {
    await deleteFileFromStorage(storagePath);
  } catch (error: unknown) {
    // If object not found in storage, that's fine, proceed to delete doc
    // Our custom API might throw a standard Error, but we continue anyway if it's not critical
    if (error && typeof error === 'object' && 'code' in error && (error as {code: string}).code !== 'storage/object-not-found') {
      console.warn('Non-fatal error deleting from storage:', error);
    }
  }

  // Then delete from Firestore
  await deleteDoc(doc(db, 'files', fileId));
}

export function subscribeToFiles(
  projectId: string,
  callback: (files: DriveFile[]) => void
): () => void {
  const q = query(
    collection(db, 'files'),
    where('projectId', '==', projectId)
  );

  return onSnapshot(q, (snapshot) => {
    const files = snapshot.docs.map((doc) => doc.data() as DriveFile);
    callback(files);
  });
}
