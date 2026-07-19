'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { NoteEditor } from '@/components';
import { type Note } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FileTextIcon } from '@/components/icons';
import { useToast } from '@/contexts/toast-context';

export default function NoteEditorPage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  const noteId = params?.noteId as string;

  useEffect(() => {
    if (!user?.uid || !noteId) return;
    
    let isMounted = true;
    
    const fetchNote = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'notes', noteId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          setNote({
            id: docSnap.id,
            ownerId: data.ownerId ?? '',
            title: data.title ?? '',
            content: data.content ?? '',
            archived: data.archived ?? false,
            lastEditedBy: data.lastEditedBy ?? '',
            createdAt: data.createdAt ?? new Date().toISOString(),
            updatedAt: data.updatedAt ?? new Date().toISOString(),
          });
        } else if (isMounted) {
          // Note not found
          toast('Note not found', 'error');
          router.push('/notes');
        }
      } catch (error) {
        console.error("Error fetching note:", error);
        if (isMounted) {
          toast('Error loading note', 'error');
          router.push('/notes');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchNote();
    
    return () => {
      isMounted = false;
    };
  }, [noteId, user?.uid, router, toast]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!note || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <FileTextIcon size={24} className="text-white/20 mb-2" />
        <p className="text-white/50">Note not available</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <NoteEditor key={note.id} note={note} userId={user.uid} />
    </div>
  );
}
