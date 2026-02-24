import { useEffect, useState } from 'react';
import { requestAuth } from '../services/authApi';
import {
  clearSession,
  loadStoredSession,
  persistSession,
} from '../services/sessionStorage';
import type { AuthMode, AuthResponse } from '../types/auth';

export function useAuth() {
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthResponse | null>(null);

  useEffect(() => {
    async function initSession() {
      try {
        const stored = await loadStoredSession();
        setRememberMe(stored.rememberMe);
        setSession(stored.session);
      } catch {
        setSession(null);
      } finally {
        setIsLoadingSession(false);
      }
    }

    void initSession();
  }, []);

  async function submitAuth(currentMode: AuthMode) {
    setIsSubmitting(true);
    setError(null);

    try {
      const authData = await requestAuth(currentMode, {
        email: email.trim(),
        password,
        name: currentMode === 'register' ? name.trim() : undefined,
      });

      setSession(authData);
      await persistSession(authData, rememberMe);
      setPassword('');
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Impossible de contacter l API';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    setSession(null);
    setEmail('');
    setPassword('');
    setName('');
    setMode('login');
    await clearSession();
  }

  function toggleMode() {
    setError(null);
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
  }

  return {
    isLoadingSession,
    isSubmitting,
    mode,
    email,
    password,
    name,
    rememberMe,
    error,
    session,
    setEmail,
    setPassword,
    setName,
    setRememberMe,
    submitAuth,
    logout,
    toggleMode,
  };
}
