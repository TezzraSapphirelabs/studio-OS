'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToUserNotes, createNote, deleteNote } from '@/services/notes';
import { type Note } from '@/types';
import { 
  FileTextIcon, PlusIcon, SearchIcon, FilterIcon
} from '@/components/icons';
import { useToast } from '@/contexts/toast-context';
import Link from 'next/link';

type SortOption = 'last-edited' | 'created' | 'alphabetical';

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('last-edited');
  const [showArchived, setShowArchived] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = subscribeToUserNotes(user.uid, (data, error) => {
      if (error) {
        toast(error || 'Error', 'error');
      } else {
        setNotes(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, toast]);

  const filteredAndSortedNotes = useMemo(() => {
    const result = notes.filter(n => {
      // Filter by archive status
      if (showArchived !== n.archived) return false;
      
      // Filter by search
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ);
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sortOption) {
        case 'last-edited':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [notes, searchQuery, sortOption, showArchived]);

  const handleCreateNote = async () => {
    if (!user) return;
    setIsCreating(true);
    
    const { id, error } = await createNote(user.uid, {
      title: 'Untitled Note',
      content: ''
    });

    if (error || !id) {
      toast(error || 'Failed to create note', 'error');
      setIsCreating(false);
      return;
    }
    
    toast('Note created', 'success');
    router.push(`/notes/${id}`);
    setIsCreating(false);
  };
  
  // Format dates nicely
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const activeNoteId = params?.noteId as string;

  return (
    <AppShell>
      {/* We use a negative margin trick to break out of the AppShell's default padding to make a true full-height split pane */}
      <div className="flex h-[calc(100vh-130px)] -mx-4 sm:-mx-6 lg:-mx-8 -my-8 border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0a0a0f] shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-white/[0.08] bg-black/40 backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileTextIcon size={18} className="text-violet-400" />
                Notes
              </h1>
              <button
                onClick={handleCreateNote}
                disabled={isCreating}
                className="p-1.5 rounded-lg bg-white/[0.04] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors disabled:opacity-50"
                title="New Note"
              >
                <PlusIcon size={16} />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
              />
            </div>
            
            {/* Filters & Sort */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <button
                  onClick={() => setShowArchived(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${!showArchived ? 'bg-violet-500/20 text-violet-300' : 'text-white/50 hover:bg-white/[0.04]'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setShowArchived(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showArchived ? 'bg-violet-500/20 text-violet-300' : 'text-white/50 hover:bg-white/[0.04]'}`}
                >
                  Archived
                </button>
              </div>
              
              <div className="relative group">
                <button className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-1">
                  <FilterIcon size={14} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 p-1 bg-[#12121a] border border-white/[0.08] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {(['last-edited', 'created', 'alphabetical'] as SortOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSortOption(opt)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${sortOption === opt ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'}`}
                    >
                      {opt === 'last-edited' ? 'Last Edited' : opt === 'created' ? 'Date Created' : 'Alphabetical'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              // Skeleton loaders
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] animate-pulse">
                  <div className="h-4 bg-white/[0.05] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/[0.05] rounded w-1/2"></div>
                </div>
              ))
            ) : filteredAndSortedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <FileTextIcon size={24} className="text-white/20 mb-2" />
                <p className="text-sm text-white/50">
                  {searchQuery ? 'No notes found' : showArchived ? 'No archived notes' : 'No notes yet'}
                </p>
                {!searchQuery && !showArchived && (
                  <button onClick={handleCreateNote} className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-medium">
                    Create your first note
                  </button>
                )}
              </div>
            ) : (
              filteredAndSortedNotes.map(note => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className={`block p-3 rounded-xl transition-all duration-200 ${
                    activeNoteId === note.id 
                      ? 'bg-violet-500/20 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]' 
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <h3 className={`text-sm font-medium truncate mb-1 ${activeNoteId === note.id ? 'text-violet-200' : 'text-white/90'}`}>
                    {note.title || 'Untitled Note'}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span className="truncate pr-2">
                      {note.content ? note.content.replace(/#/g, '').substring(0, 30) + '...' : 'Empty note'}
                    </span>
                    <span className="shrink-0 flex items-center gap-1">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        
        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col bg-black/20 relative z-0">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
