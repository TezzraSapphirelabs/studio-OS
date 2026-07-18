'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { acceptInviteByToken } from '@/services/invites';
import { GlassCard } from '@/components';
import { useToast } from '@/contexts/toast-context';

export default function InviteLandingPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'verifying' | 'error' | 'success'>('verifying');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace(`/login?returnTo=/invite/${token}`);
      return;
    }

    async function processInvite() {
      setStatus('verifying');
      const { projectId, error } = await acceptInviteByToken(token, user!.uid, user!.email || '');
      
      if (error) {
        setStatus('error');
        setErrorMsg(error);
      } else {
        setStatus('success');
        toast('Successfully joined the project!', 'success');
        setTimeout(() => {
          router.push(`/projects/${projectId}`);
        }, 1500);
      }
    }

    processInvite();
  }, [user, authLoading, token, router, toast]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070a] p-4">
      <GlassCard padding="lg" className="w-full max-w-md text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <h2 className="text-xl font-bold text-white">Accepting Invitation...</h2>
            <p className="mt-2 text-white/50">Please wait while we add you to the project.</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Invalid Invitation</h2>
            <p className="mt-2 text-white/50">{errorMsg}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 rounded-xl bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Welcome to the Project!</h2>
            <p className="mt-2 text-white/50">Redirecting you to the workspace...</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
