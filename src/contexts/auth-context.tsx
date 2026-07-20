'use client';

// ============================================================
// Studio OS — Auth Context
// ============================================================
// Provides the current Firebase user, loading state, and auth
// helpers to the entire component tree via React Context.
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  login as _login,
  googleLogin as _googleLogin,
  githubLogin as _githubLogin,
  logout as _logout,
  register as _register,
  forgotPassword as _forgotPassword,
  resendVerificationEmail as _resendVerificationEmail,
  linkPendingCredential as _linkPendingCredential,
  type LinkingData,
} from '@/services/auth';
import { syncUserProfile } from '@/services/db';
import { type UserRole } from '@/types';

// ── Types ──────────────────────────────────────────────────

interface AuthContextValue {
  /** The currently signed-in user, or `null` if logged out. */
  user: User | null;
  /** The user's role from Firestore, or `null` if not synced or logged out. */
  userRole: UserRole | null;
  /** Any error encountered while fetching the user role (e.g., offline). */
  roleError: string | null;
  /** `true` while the role is being fetched. */
  roleLoading: boolean;
  /** `true` while the initial auth state is being resolved. */
  loading: boolean;
  /** Sign in with email + password. Returns an error string, or `null` on success. */
  login: (email: string, password: string) => Promise<string | null>;
  /** Sign in via Google popup. Returns an error string, or `null` on success. */
  googleLogin: () => Promise<string | null>;
  /** Sign in via GitHub popup. Returns an error string, or `null` on success. */
  githubLogin: () => Promise<string | null>;
  /** Register a new user with email, password, and display name. Returns an error string, or `null` on success. */
  register: (email: string, password: string, displayName: string) => Promise<string | null>;
  /** Sign out the current user. */
  logout: () => Promise<void>;
  
  /** Send a password reset email. Returns an error string, or `null` on success. */
  forgotPassword: (email: string) => Promise<string | null>;
  /** Resend verification email. Returns an error string, or `null` on success. */
  resendVerificationEmail: () => Promise<string | null>;
  /** Force refresh the current user's profile and token to check if email was verified. */
  refreshUser: () => Promise<void>;

  /** Active linking flow data, if any. */
  linkingData: LinkingData | null;
  /** Cancels the linking flow. */
  cancelLinking: () => void;
  /** Resolves the linking flow by signing in with the existing provider and linking. */
  resolveLinking: (password?: string, providerId?: string) => Promise<string | null>;
  /** Retries syncing the user profile (e.g. after network reconnection). */
  retryRoleSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkingData, setLinkingData] = useState<LinkingData | null>(null);

  const retryRoleSync = useCallback(async () => {
    if (!auth.currentUser) return;
    setRoleLoading(true);
    setRoleError(null);
    try {
      const profile = await syncUserProfile(auth.currentUser);
      setUserRole(profile.role);
      
      // Apply Theme
      if (typeof window !== 'undefined') {
        const theme = profile.themePreference || 'dark';
        const html = document.documentElement;
        if (theme === 'light') {
          html.classList.remove('dark');
        } else if (theme === 'dark') {
          html.classList.add('dark');
        } else if (theme === 'system') {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            html.classList.add('dark');
          } else {
            html.classList.remove('dark');
          }
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to sync user profile", error);
      setRoleError(error.message || 'Failed to sync user profile');
    } finally {
      setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setRoleLoading(true);
        setRoleError(null);
        try {
          const profile = await syncUserProfile(firebaseUser);
          setUserRole(profile.role);
          
          // Apply Theme
          if (typeof window !== 'undefined') {
            const theme = profile.themePreference || 'dark';
            const html = document.documentElement;
            if (theme === 'light') {
              html.classList.remove('dark');
            } else if (theme === 'dark') {
              html.classList.add('dark');
            } else if (theme === 'system') {
              if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.classList.add('dark');
              } else {
                html.classList.remove('dark');
              }
            }
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error("Failed to sync user profile", error);
          setRoleError(error.message || 'Failed to sync user profile');
        } finally {
          setRoleLoading(false);
        }
      } else {
        setUserRole(null);
        setRoleError(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Automatically retry when network reconnects
  useEffect(() => {
    const handleOnline = () => {
      if (roleError) {
        retryRoleSync();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [roleError, retryRoleSync]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await _login(email, password);
    return error;
  }, []);

  const googleLogin = useCallback(async () => {
    const { error, linkingData: lData } = await _googleLogin();
    if (lData) {
      setLinkingData(lData);
    }
    return error;
  }, []);

  const githubLogin = useCallback(async () => {
    const { error, linkingData: lData } = await _githubLogin();
    if (lData) {
      setLinkingData(lData);
    }
    return error;
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const { error } = await _register(email, password, displayName);
    return error;
  }, []);

  const logout = useCallback(async () => {
    await _logout();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const error = await _forgotPassword(email);
    return error;
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    const error = await _resendVerificationEmail();
    return error;
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    }
  }, []);

  const cancelLinking = useCallback(() => {
    setLinkingData(null);
  }, []);

  const resolveLinking = useCallback(async (password?: string, providerId?: string) => {
    if (!linkingData) return 'No linking in progress.';
    
    // Determine which method to use for signing in
    let loginErr = null;
    
    // Allow explicit providerId or fallback to the fetched providerIds
    const useGoogle = providerId === 'google.com' || linkingData.providerIds.includes('google.com');
    const useGithub = providerId === 'github.com' || linkingData.providerIds.includes('github.com');
    const usePassword = providerId === 'password' || linkingData.providerIds.includes('password');
    
    if (useGoogle) {
      // Must authenticate with Google first
      const { error } = await _googleLogin();
      loginErr = error;
    } else if (useGithub) {
      // Must authenticate with GitHub first
      const { error } = await _githubLogin();
      loginErr = error;
    } else if (usePassword) {
      // Must authenticate with password first
      if (!password) return 'Password is required to link accounts.';
      const { error } = await _login(linkingData.email, password);
      loginErr = error;
    } else {
      return 'Unsupported provider for linking.';
    }

    if (loginErr) return loginErr;

    // Once successfully authenticated with the existing method, link the pending credential
    const linkErr = await _linkPendingCredential(linkingData.pendingCredential);
    if (linkErr) return linkErr;

    // Success! Clear linking state
    setLinkingData(null);
    return null;
  }, [linkingData]);

  const value: AuthContextValue = {
    user,
    userRole,
    roleError,
    roleLoading,
    loading,
    login,
    googleLogin,
    githubLogin,
    register,
    logout,
    forgotPassword,
    resendVerificationEmail,
    refreshUser,
    linkingData,
    cancelLinking,
    resolveLinking,
    retryRoleSync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
