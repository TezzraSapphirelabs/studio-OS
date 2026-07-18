import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
}

export interface Conversation {
  id?: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt: any;
}

/**
 * Creates a new conversation and returns its ID.
 */
export async function createConversation(uid: string, title: string = 'New Conversation') {
  const convRef = await addDoc(collection(db, `users/${uid}/conversations`), {
    title,
    updatedAt: serverTimestamp(),
  });
  return convRef.id;
}

/**
 * Fetches all conversations for a user.
 */
export async function getConversations(uid: string) {
  const q = query(
    collection(db, `users/${uid}/conversations`),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
}

/**
 * Fetches all messages for a specific conversation.
 */
export async function getMessages(uid: string, conversationId: string) {
  const q = query(
    collection(db, `users/${uid}/conversations/${conversationId}/messages`),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
}

/**
 * Adds a message to a conversation.
 */
export async function addMessage(uid: string, conversationId: string, role: 'user' | 'assistant', content: string) {
  const msgRef = await addDoc(collection(db, `users/${uid}/conversations/${conversationId}/messages`), {
    role,
    content,
    createdAt: serverTimestamp(),
  });
  
  // Update the conversation's updatedAt
  await updateDoc(doc(db, `users/${uid}/conversations`, conversationId), {
    updatedAt: serverTimestamp(),
  });
  
  return msgRef.id;
}

import { generateAIResponseAction } from '@/actions/ai';

/**
 * Generates an AI response using the Google Gemini model.
 */
export async function generateAIResponse(userMessage: string, history: Message[] = []): Promise<string> {
  // Convert Firestore objects to plain JavaScript objects to prevent Next.js Server Action serialization errors
  const plainHistory = history.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content
  }));
  
  return await generateAIResponseAction(userMessage, plainHistory as Message[]);
}

/**
 * Renames a conversation.
 */
export async function renameConversation(uid: string, conversationId: string, newTitle: string) {
  await updateDoc(doc(db, `users/${uid}/conversations`, conversationId), {
    title: newTitle,
    updatedAt: serverTimestamp(),
  });
}

import { deleteDoc } from 'firebase/firestore';

/**
 * Deletes a conversation and all its messages.
 */
export async function deleteConversation(uid: string, conversationId: string) {
  // First, fetch and delete all messages
  const msgs = await getMessages(uid, conversationId);
  const deletePromises = msgs.map(msg => 
    deleteDoc(doc(db, `users/${uid}/conversations/${conversationId}/messages`, msg.id!))
  );
  await Promise.all(deletePromises);
  
  // Then delete the conversation document
  await deleteDoc(doc(db, `users/${uid}/conversations`, conversationId));
}
