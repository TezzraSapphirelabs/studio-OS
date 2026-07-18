'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Suspense } from 'react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  
  const { user, loading: authLoading, register, googleLogin, githubLogin, linkingData, resolveLinking, cancelLinking, forgotPassword } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(returnTo);
    }
  }, [authLoading, user, router, returnTo]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const err = await register(email, password, name);
    
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      setSuccess('Account created successfully! Verification email sent. Redirecting...');
      setTimeout(() => {
        router.push(returnTo);
      }, 1500);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    const err = await googleLogin();
    if (err === 'ACCOUNT_EXISTS_DIFFERENT_CREDENTIAL') {
      setLoading(false);
    } else if (err) {
      setError(err);
      setLoading(false);
    } else {
      router.push(returnTo);
    }
  }

  async function handleGithubSignIn() {
    setError(null);
    setLoading(true);
    const err = await githubLogin();
    if (err === 'ACCOUNT_EXISTS_DIFFERENT_CREDENTIAL') {
      setLoading(false);
    } else if (err) {
      setError(err);
      setLoading(false);
    } else {
      router.push(returnTo);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] py-12">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/[0.12] blur-[100px]" />
        <div className="absolute -bottom-32 right-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.08] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-cyan-500/[0.05] blur-[80px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Register Card or Link Account Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        {linkingData ? (
          <div className="animate-fade-in-up rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl sm:p-10 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Link Accounts</h1>
            <p className="mb-6 text-sm text-white/50">
              An account already exists for <strong className="text-white">{linkingData.email}</strong>. 
              Please verify your existing account to link them.
            </p>
            
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {linkingData.providerIds.includes('google.com') ? (
              <button
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  const err = await resolveLinking();
                  if (err) {
                    setError(err);
                    setLoading(false);
                  } else {
                    setSuccess('Your accounts have been linked successfully. Redirecting...');
                    setTimeout(() => router.push(returnTo), 1500);
                  }
                }}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#0a0a0f] shadow-lg transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Continue with Google
                  </>
                )}
              </button>
            ) : linkingData.providerIds.includes('github.com') ? (
              <button
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  const err = await resolveLinking();
                  if (err) {
                    setError(err);
                    setLoading(false);
                  } else {
                    setSuccess('Your accounts have been linked successfully. Redirecting...');
                    setTimeout(() => router.push(returnTo), 1500);
                  }
                }}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#24292F] text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#24292F]/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    Continue with GitHub
                  </>
                )}
              </button>
            ) : linkingData.providerIds.includes('password') ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                const err = await resolveLinking(password);
                if (err) {
                  setError(err);
                  setLoading(false);
                } else {
                  setSuccess('Your accounts have been linked successfully. Redirecting...');
                  setTimeout(() => router.push(returnTo), 1500);
                }
              }} className="space-y-4 text-left">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="link-password" className="block text-xs font-medium uppercase tracking-wider text-white/40">
                      Password for {linkingData.email}
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        setError(null);
                        const err = await forgotPassword(linkingData.email);
                        if (err) setError(err);
                        else setSuccess('Password reset email sent. Please reset your password and sign in again.');
                        setLoading(false);
                      }}
                      disabled={loading}
                      className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300 disabled:opacity-50"
                    >
                      Forgot your password?
                    </button>
                  </div>
                  <input
                    id="link-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
                >
                  {loading ? (
                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    'Verify and Link'
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-white/40 mb-4">Please select your original sign-in method:</p>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    const err = await resolveLinking(undefined, 'google.com');
                    if (err) {
                      setError(err);
                      setLoading(false);
                    } else {
                      setSuccess('Your accounts have been linked successfully. Redirecting...');
                      setTimeout(() => router.push(returnTo), 1500);
                    }
                  }}
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#0a0a0f] shadow-lg transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Sign in with Google
                </button>
                
                <div className="relative my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-xs text-white/25">or</span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError(null);
                  const err = await resolveLinking(password, 'password');
                  if (err) {
                    setError(err);
                    setLoading(false);
                  } else {
                    setSuccess('Your accounts have been linked successfully. Redirecting...');
                    setTimeout(() => router.push(returnTo), 1500);
                  }
                }} className="space-y-4 text-left">
                  <div>
                    <label htmlFor="link-password-fallback" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Password for {linkingData.email}
                    </label>
                    <input
                      id="link-password-fallback"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
                  >
                    {loading ? (
                      <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      'Verify and Link'
                    )}
                  </button>
                </form>
              </div>
            )}

            <button 
              onClick={() => { cancelLinking(); setError(null); setSuccess(null); }} 
              className="mt-6 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="animate-fade-in-up rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
          {/* Logo */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create an account
            </h1>
            <p className="mt-2 text-sm text-white/40">
              Join Studio OS today
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/[0.08] px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                disabled={loading}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.os"
                disabled={loading}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs text-white/25">or register with</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white/70 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Google
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-white/25">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-violet-400 cursor-pointer hover:text-violet-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#07070a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
