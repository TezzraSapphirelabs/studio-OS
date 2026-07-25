'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard, EmptyState } from '@/components';
import { Button, Input } from '@/components/ui';
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

export default function MembersPage() {
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
      case 'owner': return 'bg-white/[0.08] text-white/70 border-white/10';
      case 'admin': return 'bg-white/[0.08] text-white/70 border-white/10';
      case 'member': return 'bg-white/[0.08] text-white/70 border-white/10';
      case 'viewer': return 'bg-white/10 text-white/60 border-white/10';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const isInviteExpired = (invite: WorkspaceInvite) => {
    if (!invite.expiresAt) return false;
    return new Date(invite.expiresAt) < new Date();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Members Workspace</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage your workspace members and their roles.
          </p>
        </div>
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <Button
            variant="primary"
            onClick={() => setIsInviteOpen(true)}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div>
        <Input
          icon={<SearchIcon size={18} />}
          placeholder="Search members by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
          {error}
        </div>
      )}

      {/* Members Grid */}
      <div className="">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/80" />
            <p className="mt-4 text-sm text-white/40">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={36} />}
            title="No members found"
            description={searchQuery ? 'Try adjusting your search query.' : 'Invite your first team member.'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers.map(member => {
              const isOnline = isUserOnline(member.joinedAt);

              return (
                <GlassCard 
                  key={member.id} 
                  padding="lg"
                  className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        {member.photoURL ? (
                          <Image src={member.photoURL} alt={member.displayName} width={80} height={80} className="h-20 w-20 rounded-full object-cover border border-white/[0.08]" unoptimized />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-black shadow-inner">
                            {getInitials(member.displayName, member.email)}
                          </div>
                        )}
                        {/* Presence Dot */}
                        <span className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-[4px] border-[#0a0a0f] ${isOnline ? 'bg-white text-black' : 'bg-gray-500'}`} />
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-bold tracking-tight text-white">{member.displayName}</h3>
                        {user?.uid === member.userId && (
                          <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-white/60">You</span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-white/40">{member.email}</p>
                    </div>

                    <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Joined</span>
                        <span className="font-medium text-white/70">{formatRelativeDate(member.joinedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Last Active</span>
                        <span className="font-medium text-white/70">{isOnline ? 'Online now' : 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invites Section */}
      {(currentUserRole === 'owner' || currentUserRole === 'admin') && invites.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold text-white">Pending Invitations</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {invites.map(invite => {
              const expired = isInviteExpired(invite);
              return (
                <GlassCard 
                  key={invite.id} 
                  padding="lg"
                  className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                  onClick={() => setSelectedInvite(invite)}
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold shadow-inner ${expired ? 'bg-red-500/20 text-red-300' : 'bg-white/[0.04] text-white'}`}>
                          {getInitials('', invite.inviteeEmail)}
                        </div>
                        {!expired && <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-[4px] border-[#0a0a0f] bg-white/50" title="Pending"><ClockIcon size={12} className="text-[#0a0a0f]" /></span>}
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(invite.role)}`}>
                        {invite.role}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className={`truncate text-lg font-bold tracking-tight ${expired ? 'text-red-300/80' : 'text-white'}`}>
                        {invite.inviteeEmail}
                      </h3>
                      <p className={`mt-1 truncate text-sm ${expired ? 'text-red-400/60' : 'text-white/40'}`}>
                        {expired ? 'Expired' : 'Pending Verification'}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Sent Date</span>
                        <span className="font-medium text-white/70">{formatRelativeDate(invite.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
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
        currentUserId={user?.uid || ''}
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
