'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '../layout';
import { useAuth } from '@/contexts/auth-context';
import { GlassCard } from '@/components';
import { subscribeToProjectMembers, removeMember, updateMemberRole } from '@/services/members';
import { type ProjectMember, type ProjectRole } from '@/types';
import { TrashIcon, UsersIcon } from '@/components/icons';

import { useToast } from '@/contexts/toast-context';
// We'll build the InviteModal next
import InviteModal from './invite-modal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cancelInvite } from '@/services/invites';
import { type ProjectInvite } from '@/types';
import { XIcon } from '@/components/icons';
import Image from 'next/image';

export default function ProjectMembersPage() {
  const { user } = useAuth();
  const { project, userRole, loading: projectLoading } = useProject();
  const { toast } = useToast();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  


  useEffect(() => {
    if (!project) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    
    // Subscribe to members
    const unsub = subscribeToProjectMembers(
      project.id,
      (data) => {
        setMembers(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // Subscribe to pending invites
    const q = query(
      collection(db, 'projectInvites'),
      where('projectId', '==', project.id),
      where('status', '==', 'pending')
    );
    const unsubInvites = onSnapshot(q, (snap) => {
      const docs: ProjectInvite[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        docs.push({ id: doc.id, ...data } as ProjectInvite);
      });
      setInvites(docs);
    });

    return () => { 
      unsub.then(u => u()); 
      unsubInvites();
    };
  }, [project]);

  if (projectLoading) return null;

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  async function handleRoleChange(member: ProjectMember, newRole: ProjectRole) {
    if (!user || !project) return;
    setActionLoading(member.id);
    const { error: err } = await updateMemberRole(project.id, member.userId, newRole, user.uid);
    if (err) {
      toast(err, 'error');
    } else {
      setMembers(members.map((m) => m.id === member.id ? { ...m, role: newRole } : m));
      toast(`Role updated to ${newRole}`, 'success');
    }
    setActionLoading(null);
  }

  async function handleRemoveMember(member: ProjectMember) {
    if (!user || !project) return;
    if (!confirm(`Are you sure you want to remove ${member.displayName} from the project?`)) return;
    setActionLoading(member.id);
    const { error: err } = await removeMember(project.id, member.userId, user.uid);
    if (err) {
      toast(err, 'error');
    } else {
      setMembers(members.filter((m) => m.id !== member.id));
      toast('Member removed', 'success');
    }
    setActionLoading(null);
  }

  async function handleCancelInvite(invite: ProjectInvite) {
    if (!user || !project) return;
    setActionLoading(invite.id);
    const { error: err } = await cancelInvite(invite.id, project.id, user.uid);
    if (err) {
      toast(err, 'error');
    } else {
      toast('Invitation cancelled', 'success');
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Team Members</h2>
          <p className="text-sm text-white/50 mt-1">Manage who has access to this project.</p>
        </div>
        {isOwnerOrAdmin && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-violet-500 focus:outline-none transition-colors"
          >
            <UsersIcon size={18} />
            Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-6 text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))
        ) : members.length === 0 ? (
           <div className="col-span-full py-10 text-center text-white/40">No members found.</div>
        ) : (
          members.map((member) => (
            <GlassCard key={member.id} padding="md" className="flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <Image
                  src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=3b82f6&color=fff`}
                  alt={member.displayName}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-white/10 object-cover"
                  unoptimized
                />
                <div className="flex-1 overflow-hidden">
                  <h3 className="truncate font-medium text-white">{member.displayName}</h3>
                  <p className="truncate text-xs text-white/40">{member.email}</p>
                  
                  <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-white/70 capitalize">
                    {member.role}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isOwnerOrAdmin && member.userId !== project?.ownerUid && member.userId !== user?.uid && (
                <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/[0.04] pt-4">
                  {true && (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value as ProjectRole)}
                      disabled={actionLoading === member.id}
                      className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs font-medium text-white outline-none transition-colors hover:bg-white/[0.08] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="admin" className="bg-[#0a0a0f] text-white">Admin</option>
                      <option value="member" className="bg-[#0a0a0f] text-white">Member</option>
                      <option value="viewer" className="bg-[#0a0a0f] text-white">Viewer</option>
                    </select>
                  )}
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={actionLoading === member.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    title="Remove member"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              )}
            </GlassCard>
          ))
        )}
      </div>

      {invites.length > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold text-white">Pending Invitations</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invites.map((invite) => {
              const isExpired = invite.expiresAt ? new Date(invite.expiresAt) < new Date() : false;
              
              return (
                <GlassCard key={invite.id} padding="md" className="flex flex-col justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50">
                      <UsersIcon size={24} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate font-medium text-white">{invite.inviteeEmail}</h3>
                      <p className="text-xs text-white/40">{isExpired ? 'Expired' : 'Pending'}</p>
                      
                      <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-white/70 capitalize">
                        {invite.role}
                      </div>
                    </div>
                  </div>

                  {isOwnerOrAdmin && (
                    <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/[0.04] pt-4">
                      <button
                        onClick={() => handleCancelInvite(invite)}
                        disabled={actionLoading === invite.id}
                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-medium text-white/70 hover:bg-white/[0.04] hover:text-white disabled:opacity-50 transition-colors"
                      >
                        <XIcon size={14} /> Cancel Invite
                      </button>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {isInviteModalOpen && project && user && (
        <InviteModal
          projectId={project.id}
          inviterUid={user.uid}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}
