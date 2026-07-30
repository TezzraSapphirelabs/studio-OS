'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/ui/aurora-background';

export default function PendingPage() {
  const { user, isPending, logout, loading, roleLoading, isPlatformOwner } = useAuth();
  const router = useRouter();

  console.log('[PendingPage Render]', {
    uid: user?.uid,
    loading,
    roleLoading,
    isPending,
    isPlatformOwner
  });

  React.useEffect(() => {
    if (!loading && !roleLoading && !user) {
      router.replace('/login');
    } else if (!loading && !roleLoading && !isPending && !isPlatformOwner && user) {
      // If they somehow got approved, redirect to dashboard
      router.replace('/dashboard');
    } else if (!loading && !roleLoading && isPlatformOwner && user) {
      router.replace('/platform/dashboard');
    }
  }, [loading, roleLoading, user, isPending, isPlatformOwner, router]);

  if (loading || roleLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuroraBackground intensity="low" className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          
          <h1 className="text-2xl font-light text-white tracking-tight">Access Pending</h1>
          
          <div className="space-y-4 text-sm text-white/60">
            <p>
              Velonos is a private internal platform. Your account has been created successfully, but requires approval from a Platform Owner before you can access the system.
            </p>
            <p className="bg-amber-500/10 text-amber-400/90 py-2 px-4 rounded-lg inline-block border border-amber-500/20">
              Waiting for Platform Owner approval
            </p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <Button
              onClick={() => logout()}
              variant="ghost"
              className="w-full gap-2 border-white/10 hover:bg-white/5 text-white/70"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </AuroraBackground>
  );
}
