'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/ui';
import { UserPlus, Check, X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { getPendingUsers, approveUser, rejectUser } from '@/app/actions/platform-requests';
import { useAuth } from '@/contexts/auth-context';
import { type UserProfile } from '@/types';

export default function PlatformRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    const { users, error } = await getPendingUsers(user.uid);
    if (users) setRequests(users);
    if (error) setError(error);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleApprove = async (targetUid: string) => {
    if (!user) return;
    
    setProcessingId(targetUid);
    const { error } = await approveUser(user.uid, targetUid);
    if (error) {
      setError(error);
    } else {
      await fetchRequests();
    }
    setProcessingId(null);
  };

  const handleReject = async (targetUid: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to reject this request? The user will be denied access.')) {
      return;
    }

    setProcessingId(targetUid);
    const { error } = await rejectUser(user.uid, targetUid);
    if (error) {
      setError(error);
    } else {
      await fetchRequests();
    }
    setProcessingId(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Access Requests</h1>
        <p className="text-white/50 mt-1">Review and approve new users who have requested access to the platform.</p>
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
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Pending Approvals ({requests.length})
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchRequests} disabled={loading} className="text-white/50 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-3">
          {requests.length === 0 && !loading && (
            <div className="p-8 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
              No pending access requests.
            </div>
          )}

          {requests.map((requestUser) => (
            <div key={requestUser.uid} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white/90">
                        {requestUser.displayName || 'Unknown User'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 ml-2">
                        Pending
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">
                      {requestUser.email}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      Requested: {new Date(requestUser.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleApprove(requestUser.uid)}
                  disabled={processingId === requestUser.uid}
                  className="text-green-400 border-green-500/20 hover:bg-green-500/10 hover:text-green-300 gap-2"
                >
                  {processingId === requestUser.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleReject(requestUser.uid)}
                  disabled={processingId === requestUser.uid}
                  className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 gap-2"
                >
                  {processingId === requestUser.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
