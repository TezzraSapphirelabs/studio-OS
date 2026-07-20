// ============================================================
// Studio OS — Presence Service (Firestore)
// ============================================================

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function startPresencePing(userId: string): () => void {
  // Update presence immediately
  updatePresence(userId);

  // Ping every 2 minutes
  const interval = setInterval(() => {
    updatePresence(userId);
  }, 2 * 60 * 1000);

  // Return a cleanup function
  return () => clearInterval(interval);
}

async function updatePresence(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastActive: new Date().toISOString(),
    });
  } catch (error) {
    // Silently fail for presence to avoid console spam
    console.debug('[Studio OS] Failed to update presence:', error);
  }
}

export function isUserOnline(lastActive?: string): boolean {
  if (!lastActive) return false;
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
  
  // Consider user online if active within the last 5 minutes
  return diffInMinutes <= 5;
}
