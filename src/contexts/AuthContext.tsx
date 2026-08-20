import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchUserProfile, signIn, signUp, signOut as authSignOut } from '../lib/auth';
import type { AuthUser, SignInData, SignUpData } from '../lib/auth';
import type { Session } from '@supabase/supabase-js';

// ─── Context Type ───────────────────────────────────────

interface AuthContextType {
  /** The authenticated platform user with role and org info. Null if not logged in. */
  user: AuthUser | null;
  /** The raw Supabase session. Null if not authenticated. */
  session: Session | null;
  /** True while checking initial auth state on mount. */
  loading: boolean;
  /** Sign in with email + password. Throws on error. */
  handleSignIn: (data: SignInData) => Promise<void>;
  /** Sign up (first-time setup). Creates org + admin user. Throws on error. */
  handleSignUp: (data: SignUpData) => Promise<void>;
  /** Sign out the current user. */
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from our users table
  const loadProfile = useCallback(async (authUid: string) => {
    const profile = await fetchUserProfile(authUid);
    setUser(profile);
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        if (s?.user) {
          await loadProfile(s.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const handleSignIn = useCallback(async (data: SignInData) => {
    await signIn(data);
    // onAuthStateChange will fire and update state
  }, []);

  const handleSignUp = useCallback(async (data: SignUpData) => {
    await signUp(data);
    // onAuthStateChange will fire and update state
  }, []);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, handleSignIn, handleSignUp, handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
