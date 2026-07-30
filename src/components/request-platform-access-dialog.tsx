'use client';

import React, { useState } from 'react';
import { GlassModal } from '@/components/ui/glass-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validatePlatformKey } from '@/app/actions/platform-keys';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2, Key } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestPlatformAccessDialog({ isOpen, onClose }: Props) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, retryRoleSync } = useAuth();
  const router = useRouter();

  const handleContinue = async () => {
    if (!key.trim()) {
      setError('Please enter a valid Platform Access Key.');
      return;
    }

    if (!user) {
      setError('You must be signed in to request access.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validatePlatformKey(key.trim(), user.uid);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Success! Promote user to Platform Owner.
      // Refresh permissions
      await retryRoleSync();
      
      onClose();
      // Redirect to Platform Dashboard
      router.push('/platform/dashboard');
    } catch (error) {
      console.error(error);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Platform Access"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-white/70 mb-4">
            Enter the Platform Access Key provided by a Platform Owner.
          </p>
          
          <div className="space-y-2">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                placeholder="Platform Access Key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-white/60 hover:text-white hover:bg-white/[0.08]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={loading || !key.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white min-w-[100px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
          </Button>
        </div>
      </div>
    </GlassModal>
  );
}
