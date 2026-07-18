'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { acceptInvite, declineInvite } from '@/services/invites';
import { type ProjectInvite } from '@/types';
import { GlassCard } from '@/components';
import { useToast } from '@/contexts/toast-context';
import { CheckSquareIcon, XIcon, UsersIcon } from '@/components/icons';

export default function InvitesList() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'projectInvites'),
      where('inviteeEmail', '==', user.email),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ProjectInvite[];
      
      const unexpired = data.filter((invite) => {
        if (!invite.expiresAt) return true;
        return new Date(invite.expiresAt) > new Date();
      });
      
      setInvites(unexpired);
    });

    return () => unsubscribe();
  }, [user]);

  if (invites.length === 0) return null;

  async function handleAccept(invite: ProjectInvite) {
    if (!user) return;
    setLoadingId(invite.id);
    const { error } = await acceptInvite(invite.id, invite.projectId, user.uid, invite.role);
    setLoadingId(null);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Invitation accepted! You are now a member.', 'success');
    }
  }

  async function handleDecline(invite: ProjectInvite) {
    if (!user) return;
    setLoadingId(invite.id);
    const { error } = await declineInvite(invite.id);
    setLoadingId(null);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Invitation declined.', 'info');
    }
  }

  return (
    <div className="mb-8 space-y-4 animate-fade-in-up">
      <h2 className="text-lg font-semibold text-white">Pending Invitations</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {invites.map((invite) => (
          <GlassCard key={invite.id} padding="md" className="flex flex-col justify-between border-violet-500/30">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
                <UsersIcon size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">Project Invitation</h3>
                <p className="mt-1 text-sm text-white/50">
                  You've been invited as a <span className="text-white/80 font-medium capitalize">{invite.role}</span>.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => handleDecline(invite)}
                disabled={loadingId === invite.id}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
              >
                <XIcon size={14} /> Decline
              </button>
              <button
                onClick={() => handleAccept(invite)}
                disabled={loadingId === invite.id}
                className="flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                <CheckSquareIcon size={14} /> Accept
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
