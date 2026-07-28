'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { Button, Input } from '@/components/ui';
import { validatePlatformKey } from '@/app/actions/platform-keys';
import { useAuth } from '@/contexts/auth-context';
import { LockIcon } from 'lucide-react';

export function PlatformAccessGate({ children }: { children: React.ReactNode }) {
  const { user, isPlatformOwner } = useAuth();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPlatformOwner) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    const { success, error: valError } = await validatePlatformKey(key, user.uid);
    if (valError) {
      setError(valError);
    } else if (success) {
      // Refresh the page so context picks up the new role
      window.location.reload();
    }
    
    setLoading(false);
  };

  return (
    <div className="flex h-[80vh] items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 space-y-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <LockIcon className="text-indigo-400 w-8 h-8" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-light text-white tracking-tight">Platform Access Required</h2>
          <p className="text-white/50 text-sm">
            Enter a Platform Access Key to gain global administration privileges.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <Input
              type="text"
              placeholder="Enter your key..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={loading}
              className="text-center font-mono"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
            disabled={!key.trim() || loading || !user}
          >
            {loading ? 'Validating...' : 'Unlock Platform'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
