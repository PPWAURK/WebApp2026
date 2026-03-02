import { useEffect, useState } from 'react';
import { requestAuth, requestForgotPassword } from '../services/authApi';
import { fetchRestaurants } from '../services/restaurantsApi';
import {
  clearSession,
  loadStoredSession,
  persistSession,
} from '../services/sessionStorage';
import type { AppText } from '../locales/translations';
import type {
  AuthMode,
  AuthResponse,
  RegisterResponse,
  Restaurant,
  User,
} from '../types/auth';

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
  const [notice, setNotice] = useState<string | null>(null);
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

  function mapAuthErrorMessage(rawMessage: string, currentMode: AuthMode, text: AppText) {
    if (rawMessage === text.auth.restaurantMissing || rawMessage.includes('RESTAURANT_REQUIRED')) {
      return text.auth.restaurantMissing;
    }

    if (rawMessage.includes('ACCOUNT_PENDING_APPROVAL')) {
      return text.auth.pendingApprovalRequired;
    }

    if (rawMessage.includes('INVALID_EMAIL')) {
      return text.auth.invalidEmail;
    }

    if (rawMessage.includes('USER_NOT_FOUND')) {
      return text.auth.userNotFound;
    }

    if (rawMessage.includes('INCORRECT_PASSWORD')) {
      return text.auth.incorrectPassword;
    }

    if (rawMessage.includes('EMAIL_ALREADY_REGISTERED')) {
      return text.auth.emailAlreadyRegistered;
    }

    if (rawMessage.includes('PASSWORD_TOO_SHORT')) {
      return text.auth.passwordTooShort;
    }

    return currentMode === 'login' ? text.auth.loginFailed : text.auth.registerFailed;
  }

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
    setNotice(null);

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

      if (currentMode === 'register') {
        const registerData = authData as RegisterResponse;
        if (registerData.pendingApproval) {
          setMode('login');
          setPassword('');
          setNotice(text.auth.pendingApprovalSubmitted);
          return;
        }
      }

      const loginData = authData as AuthResponse;
      setSession(loginData);
      await persistSession(loginData, rememberMe);
      setPassword('');
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(mapAuthErrorMessage(requestError.message, currentMode, text));
      } else {
        setError(currentMode === 'login' ? text.auth.loginFailed : text.auth.registerFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function forgotPassword(text: AppText) {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(text.auth.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await requestForgotPassword(normalizedEmail);
      setNotice(text.auth.resetEmailSent);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message.includes('INVALID_EMAIL')) {
        setError(text.auth.invalidEmail);
      } else {
        setError(text.auth.resetEmailFailed);
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
    setNotice(null);
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
  }

  async function updateSessionUser(user: User) {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = {
        ...currentSession,
        user,
      };

      void persistSession(nextSession, rememberMe);
      return nextSession;
    });
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
    notice,
    session,
    restaurants,
    selectedRestaurantId,
    setEmail,
    setPassword,
    setName,
    setSelectedRestaurantId,
    setRememberMe,
    submitAuth,
    forgotPassword,
    logout,
    toggleMode,
    updateSessionUser,
  };
}
