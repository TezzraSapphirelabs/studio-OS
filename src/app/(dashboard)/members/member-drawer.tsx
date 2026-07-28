'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { XIcon, FolderIcon, CheckSquareIcon, ActivityIcon } from '@/components/icons';
import { type WorkspaceMember, type WorkspaceRole, type Project, type ProjectActivity } from '@/types';
import { getInitials, formatRelativeDate } from '@/utils';
import { subscribeToProjects } from '@/services/projects';
import { useAllProjectsTasks } from '@/hooks/use-tasks';
import { subscribeToWorkspaceActivity } from '@/services/activity';
import { subscribeToEvents } from '@/services/calendar';
import { subscribeToUserNotes } from '@/services/notes';
import { FileTextIcon, CalendarIcon } from '@/components/icons';
import type { CalendarEvent, Note } from '@/types';

interface MemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member?: WorkspaceMember | null;
  currentUserRole: WorkspaceRole;
  currentUserId: string;
  onRoleChange?: (newRole: WorkspaceRole) => void;
  onRemove?: () => void;
}

const ROLE_PERMISSIONS: Record<WorkspaceRole, string> = {
  owner: 'Full access to all settings, billing, projects, and members.',
  admin: 'Can manage projects, tasks, and members.',
  member: 'Can create and edit projects and tasks. Cannot manage members.',
  viewer: 'Read-only access to projects and tasks.'
};

export default function MemberDrawer({
  isOpen,
  onClose,
  member,
  currentUserRole,
  currentUserId,
  onRoleChange,
  onRemove
}: MemberDrawerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // We need the workspaceId. For now, assuming the member/invite has it.
  const workspaceId = member?.workspaceId || '';
  const targetUserId = member?.userId || '';

  const { tasks } = useAllProjectsTasks(workspaceId || 'mock', projects);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    const unsubProjects = subscribeToProjects(
      workspaceId,
      (data) => setProjects(data),
      (err) => console.error(err)
    );

    const unsubActivity = subscribeToWorkspaceActivity(
      workspaceId,
      (data) => {
        // Filter activity for this specific user
        if (targetUserId) {
          setActivities(data.filter(a => a.ownerUid === targetUserId).slice(0, 10));
        }
      }
    );

    let unsubNotes: () => void;
    let unsubEvents: () => void;
    
    if (targetUserId) {
      unsubNotes = subscribeToUserNotes(targetUserId, (data) => setNotes(data));
      unsubEvents = subscribeToEvents(targetUserId, (data) => setEvents(data));
    }

    return () => {
      unsubProjects();
      unsubActivity();
      if (unsubNotes) unsubNotes();
      if (unsubEvents) unsubEvents();
    };
  }, [isOpen, workspaceId, targetUserId]);

  const assignedProjects = useMemo(() => {
    if (!targetUserId) return [];
    return projects.filter(p => p.ownerUid === targetUserId || p.memberUids.includes(targetUserId));
  }, [projects, targetUserId]);

  const assignedTasks = useMemo(() => {
    if (!targetUserId) return [];
    return tasks.filter(t => t.assigneeId === targetUserId);
  }, [tasks, targetUserId]);

  if (!isOpen && !member) return null;

  const role = member?.role || 'member';
  const email = member?.email || '';
  const name = member?.displayName || email;
  const joinedAt = member?.joinedAt || new Date().toISOString();
  
  const canManage = currentUserRole === 'owner' || (currentUserRole === 'admin' && role !== 'owner');
  const canChangeRole = canManage && currentUserId !== targetUserId && role !== 'owner';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-white/[0.06] bg-[#0a0a0f] shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Member Details</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors">
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              {member?.photoURL ? (
                <Image src={member.photoURL} alt={name} width={80} height={80} className="h-20 w-20 rounded-full object-cover border border-white/[0.08]" unoptimized />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white  text-2xl font-bold  text-black shadow-inner">
                  {getInitials(name, email)}
                </div>
              )}

            </div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-sm text-white/40">{email}</p>
            
            <div className="mt-4 inline-flex items-center rounded-full bg-white/[0.04] px-3 py-1 border border-white/[0.08]">
              <span className="text-xs font-semibold capitalize text-white/80">{role}</span>
            </div>
          </div>

          <div className="space-y-8">
            {/* Permissions */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Permissions</h4>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/70">
                {ROLE_PERMISSIONS[role]}
              </div>
            </section>

            {/* Info */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Info</h4>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 text-sm">
                  <>
                    <div className="flex justify-between">
                      <span className="text-white/40">Joined Date</span>
                      <span className="text-white">{formatRelativeDate(joinedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Last Active</span>
                      <span className="text-white/70">Online now</span>
                    </div>
                  </>
              </div>
            </section>

            {/* Stats (only for active members) */}
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Workspace Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center transition-colors hover:bg-white/[0.04]">
                    <FolderIcon size={24} className="mb-2 text-white/70" />
                    <span className="text-2xl font-bold text-white">{assignedProjects.length}</span>
                    <span className="text-xs text-white/40">Projects</span>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center transition-colors hover:bg-white/[0.04]">
                    <CheckSquareIcon size={24} className="mb-2 text-white/70" />
                    <span className="text-2xl font-bold text-white">{assignedTasks.length}</span>
                    <span className="text-xs text-white/40">Tasks</span>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center transition-colors hover:bg-white/[0.04]">
                    <FileTextIcon size={24} className="mb-2 text-white/70" />
                    <span className="text-2xl font-bold text-white">{notes.length}</span>
                    <span className="text-xs text-white/40">Notes</span>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center transition-colors hover:bg-white/[0.04]">
                    <CalendarIcon size={24} className="mb-2 text-white/70" />
                    <span className="text-2xl font-bold text-white">{events.length}</span>
                    <span className="text-xs text-white/40">Events</span>
                  </div>
                </div>
              </section>

            {/* Recent Activity */}
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  {activities.length > 0 ? activities.map(act => (
                    <div key={act.id} className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                      <div className="mt-0.5 rounded-full bg-white/[0.04] p-1.5 text-white/40">
                        <ActivityIcon size={14} />
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          <span className="text-white/60 capitalize">{act.action}</span> <span className="font-medium text-white">{act.target}</span>
                        </p>
                        <p className="mt-1 text-xs text-white/40">{formatRelativeDate(act.createdAt)}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center text-sm text-white/40">
                      No recent activity
                    </div>
                  )}
                </div>
              </section>
          </div>
        </div>

        {/* Actions Footer */}
        {canManage && (
          <div className="border-t border-white/[0.06] p-6 bg-white/[0.01]">
              <div className="flex flex-col gap-3">
                {canChangeRole && (
                  <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <span className="text-xs font-semibold text-white/40">Change Role</span>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {(['admin', 'member', 'viewer'] as WorkspaceRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => onRoleChange?.(r)}
                          className={`rounded-lg py-2 text-xs font-semibold capitalize transition-all ${
                            role === r 
                              ? 'bg-white text-black' 
                              : 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {onRemove && (
                  <button 
                    onClick={onRemove}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
                  >
                    <XIcon size={16} />
                    {targetUserId === currentUserId ? 'Leave Workspace' : 'Remove from Workspace'}
                  </button>
                )}
              </div>
          </div>
        )}
      </div>
    </>
  );
}
