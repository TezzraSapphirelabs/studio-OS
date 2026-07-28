'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/ui';
import { KeyIcon, Trash2Icon, RefreshCw, CopyIcon, CheckIcon, Loader2 } from 'lucide-react';
import { generatePlatformKey, getPlatformKeys, revokePlatformKey, type PlatformKeyData } from '@/app/actions/platform-keys';
import { useAuth } from '@/contexts/auth-context';

export default function PlatformAccessKeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<PlatformKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = async () => {
    if (!user) return;
    setLoading(true);
    const { keys, error } = await getPlatformKeys(user.uid);
    if (keys) setKeys(keys);
    if (error) setError(error);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKeys();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGenerateKey = async () => {
    if (!user) return;
    setGenerating(true);
    setError(null);
    setNewKey(null);
    
    // Default to maxUses = 1
    const { plaintextKey, error } = await generatePlatformKey(user.uid, 1);
    
    if (error) {
      setError(error);
    } else if (plaintextKey) {
      setNewKey(plaintextKey);
      await fetchKeys();
    }
    
    setGenerating(false);
  };

  const handleRevokeKey = async (keyHash: string) => {
    if (!user) return;
    setRevokingId(keyHash);
    const { error } = await revokePlatformKey(keyHash, user.uid);
    if (error) {
      setError(error);
    } else {
      await fetchKeys();
    }
    setRevokingId(null);
  };

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Platform Access Keys</h1>
        <p className="text-white/50 mt-1">Generate and manage keys that grant Platform Owner access.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">Generate New Key</h2>
            <p className="text-sm text-white/50">Create a new single-use key to onboard another Platform Owner.</p>
          </div>
          <Button 
            onClick={handleGenerateKey} 
            disabled={generating}
            className="bg-indigo-500 hover:bg-indigo-600 text-white min-w-[120px]"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Key'}
          </Button>
        </div>

        {newKey && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <p className="text-sm text-emerald-400 font-medium">
              Key generated successfully! Copy it now, it will not be shown again.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-emerald-300 break-all flex items-center">
                {newKey}
              </div>
              <Button 
                onClick={copyToClipboard}
                variant="ghost" 
                className="h-auto px-4 bg-black/40 border-white/10 hover:bg-white/5"
              >
                {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4 text-white/70" />}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-white">Active Keys</h2>
          <Button variant="ghost" size="sm" onClick={fetchKeys} disabled={loading} className="text-white/50 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-3">
          {keys.length === 0 && !loading && (
            <div className="text-center py-8 text-white/30 text-sm">
              No keys generated yet.
            </div>
          )}
          
          {keys.map((keyData) => (
            <div key={keyData.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  keyData.isActive ? 'bg-indigo-500/10' : 'bg-red-500/10'
                }`}>
                  <KeyIcon className={`w-5 h-5 ${keyData.isActive ? 'text-indigo-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white/80">{keyData.id.substring(0, 12)}...</span>
                    {!keyData.isActive && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                        Revoked / Used
                      </span>
                    )}
                    {keyData.isActive && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    Created {new Date(keyData.createdAt).toLocaleDateString()}
                    {keyData.maxUses && ` • Uses: ${keyData.uses}/${keyData.maxUses}`}
                  </div>
                </div>
              </div>
              
              {keyData.isActive && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRevokeKey(keyData.id)}
                  disabled={revokingId === keyData.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  {revokingId === keyData.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2Icon className="w-4 h-4" />}
                </Button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
