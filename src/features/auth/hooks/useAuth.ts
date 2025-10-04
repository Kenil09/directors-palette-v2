'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthService } from '../services/auth.service';
import type { AuthState, SignInCredentials } from '../types/auth.types';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      const { session, error } = await AuthService.getSession();

      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        error: error?.message ?? null,
      });
    };

    initAuth();

    // Listen for auth state changes
    const setupSubscription = async () => {
      const subscription = await AuthService.onAuthStateChange((user) => {
        setAuthState((prev) => ({
          ...prev,
          user,
          isLoading: false,
        }));
      });

      subscriptionRef.current = subscription;
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const signIn = async (credentials: SignInCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    const { user, session, error } = await AuthService.signIn(credentials);

    if (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { success: false, error };
    }

    setAuthState({
      user,
      session,
      isLoading: false,
      error: null,
    });

    return { success: true };
  };

  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    const { error } = await AuthService.signOut();

    if (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { success: false, error };
    }

    setAuthState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });

    return { success: true };
  };

  return {
    ...authState,
    signIn,
    signOut,
  };
}
