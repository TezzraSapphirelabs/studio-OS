'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Note } from '@/types';
import { updateNote } from '@/services/notes';
import { Markdown } from './markdown';
import { ArchiveIcon, ArchiveRestoreIcon, ClockIcon } from './icons';
import { useToast } from '@/contexts/toast-context';

interface NoteEditorProps {
  note: Note;
  userId: string;
}

export function NoteEditor({ note, userId }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Debounce saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus title if new note is "Untitled Note" and content is empty
  useEffect(() => {
    if (note.title === 'Untitled Note' && !note.content) {
      setTimeout(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveChanges = useCallback(async (newTitle: string, newContent: string) => {
    if (!userId || !note.id) return;
    
    // Don't save if nothing changed
    if (newTitle === note.title && newContent === note.content) return;
    
    setIsSaving(true);
    const { error } = await updateNote(userId, note.id, {
      title: newTitle,
      content: newContent
    });
    
    if (error) {
      toast(error || 'Failed to save', 'error');
    }
    setIsSaving(false);
  }, [userId, note.id, note.title, note.content, toast]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges(newTitle, content);
    }, 1000);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges(title, newContent);
    }, 1000);
  };
  
  // Handle shortcuts (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveChanges(title, content);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, saveChanges]);

  const toggleArchive = async () => {
    const newArchivedState = !note.archived;
    const { error } = await updateNote(userId, note.id, { archived: newArchivedState });
    if (error) {
      toast(error || 'Error', 'error');
    } else {
      toast(newArchivedState ? 'Note archived' : 'Note restored', 'success');
    }
  };

  // Stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTime = Math.ceil(wordCount / 200) || 1;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title"
          className="bg-transparent text-xl font-bold text-white placeholder-white/20 focus:outline-none w-full max-w-lg transition-colors focus:bg-white/[0.02] rounded px-2 py-1 -ml-2"
        />
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-white/[0.04] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'edit' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'preview' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-white/40 hover:text-white/80'}`}
            >
              Preview
            </button>
          </div>
          
          <button
            onClick={toggleArchive}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
            title={note.archived ? "Restore Note" : "Archive Note"}
          >
            {note.archived ? <ArchiveRestoreIcon size={16} /> : <ArchiveIcon size={16} />}
          </button>
        </div>
      </div>
      
      {/* Editor/Preview Area */}
      <div className="flex-1 overflow-y-auto relative">
        {activeTab === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            className="absolute inset-0 w-full h-full p-6 bg-transparent text-white/80 resize-none focus:outline-none leading-relaxed"
            spellCheck="false"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full p-6 overflow-y-auto">
            {content ? (
              <Markdown content={content} />
            ) : (
              <div className="text-white/20 italic text-sm">Nothing to preview.</div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="flex justify-between items-center px-4 py-2 bg-black/40 border-t border-white/[0.04] text-[10px] text-white/40">
        <div className="flex gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          <span>{readingTime} min read</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-violet-400">Saving...</span>
          ) : (
            <span className="flex items-center gap-1">
              <ClockIcon size={10} />
              Last edited {formatDate(note.updatedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
