'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isPending, loading, roleLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !roleLoading && isPending) {
      router.replace('/pending');
    }
  }, [isPending, loading, roleLoading, router]);

  if (loading || roleLoading || isPending) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
