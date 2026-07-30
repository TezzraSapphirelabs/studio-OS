'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/ui';
import { Shield, Trash2Icon, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { getPlatformOwners, removePlatformOwner, type PlatformOwnerData } from '@/app/actions/platform-keys';
import { useAuth } from '@/contexts/auth-context';

export default function PlatformOwnersPage() {
  const { user } = useAuth();
  const [owners, setOwners] = useState<PlatformOwnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOwners = async () => {
    if (!user) return;
    setLoading(true);
    const { owners, error } = await getPlatformOwners(user.uid);
    if (owners) setOwners(owners);
    if (error) setError(error);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOwners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemoveOwner = async (targetUid: string) => {
    if (!user) return;
    if (targetUid === user.uid) return;
    
    if (!confirm('Are you sure you want to remove this user from Platform Owners? They will lose all global access.')) {
      return;
    }

    setRemovingId(targetUid);
    const { error } = await removePlatformOwner(user.uid, targetUid);
    if (error) {
      setError(error);
    } else {
      await fetchOwners();
    }
    setRemovingId(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Platform Owners</h1>
        <p className="text-white/50 mt-1">Manage global platform administrators (Maximum 2).</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Current Owners ({owners.length}/2)
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchOwners} disabled={loading} className="text-white/50 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-3">
          {owners.map((owner) => (
            <div key={owner.userId} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white/90">
                        {owner.displayName || 'Unknown User'}
                      </span>
                      {user?.uid === owner.userId && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                          You
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 ml-2">
                        {owner.status || 'Active'}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">
                      {owner.email || owner.userId}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      Added: {new Date(owner.addedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {user?.uid !== owner.userId && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveOwner(owner.userId)}
                  disabled={removingId === owner.userId}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  {removingId === owner.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2Icon className="w-4 h-4" />}
                </Button>
              )}
            </div>
          ))}

          {owners.length >= 2 && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-400">Maximum Owners Reached</h4>
                <p className="text-xs text-amber-400/70 mt-1">
                  Studio OS supports a maximum of 2 Platform Owners for security. To add someone else, you must remove a current owner first.
                </p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
