'use client';
import React, { useState } from 'react';
import { XIcon } from '@/components/icons';
import { inviteUser } from '@/services/invites';
import { type ProjectRole } from '@/types';
import { useToast } from '@/contexts/toast-context';

interface InviteModalProps {
  projectId: string;
  inviterUid: string;
  onClose: () => void;
}

export default function InviteModal({ projectId, inviterUid, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await inviteUser(projectId, inviterUid, email, role);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      toast(`Invitation sent to ${email}`, 'success');
      setLoading(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-white/[0.04] p-6">
          <h3 className="text-lg font-semibold text-white">Invite to Project</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white">Invitation Sent!</h4>
              <p className="mt-2 text-sm text-white/60">An invitation has been sent to {email}.</p>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors hover:bg-white/[0.04] focus:border-violet-500/50 focus:bg-white/[0.04]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectRole)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#09090b] px-4 py-3 text-sm text-white outline-none transition-colors hover:bg-white/[0.04] focus:border-violet-500/50"
                >
                  <option value="admin" className="bg-[#0a0a0f] text-white">Admin (Can manage tasks & members)</option>
                  <option value="member" className="bg-[#0a0a0f] text-white">Member (Can manage tasks)</option>
                  <option value="viewer" className="bg-[#0a0a0f] text-white">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white shadow hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#09090b] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
