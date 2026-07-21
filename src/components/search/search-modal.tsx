'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToProjects } from '@/services/projects';
import { useAllProjectsTasks } from '@/hooks/use-tasks';
import { subscribeToUserNotes } from '@/services/notes';
import { fetchWorkspaceMembers } from '@/services/workspace';
import { subscribeToTags } from '@/services/tags';
import { SearchIcon, FolderIcon, CheckSquareIcon, FileTextIcon, UserIcon, TagIcon } from '@/components/icons';
import { type Project, type Note, type WorkspaceMember, type Tag } from '@/types';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  
  // Data subscriptions
  const [projects, setProjects] = useState<Project[]>([]);
  const { tasks } = useAllProjectsTasks(user?.uid, projects);
  const [notes, setNotes] = useState<Note[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubP = subscribeToProjects(user.uid, setProjects, () => {});
    const unsubN = subscribeToUserNotes(user.uid, setNotes);
    const unsubT = subscribeToTags(user.uid, setTags);
    
    let isMounted = true;
    fetchWorkspaceMembers(user.uid).then(({ members }) => {
      if (isMounted && members) setMembers(members);
    });
    
    return () => { isMounted = false; unsubP(); unsubN(); unsubT(); };
  }, [user]);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQ = query.toLowerCase();
    const res = [];

    // Search Projects
    for (const p of projects) {
      if (p.name.toLowerCase().includes(lowerQ) || p.description.toLowerCase().includes(lowerQ)) {
        res.push({ type: 'Project', title: p.name, subtitle: 'Project', icon: <FolderIcon size={16} />, href: `/projects/${p.id}` });
      }
    }

    // Search Tasks
    for (const t of tasks) {
      if (t.title.toLowerCase().includes(lowerQ)) {
        res.push({ type: 'Task', title: t.title, subtitle: 'Task', icon: <CheckSquareIcon size={16} />, href: `/tasks` }); // Wait, tasks modal needs ID. Let's redirect to projects/[projectId]/tasks or just /tasks.
      }
    }

    // Search Notes
    for (const n of notes) {
      if (n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ)) {
        res.push({ type: 'Note', title: n.title, subtitle: 'Note', icon: <FileTextIcon size={16} />, href: `/notes/${n.id}` });
      }
    }

    // Search Members
    for (const m of members) {
      if (m.displayName.toLowerCase().includes(lowerQ) || m.email.toLowerCase().includes(lowerQ)) {
        res.push({ type: 'Member', title: m.displayName, subtitle: m.email, icon: <UserIcon size={16} />, href: `/team` });
      }
    }

    // Search Tags
    for (const tag of tags) {
      if (tag.name.toLowerCase().includes(lowerQ)) {
        res.push({ type: 'Tag', title: tag.name, subtitle: 'Tag', icon: <TagIcon size={16} />, href: `/tags` });
      }
    }

    return res.slice(0, 15); // limit to 15 results
  }, [query, projects, tasks, notes, members, tags]);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <SearchIcon size={20} className="text-white/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, notes, or members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
          />
          <div className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/40">
            ESC to close
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-12 text-center text-sm text-white/40">
              Type to start searching your workspace...
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-sm text-white/40">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-2">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(r.href)}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/70">
                    {r.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{r.title}</h4>
                    <p className="text-xs text-white/40">{r.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
