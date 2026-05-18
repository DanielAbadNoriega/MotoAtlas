import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseClient } from '../../shared/supabase/supabaseClient';
import {
  getCurrentAuthSnapshot,
  getUserProfile,
  signInWithEmailAndPassword,
  signOutCurrentUser,
  signUpWithEmailAndPassword,
  type AuthStateSnapshot,
  type SignInInput,
  type SignUpInput,
  type UserProfile,
} from './authService';
import type { Session, User } from '@supabase/supabase-js';

export type AuthContextValue = Readonly<{
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (input: SignInInput) => Promise<AuthStateSnapshot>;
  signUp: (input: SignUpInput) => Promise<AuthStateSnapshot>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}>;

const defaultAuthContext: AuthContextValue = {
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  signIn: async () => {
    throw new Error('AuthProvider no está disponible.');
  },
  signUp: async () => {
    throw new Error('AuthProvider no está disponible.');
  },
  signOut: async () => undefined,
  refreshProfile: async () => null,
};

const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySnapshot = useCallback((snapshot: AuthStateSnapshot) => {
    setSession(snapshot.session);
    setUser(snapshot.user);
    setProfile(snapshot.profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return null;
    }

    const nextProfile = await getUserProfile(user.id);
    setProfile(nextProfile);
    return nextProfile;
  }, [user]);

  const signIn = useCallback(async (input: SignInInput) => {
    const snapshot = await signInWithEmailAndPassword(input);
    applySnapshot(snapshot);
    return snapshot;
  }, [applySnapshot]);

  const signUp = useCallback(async (input: SignUpInput) => {
    const snapshot = await signUpWithEmailAndPassword(input);
    applySnapshot(snapshot);
    return snapshot;
  }, [applySnapshot]);

  const signOut = useCallback(async () => {
    await signOutCurrentUser();
    applySnapshot({ session: null, user: null, profile: null });
  }, [applySnapshot]);

  useEffect(() => {
    const client = getSupabaseClient();
    let isMounted = true;

    if (!client) {
      setIsLoading(false);
      return undefined;
    }

    getCurrentAuthSnapshot()
      .then((snapshot) => {
        if (isMounted) {
          applySnapshot(snapshot);
        }
      })
      .catch(() => {
        if (isMounted) {
          applySnapshot({ session: null, user: null, profile: null });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        return;
      }

      getUserProfile(nextUser.id)
        .then((nextProfile) => {
          if (isMounted) {
            setProfile(nextProfile);
          }
        })
        .catch(() => {
          if (isMounted) {
            setProfile(null);
          }
        });
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [applySnapshot]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    isAuthenticated: Boolean(user),
    isAdmin: profile?.role === 'admin',
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [isLoading, profile, refreshProfile, session, signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
