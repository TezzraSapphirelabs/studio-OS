'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '../layout';
import { useAuth } from '@/contexts/auth-context';
import { GlassCard } from '@/components';
import { subscribeToProjectMembers, removeMember, updateMemberRole } from '@/services/members';
import { type ProjectMember, type ProjectRole } from '@/types';
import { TrashIcon } from '@/components/icons';

import { useToast } from '@/contexts/toast-context';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui';
import Image from 'next/image';

export default function ProjectMembersPage() {
  const { user } = useAuth();
  const { project, userRole, loading: projectLoading } = useProject();
  const { toast } = useToast();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    return () => { 
      unsub.then(u => u()); 
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


  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Team Members</h2>
          <p className="text-sm text-white/50 mt-1">Manage who has access to this project.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/70">
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
                    <Select
                      value={member.role}
                      onValueChange={(val) => handleRoleChange(member, val as ProjectRole)}
                      disabled={actionLoading === member.id}
                    >
                      <SelectTrigger size="sm" className="w-[110px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={actionLoading === member.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
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

    </div>
  );
}
