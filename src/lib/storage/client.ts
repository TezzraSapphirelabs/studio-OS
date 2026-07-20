export async function deleteFileFromStorage(key: string): Promise<void> {
  const res = await fetch(`/api/storage/delete?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete file from storage');
  }
}

export function uploadFileToStorage(
  file: File,
  key: string,
  onProgress?: (progress: number) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): { abort: () => void } {
  let isAborted = false;
  let activeXhr: XMLHttpRequest | null = null;
  const maxRetries = 3;

  const attemptUpload = async (attempt: number) => {
    if (isAborted) return;
    try {
      activeXhr = new XMLHttpRequest();
      activeXhr.open('POST', '/api/storage/upload', true);
      
      // We pass the key and content type via headers to the API route
      activeXhr.setRequestHeader('x-file-key', key);
      activeXhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      
      if (onProgress) {
        activeXhr.upload.onprogress = (e) => {
          if (e.lengthComputable && !isAborted) {
            onProgress((e.loaded / e.total) * 100);
          }
        };
      }
      
      activeXhr.onload = () => {
        if (isAborted) return;
        if (activeXhr && activeXhr.status >= 200 && activeXhr.status < 300) {
          if (onComplete) onComplete();
        } else {
          handleFailure(new Error(`Upload failed with status ${activeXhr?.status}`), attempt);
        }
      };
      
      activeXhr.onerror = () => {
        if (isAborted) return;
        handleFailure(new Error('Network error during upload'), attempt);
      };
      
      activeXhr.send(file);
    } catch (err: unknown) {
      if (!isAborted) handleFailure(err as Error, attempt);
    }
  };

  const handleFailure = (err: Error, attempt: number) => {
    if (attempt < maxRetries && !isAborted) {
      console.warn(`Upload attempt ${attempt} failed, retrying...`, err);
      setTimeout(() => attemptUpload(attempt + 1), 1000 * attempt);
    } else {
      if (onError) onError(err);
    }
  };

  // Start initial attempt
  attemptUpload(1);

  return {
    abort: () => {
      isAborted = true;
      if (activeXhr) {
        activeXhr.abort();
      }
    }
  };
}

export function getFileUrl(key: string): string {
  // For images and downloads, point to the redirect API route
  // We can't generate presigned URLs directly in the client securely without exposing secrets
  return `/api/storage/file?path=${encodeURIComponent(key)}`;
}
