import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { validateAccountDeletion, deleteUserAccountData, reauthenticate } from '@/services/account';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';

export default function DeleteAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1); // 1: Confirm intent, 2: Re-authenticate
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
  const isPasswordProvider = user.providerData.some(p => p.providerId === 'password');

  async function handleNextStep() {
    setLoading(true);
    setError(null);
    setValidationError(null);
    
    const { error: valErr } = await validateAccountDeletion(user!.uid);
    setLoading(false);
    
    if (valErr) {
      setValidationError(valErr);
      return;
    }
    
    setStep(2);
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    // 1. Re-authenticate
    let reauthErr;
    if (isGoogleProvider) {
      const { error } = await reauthenticate(user!, new GoogleAuthProvider());
      reauthErr = error;
    } else if (isPasswordProvider) {
      const credential = EmailAuthProvider.credential(user!.email!, password);
      const { error } = await reauthenticate(user!, credential);
      reauthErr = error;
    }

    if (reauthErr) {
      setError(reauthErr);
      setLoading(false);
      return;
    }

    // 2. Delete Data
    const { error: dataErr } = await deleteUserAccountData(user!);
    if (dataErr) {
      setError(dataErr);
      setLoading(false);
      return;
    }

    // 3. Delete Firebase Auth User
    try {
      await user!.delete();
      // On success, redirect to login via context logout
      await logout();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Your session has expired. Please log out and log back in before deleting your account.');
      } else {
        setError(err.message || 'Failed to delete account.');
      }
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined} 
      />
      
      <div className="relative w-full max-w-md animate-fade-in-up rounded-2xl border border-red-500/20 bg-[#0c0c0e] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <h2 className="text-xl font-bold text-red-500">Delete Account</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {validationError ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {validationError}
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-white/[0.06] py-2.5 text-sm font-medium text-white hover:bg-white/[0.1]"
              >
                Go Back
              </button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm font-medium text-red-400">Warning: Irreversible Action</p>
                <p className="mt-2 text-xs text-red-400/80">
                  This will permanently delete your account, profile, pending invitations, and activity history. You will lose access to all collaborative projects immediately.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <button
                onClick={handleNextStep}
                disabled={confirmText !== 'DELETE' || loading}
                className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Checking projects...' : 'Continue to Re-authentication'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-white/70">
                Please re-authenticate to confirm account deletion. This is required for your security.
              </p>
              
              {error && (
                <p className="text-sm font-medium text-red-400">{error}</p>
              )}

              {isPasswordProvider ? (
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={!password || loading}
                    className="mt-4 w-full rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Permanently Delete Account'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                  {loading ? 'Deleting...' : 'Sign in with Google to Delete'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
