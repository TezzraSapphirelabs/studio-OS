import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CalendarEvent } from '@/types';

/**
 * Creates a new calendar event for a user
 */
export async function createEvent(userId: string, eventData: Omit<CalendarEvent, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'archived'>) {
  try {
    const eventsRef = collection(db, `users/${userId}/events`);
    const newEventRef = doc(eventsRef);
    const now = new Date().toISOString();
    
    const event: CalendarEvent = {
      ...eventData,
      id: newEventRef.id,
      ownerId: userId,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(newEventRef, event);
    return { data: event, error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Error creating event:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Updates an existing calendar event
 */
export async function updateEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>) {
  try {
    const eventRef = doc(db, `users/${userId}/events/${eventId}`);
    const now = new Date().toISOString();
    
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: now,
    });
    
    return { error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Error updating event:', error);
    return { error: error.message };
  }
}

/**
 * Deletes a calendar event
 */
export async function deleteEvent(userId: string, eventId: string) {
  try {
    const eventRef = doc(db, `users/${userId}/events/${eventId}`);
    await deleteDoc(eventRef);
    
    return { error: null };
  } catch (err) {
    const error = err as Error;
    console.error('Error deleting event:', error);
    return { error: error.message };
  }
}

/**
 * Subscribes to all events for a user (real-time)
 */
export function subscribeToEvents(userId: string, onUpdate: (events: CalendarEvent[], error: string | null) => void) {
  const eventsRef = collection(db, `users/${userId}/events`);
  const q = query(eventsRef, orderBy('date', 'asc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const events: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        events.push(doc.data() as CalendarEvent);
      });
      onUpdate(events, null);
    },
    (error) => {
      console.error('Error subscribing to events:', error);
      onUpdate([], error.message);
    }
  );
}
