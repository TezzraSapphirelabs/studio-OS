'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, resendVerificationEmail, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  async function handleResend() {
    setResending(true);
    setMessage(null);
    const err = await resendVerificationEmail();
    setResending(false);
    if (err) {
      setMessage({ type: 'error', text: err });
    } else {
      setMessage({ type: 'success', text: 'Verification email resent! Check your inbox.' });
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }

  // Loading state — full-screen spinner matching the dark theme
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="text-sm text-white/30">Loading workspace…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show nothing while redirecting
  if (!user) {
    return null;
  }

  // Email not verified
  if (!user.emailVerified) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] py-12">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/[0.12] blur-[100px]" />
          <div className="absolute -bottom-32 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.05] blur-[80px]" />
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="animate-fade-in-up rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl sm:p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Verify your email</h1>
            <p className="mb-6 text-sm text-white/50">
              We&apos;ve sent a verification link to <strong className="text-white/80">{user.email}</strong>. 
              Please verify your email to access your workspace.
            </p>

            {message && (
              <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                message.type === 'error' 
                  ? 'border-red-500/20 bg-red-500/[0.08] text-red-300' 
                  : 'border-green-500/20 bg-green-500/[0.08] text-green-300'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {refreshing ? 'Checking...' : "I've verified my email"}
              </button>
              
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>

            <button
              onClick={logout}
              className="mt-6 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
