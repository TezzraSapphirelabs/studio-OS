'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard, EmptyState } from '@/components';
import { Input } from '@/components/ui';
import { SearchIcon } from '@/components/icons';
import { useAuth } from '@/contexts/auth-context';
import { fetchWorkspaceMembers } from '@/services/workspace';
import { updateMemberRole, removeMember, getPublicPlatformOwners } from '@/app/actions/members';
import type { WorkspaceMember, WorkspaceRole } from '@/types';
import { getInitials, formatRelativeDate } from '@/utils';
import Image from 'next/image';
import { isUserOnline } from '@/services/presence';

import MemberDrawer from './member-drawer';

const roleWeight: Record<string, number> = {
  'owner': 1,
  'admin': 2,
  'member': 3,
  'viewer': 4
};

type UIMember = WorkspaceMember & { isPlatformOwner?: boolean };

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<UIMember[]>([]);
  const [platformOwners, setPlatformOwners] = useState<UIMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedMember, setSelectedMember] = useState<UIMember | null>(null);

  const workspaceId = user?.uid; 
  const currentUserRole = members.find(m => m.userId === user?.uid)?.role || 'member';

  useEffect(() => {
    if (!workspaceId) return;
    loadMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function loadMembers() {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    
    try {
      // Execute concurrently but catch rejections from each to prevent Promise.all from failing entirely
      const wsPromise = fetchWorkspaceMembers(workspaceId).catch(
        (e): Awaited<ReturnType<typeof fetchWorkspaceMembers>> => ({ error: e.message || 'Failed to fetch members' })
      );
      const poPromise = getPublicPlatformOwners().catch(
        (e): Awaited<ReturnType<typeof getPublicPlatformOwners>> => ({ error: 'Failed to fetch platform owners' })
      );
      
      const [wsRes, poRes] = await Promise.all([wsPromise, poPromise]);
      
      if (wsRes.error) {
        setError(wsRes.error);
      } else if (wsRes.members) {
        setMembers(wsRes.members);
      }
      
      if (poRes && poRes.owners) {
        setPlatformOwners(poRes.owners as UIMember[]);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while loading members.');
    } finally {
      setLoading(false);
    }
  }



  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const sorted = [...members].sort((a, b) => (roleWeight[a.role] || 99) - (roleWeight[b.role] || 99));
    return sorted.filter(m => (
      m.displayName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    ));
  }, [members, searchQuery]);

  const filteredOwners = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return platformOwners.filter(m => (
      m.displayName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      'platform owner'.includes(q)
    ));
  }, [platformOwners, searchQuery]);

  const handleRoleChange = async (memberId: string, userId: string, newRole: WorkspaceRole) => {
    if (!workspaceId || !user) return;
    // Optimistic update
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember(prev => prev ? { ...prev, role: newRole } : prev);
    }
    try {
      const { error: updateErr } = await updateMemberRole(workspaceId, userId, newRole, user.uid);
      if (updateErr) {
        alert(updateErr);
        loadMembers(); // Revert
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
      loadMembers(); // Revert
    }
  };

  const handleRemove = async (memberId: string, userId: string) => {
    if (!workspaceId || !user) return;
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    
    // Optimistic update
    setMembers(prev => prev.filter(m => m.id !== memberId));
    try {
      const { error: removeErr } = await removeMember(workspaceId, userId, user.uid);
      if (removeErr) {
        alert(removeErr);
        loadMembers(); // Revert
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
      loadMembers(); // Revert
    }
  };

  const getRoleBadgeColor = (role: WorkspaceRole | string) => {
    switch (role) {
      case 'owner': return 'bg-white/[0.08] text-white/70 border-white/10';
      case 'admin': return 'bg-white/[0.08] text-white/70 border-white/10';
      case 'member': return 'bg-white/[0.08] text-white/70 border-white/10';
      case 'viewer': return 'bg-white/10 text-white/60 border-white/10';
      case 'Platform Owner': return 'bg-white text-black font-bold border-white';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const renderMemberCard = (member: UIMember) => {
    const isOnline = isUserOnline(member.joinedAt);
    return (
      <GlassCard 
        key={member.id} 
        padding="lg"
        className={`group relative overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${!member.isPlatformOwner ? 'cursor-pointer' : ''}`}
        onClick={() => !member.isPlatformOwner && setSelectedMember(member)}
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
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${getRoleBadgeColor(member.role)}`}>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/80" />
          <p className="mt-4 text-sm text-white/40">Loading members...</p>
        </div>
      ) : (filteredMembers.length === 0 && filteredOwners.length === 0) ? (
        <EmptyState
          icon={<SearchIcon size={36} />}
          title="No members found"
          description={searchQuery ? 'Try adjusting your search query.' : 'Invite your first team member.'}
        />
      ) : (
        <div className="space-y-12">
          {/* Platform Owners Section */}
          {filteredOwners.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white/90">Platform Owners</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredOwners.map(renderMemberCard)}
              </div>
            </div>
          )}

          {/* Workspace Members Section */}
          {filteredMembers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white/90">Workspace Members</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMembers.map(renderMemberCard)}
              </div>
            </div>
          )}
        </div>
      )}

      <MemberDrawer
        isOpen={!!selectedMember}
        onClose={() => {
          setSelectedMember(null);
        }}
        member={selectedMember}
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
      />
    </div>
  );
}
