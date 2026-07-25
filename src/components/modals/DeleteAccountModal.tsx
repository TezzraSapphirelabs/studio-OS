import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { validateAccountDeletion, deleteUserAccountData, reauthenticate } from '@/services/account';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import Image from 'next/image';
import { GlassModal } from '@/components/ui/glass-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <GlassModal
      isOpen={isOpen}
      onClose={!loading ? onClose : () => {}}
      title="Delete Account"
      className="max-w-md p-0 sm:p-0"
    >
      <div className="p-6">
        {validationError ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
              {validationError}
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-medium text-white/70">Warning: Irreversible Action</p>
              <p className="mt-2 text-xs text-white/70/80">
                This will permanently delete your account, profile, pending invitations, and activity history. You will lose access to all collaborative projects immediately.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Type <strong>DELETE</strong> to confirm
              </label>
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            <Button
              onClick={handleNextStep}
              disabled={confirmText !== 'DELETE' || loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? 'Checking projects...' : 'Continue to Re-authentication'}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-white/70">
              Please re-authenticate to confirm account deletion. This is required for your security.
            </p>
            
            {error && (
              <p className="text-sm font-medium text-white/70">{error}</p>
            )}

            {isPasswordProvider ? (
              <div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Current Password"
                />
                <Button
                  onClick={handleDelete}
                  disabled={!password || loading}
                  variant="destructive"
                  className="mt-4 w-full"
                >
                  {loading ? 'Deleting...' : 'Permanently Delete Account'}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleDelete}
                disabled={loading}
                variant="default"
                className="flex w-full items-center justify-center gap-3"
              >
                <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} className="h-5 w-5" unoptimized />
                {loading ? 'Deleting...' : 'Sign in with Google to Delete'}
              </Button>
            )}
          </div>
        )}
      </div>
    </GlassModal>
  );
}

