import { useEffect, useState } from 'react';
import { requestAuth } from '../services/authApi';
import { fetchRestaurants } from '../services/restaurantsApi';
import {
  clearSession,
  loadStoredSession,
  persistSession,
} from '../services/sessionStorage';
import type { AppText } from '../locales/translations';
import type { AuthMode, AuthResponse, Restaurant } from '../types/auth';

export function useAuth() {
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
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

  useEffect(() => {
    let isActive = true;

    void fetchRestaurants()
      .then((result) => {
        if (!isActive) {
          return;
        }

        setRestaurants(result);
        if (result.length > 0) {
          setSelectedRestaurantId((current) => current ?? result[0].id);
        }
      })
      .catch(() => {
        if (isActive) {
          setRestaurants([]);
          setSelectedRestaurantId(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function submitAuth(currentMode: AuthMode, text: AppText) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (currentMode === 'register' && !selectedRestaurantId) {
        throw new Error(text.auth.restaurantMissing);
      }

      const authData = await requestAuth(currentMode, {
        email: email.trim(),
        password,
        name: currentMode === 'register' ? name.trim() : undefined,
        restaurantId:
          currentMode === 'register' && selectedRestaurantId
            ? selectedRestaurantId
            : undefined,
      });

      setSession(authData);
      await persistSession(authData, rememberMe);
      setPassword('');
    } catch (requestError) {
      if (
        requestError instanceof Error &&
        requestError.message === text.auth.restaurantMissing
      ) {
        setError(requestError.message);
      } else {
        setError(text.auth.requestFailed);
      }
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
    restaurants,
    selectedRestaurantId,
    setEmail,
    setPassword,
    setName,
    setSelectedRestaurantId,
    setRememberMe,
    submitAuth,
    logout,
    toggleMode,
  };
}
