'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/auth-context';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';

// Motion variants
const FADE_UP = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2 } }
};

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, googleLogin, githubLogin, resolveLinking } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Link Account Flow
  const linkToken = searchParams.get('link_token');
  const linkEmail = searchParams.get('email');
  const linkProvider = searchParams.get('provider');
  const isLinking = !!(linkToken && linkEmail && linkProvider);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLinking) {
        await resolveLinking(password, linkProvider || undefined);
        router.push('/dashboard?linked=true');
      } else {
        await login(email, password);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await googleLogin();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await githubLogin();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'GitHub sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground className="text-white font-sans selection:bg-white selection:text-black">
      
      {/* Top Left Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="absolute top-8 left-8 lg:top-12 lg:left-12 z-50 flex items-center gap-3"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        <span className="text-[12px] font-semibold tracking-widest uppercase text-white/80">Studio OS</span>
      </motion.div>

      {/* Main Container */}
      <div className="flex min-h-screen w-full items-center justify-center p-4 relative z-10">
        
        {/* The Glass Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] rounded-[24px] bg-black/20 backdrop-blur-[40px] border border-white/[0.08] p-8 lg:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden"
        >
          {/* Subtle subtle top highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Header */}
          <motion.div variants={STAGGER} initial="hidden" animate="show" className="mb-10 text-center">
            <motion.h1 variants={FADE_UP} className="text-[28px] font-semibold tracking-tight text-white mb-2">
              {isLinking ? 'Link Account' : 'Welcome back'}
            </motion.h1>
            <motion.p variants={FADE_UP} className="text-[14px] text-white/60 font-medium">
              {isLinking 
                ? `Please authenticate to link your ${linkProvider} account.`
                : 'Enter your details to sign in to your workspace.'}
            </motion.p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLinking ? "linking" : "login"}
              variants={STAGGER}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="w-full"
            >
              {error && (
                <motion.div variants={FADE_UP} className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-[13px] text-red-200 leading-tight">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                
                <motion.div variants={FADE_UP} className="space-y-1.5">
                  <label htmlFor="email" className="text-[12px] font-medium text-white/70 ml-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 text-white text-[14px] placeholder:text-white/20 transition-all duration-300 outline-none focus:border-white/20 focus:bg-white/[0.05] hover:bg-white/[0.04]"
                    placeholder="name@example.com"
                    required
                  />
                </motion.div>
                
                <motion.div variants={FADE_UP} className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1 mr-1">
                    <label htmlFor="password" className="text-[12px] font-medium text-white/70">Password</label>
                    {!isLinking && (
                      <Link href="/forgot-password" className="text-[11px] text-white/40 hover:text-white/80 transition-colors font-medium">
                        Forgot?
                      </Link>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 text-white text-[14px] placeholder:text-white/20 transition-all duration-300 outline-none focus:border-white/20 focus:bg-white/[0.05] hover:bg-white/[0.04] font-mono tracking-widest"
                    placeholder="••••••••"
                    required
                  />
                </motion.div>

                <motion.div variants={FADE_UP} className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-white text-black rounded-xl font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:hover:bg-white disabled:active:scale-100"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                    ) : (
                      <span>Continue</span>
                    )}
                  </button>
                </motion.div>
              </form>

              {!isLinking && (
                <motion.div variants={STAGGER} initial="hidden" animate="show" className="mt-8">
                  <motion.div variants={FADE_UP} className="flex items-center gap-4 mb-6">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Or</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </motion.div>

                  <motion.div variants={FADE_UP} className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleGithubSignIn}
                      disabled={loading}
                      className="h-11 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[13px] text-white/80 font-medium hover:text-white hover:bg-white/[0.06] transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                    >
                      GitHub
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="h-11 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[13px] text-white/80 font-medium hover:text-white hover:bg-white/[0.06] transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                    >
                      Google
                    </button>
                  </motion.div>
                </motion.div>
              )}
              
            </motion.div>
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-[12px] text-white/50">
              Don't have an account?{' '}
              <Link href="/register" className="text-white hover:text-white/80 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>

        </motion.div>
      </div>
    </AuroraBackground>
  );
}

const DynamicLoginContent = dynamic(() => Promise.resolve(LoginContent), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#020202]">
      <Loader2 className="h-6 w-6 animate-spin text-white/20" />
    </div>
  )
});

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#020202]">
        <Loader2 className="h-6 w-6 animate-spin text-white/20" />
      </div>
    }>
      <DynamicLoginContent />
    </Suspense>
  );
}
