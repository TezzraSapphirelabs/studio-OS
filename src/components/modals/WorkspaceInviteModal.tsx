'use client';
import React, { useState } from 'react';
import { inviteWorkspaceMember } from '@/services/workspace';
import { type WorkspaceRole } from '@/types';
import { useToast } from '@/contexts/toast-context';
import { GlassModal } from '@/components/ui/glass-modal';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface WorkspaceInviteModalProps {
  workspaceId: string;
  inviterUid: string;
  onClose: () => void;
}

export default function WorkspaceInviteModal({ workspaceId, inviterUid, onClose }: WorkspaceInviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
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

    const result = await inviteWorkspaceMember(workspaceId, inviterUid, email, role);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      toast(`Workspace invitation sent to ${email}`, 'success');
      setLoading(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title="Invite to Workspace"
      className="max-w-md p-0 sm:p-0"
    >
      <div className="p-6">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
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
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Workspace Role</label>
              <Select value={role} onValueChange={(val) => setRole(val as WorkspaceRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Full Access to all projects)</SelectItem>
                  <SelectItem value="member">Member (Access assigned projects only)</SelectItem>
                  <SelectItem value="viewer">Viewer (Global read-only access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </GlassModal>
  );
}

