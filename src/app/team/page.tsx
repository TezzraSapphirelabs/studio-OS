'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard } from '@/components';
import { SearchIcon } from '@/components/icons';
import { useAuth } from '@/contexts/auth-context';
import { fetchWorkspaceMembers, updateWorkspaceMemberRole, removeWorkspaceMember, fetchWorkspaceInvites, cancelWorkspaceInvite } from '@/services/workspace';
import type { WorkspaceMember, WorkspaceRole, WorkspaceInvite } from '@/types';
import WorkspaceInviteModal from '@/components/modals/WorkspaceInviteModal';
import { getInitials, formatRelativeDate } from '@/utils';
import Image from 'next/image';
import { isUserOnline } from '@/services/presence';
import { ClockIcon } from '@/components/icons';
import MemberDrawer from './member-drawer';

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<WorkspaceInvite | null>(null);

  const workspaceId = user?.uid; // User is the workspace owner by default
  const currentUserRole = members.find(m => m.userId === user?.uid)?.role || 'member';

  useEffect(() => {
    if (!workspaceId) return;
    loadMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function loadMembers() {
    if (!workspaceId) return;
    setLoading(true);
    const [{ members: fetchedMembers, error: membersErr }, { invites: fetchedInvites, error: invitesErr }] = await Promise.all([
      fetchWorkspaceMembers(workspaceId),
      fetchWorkspaceInvites(workspaceId)
    ]);
    
    if (membersErr) setError(membersErr);
    else if (fetchedMembers) setMembers(fetchedMembers);

    if (invitesErr) console.error(invitesErr); // don't break page if invites fail
    else if (fetchedInvites) setInvites(fetchedInvites);

    setLoading(false);
  }

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchQuery.toLowerCase();
      return (
        m.displayName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [members, searchQuery]);

  const handleRoleChange = async (memberId: string, userId: string, newRole: WorkspaceRole) => {
    if (!workspaceId || !user) return;
    // Optimistic update
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember(prev => prev ? { ...prev, role: newRole } : prev);
    }
    const { error: updateErr } = await updateWorkspaceMemberRole(workspaceId, userId, newRole, user.uid);
    if (updateErr) {
      alert(updateErr);
      loadMembers(); // Revert
    }
  };

  const handleRemove = async (memberId: string, userId: string) => {
    if (!workspaceId || !user) return;
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    
    // Optimistic update
    setMembers(prev => prev.filter(m => m.id !== memberId));
    const { error: removeErr } = await removeWorkspaceMember(workspaceId, userId, user.uid);
    if (removeErr) {
      alert(removeErr);
      loadMembers(); // Revert
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!workspaceId || !user) return;
    if (!confirm('Cancel this invitation?')) return;
    
    setInvites(prev => prev.filter(i => i.id !== inviteId));
    const { error: cancelErr } = await cancelWorkspaceInvite(inviteId, workspaceId, user.uid);
    if (cancelErr) {
      alert(cancelErr);
      loadMembers(); // Revert
    }
  };

  const getRoleBadgeColor = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner': return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/20';
      case 'admin': return 'bg-violet-500/20 text-violet-400 border-violet-500/20';
      case 'member': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'viewer': return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Team Management</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage your workspace members and their roles.
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-95"
        >
          Invite Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search members by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none transition-colors hover:bg-white/[0.04] focus:border-violet-500/50 focus:bg-white/[0.04]"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Members List */}
      <GlassCard padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
            <p className="mt-4 text-sm text-white/40">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] text-white/40">
              <SearchIcon size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">No members found</h3>
            <p className="mt-1 text-sm text-white/40">
              {searchQuery ? 'Try adjusting your search query.' : 'Invite your first team member.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredMembers.map(member => {
              // In reality, this requires lastActive on the user profile which we update via presence service
              const isOnline = isUserOnline(member.joinedAt); // Mock for now, requires fetching profiles

              return (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-4 sm:p-5 transition-colors hover:bg-white/[0.04] cursor-pointer"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      {member.photoURL ? (
                        <Image src={member.photoURL} alt={member.displayName} width={40} height={40} className="h-10 w-10 rounded-full object-cover border border-white/[0.08]" unoptimized />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white shadow-inner">
                          {getInitials(member.displayName, member.email)}
                        </div>
                      )}
                      {/* Presence Dot */}
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#09090b] ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {member.displayName}
                        </p>
                        {user?.uid === member.userId && (
                          <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-white/60">You</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-white/40">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold text-white">Pending Invitations</h2>
          <GlassCard padding="none" className="overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {invites.map(invite => (
                <div 
                  key={invite.id} 
                  className="flex items-center justify-between p-4 sm:p-5 transition-colors hover:bg-white/[0.04] cursor-pointer"
                  onClick={() => setSelectedInvite(invite)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-sm font-bold text-white shadow-inner">
                        {getInitials('', invite.inviteeEmail)}
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#09090b] bg-yellow-500" title="Pending" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {invite.inviteeEmail}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <ClockIcon size={12} className="text-white/40" />
                        <p className="truncate text-xs text-white/40">Invited {formatRelativeDate(invite.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getRoleBadgeColor(invite.role)}`}>
                      {invite.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Modals */}
      {isInviteOpen && workspaceId && (
        <WorkspaceInviteModal
          workspaceId={workspaceId}
          inviterUid={user?.uid || ''}
          onClose={() => {
            setIsInviteOpen(false);
            loadMembers();
          }}
        />
      )}

      <MemberDrawer
        isOpen={!!selectedMember || !!selectedInvite}
        onClose={() => {
          setSelectedMember(null);
          setSelectedInvite(null);
        }}
        member={selectedMember}
        invite={selectedInvite}
        currentUserRole={currentUserRole}
        onRoleChange={(newRole) => {
          if (selectedMember) handleRoleChange(selectedMember.id, selectedMember.userId, newRole);
        }}
        onRemove={() => {
          if (selectedMember) {
            handleRemove(selectedMember.id, selectedMember.userId);
            setSelectedMember(null);
          }
        }}
        onCancelInvite={() => {
          if (selectedInvite) {
            handleCancelInvite(selectedInvite.id);
            setSelectedInvite(null);
          }
        }}
        onResendInvite={() => {
          alert('Invitation link copied to clipboard!');
        }}
      />
    </div>
  );
}
