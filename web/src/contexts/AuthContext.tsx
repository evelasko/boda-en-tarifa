'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  AuthError 
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/lib/firebase';
import { 
  setSentryUser, 
  captureAuthError, 
  trackAuthFlow,
  withSentrySpan 
} from '@/lib/sentry-helpers';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Update Sentry user context
      setSentryUser(user);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Track authentication flow start
      trackAuthFlow('started', 'google');
      
      // Perform sign-in with performance tracking
      await withSentrySpan(
        'Google Sign-In',
        'auth.signin.google',
        async () => {
          await signInWithPopup(auth, googleProvider);
        },
        { provider: 'google' }
      );
      
      // Track successful completion
      trackAuthFlow('completed', 'google');
    } catch (error) {
      const authError = error as AuthError;
      
      // Track failed authentication
      trackAuthFlow('failed', 'google');
      
      // Capture error in Sentry with context
      captureAuthError(authError, 'google', {
        error_message: authError.message,
        error_code: authError.code,
      });
      
      // Set user-friendly error message
      const userMessage = getFriendlyAuthErrorMessage(authError, 'Google');
      setError(userMessage);
      console.error('Google sign-in error:', authError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Track authentication flow start
      trackAuthFlow('started', 'apple');
      
      // Perform sign-in with performance tracking
      await withSentrySpan(
        'Apple Sign-In',
        'auth.signin.apple',
        async () => {
          await signInWithPopup(auth, appleProvider);
        },
        { provider: 'apple' }
      );
      
      // Track successful completion
      trackAuthFlow('completed', 'apple');
    } catch (error) {
      const authError = error as AuthError;
      
      // Track failed authentication
      trackAuthFlow('failed', 'apple');
      
      // Capture error in Sentry with context
      captureAuthError(authError, 'apple', {
        error_message: authError.message,
        error_code: authError.code,
      });
      
      // Set user-friendly error message
      const userMessage = getFriendlyAuthErrorMessage(authError, 'Apple');
      setError(userMessage);
      console.error('Apple sign-in error:', authError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      
      // Track logout flow start
      trackAuthFlow('started', 'logout');
      
      // Perform logout with performance tracking
      await withSentrySpan(
        'User Logout',
        'auth.logout',
        async () => {
          await signOut(auth);
        }
      );
      
      // Clear Sentry user context
      setSentryUser(null);
      
      // Track successful completion
      trackAuthFlow('completed', 'logout');
    } catch (error) {
      const authError = error as AuthError;
      
      // Track failed logout
      trackAuthFlow('failed', 'logout');
      
      // Capture error in Sentry
      captureAuthError(authError, 'logout');
      
      setError('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
      console.error('Logout error:', authError);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Convert Firebase auth errors to user-friendly messages
 */
function getFriendlyAuthErrorMessage(error: AuthError, provider: string): string {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return `Has cerrado la ventana de ${provider}. Por favor, inténtalo de nuevo.`;
    case 'auth/popup-blocked':
      return 'La ventana emergente fue bloqueada. Por favor, permite las ventanas emergentes e inténtalo de nuevo.';
    case 'auth/cancelled-popup-request':
      return 'Autenticación cancelada. Por favor, inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Por favor, espera unos minutos e inténtalo de nuevo.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada. Por favor, contacta al soporte.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo electrónico usando un método diferente.';
    default:
      return `Error al iniciar sesión con ${provider}. Por favor, inténtalo de nuevo.`;
  }
}
