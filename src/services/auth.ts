// ============================================================
// Studio OS — Firebase Auth Service
// ============================================================
// Thin wrappers around Firebase Auth methods.
// Maps Firebase error codes → user-friendly messages.
// ============================================================

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  type AuthCredential,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────

export interface LinkingData {
  email: string;
  providerIds: string[];
  pendingCredential: AuthCredential;
}

export interface AuthResult {
  user: UserCredential | null;
  error: string | null;
  linkingData?: LinkingData | null;
}

// ── Friendly error messages ────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/email-already-in-use': 'An account already exists with this email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
};

function getAuthErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code;
    return ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

// ── Auth functions ─────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { user: credential, error: null };
  } catch (err) {
    return { user: null, error: getAuthErrorMessage(err) };
  }
}

const googleProvider = new GoogleAuthProvider();

export async function googleLogin(): Promise<AuthResult> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return { user: credential, error: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code === 'auth/account-exists-with-different-credential') {
      const email = err.customData?.email;
      const pendingCredential = GoogleAuthProvider.credentialFromError(err);
      if (email && pendingCredential) {
        const providerIds = await fetchSignInMethodsForEmail(auth, email);
        return {
          user: null,
          error: 'ACCOUNT_EXISTS_DIFFERENT_CREDENTIAL',
          linkingData: { email, providerIds, pendingCredential },
        };
      }
    }
    return { user: null, error: getAuthErrorMessage(err) };
  }
}

const githubProvider = new GithubAuthProvider();

export async function githubLogin(): Promise<AuthResult> {
  try {
    const credential = await signInWithPopup(auth, githubProvider);
    return { user: credential, error: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code === 'auth/account-exists-with-different-credential') {
      const email = err.customData?.email;
      const pendingCredential = GithubAuthProvider.credentialFromError(err);
      if (email && pendingCredential) {
        const providerIds = await fetchSignInMethodsForEmail(auth, email);
        return {
          user: null,
          error: 'ACCOUNT_EXISTS_DIFFERENT_CREDENTIAL',
          linkingData: { email, providerIds, pendingCredential },
        };
      }
    }
    return { user: null, error: getAuthErrorMessage(err) };
  }
}

export async function linkPendingCredential(credential: AuthCredential): Promise<string | null> {
  try {
    if (auth.currentUser) {
      await linkWithCredential(auth.currentUser, credential);
      return null;
    }
    return 'No user signed in to link.';
  } catch (err) {
    return getAuthErrorMessage(err);
  }
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function register(email: string, password: string, displayName: string): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      await sendEmailVerification(credential.user);
    }
    return { user: credential, error: null };
  } catch (err) {
    return { user: null, error: getAuthErrorMessage(err) };
  }
}

export async function forgotPassword(email: string): Promise<string | null> {
  try {
    await sendPasswordResetEmail(auth, email);
    return null;
  } catch (err) {
    return getAuthErrorMessage(err);
  }
}

export async function resendVerificationEmail(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return null;
    }
    return 'No user is currently signed in.';
  } catch (err) {
    return getAuthErrorMessage(err);
  }
}
