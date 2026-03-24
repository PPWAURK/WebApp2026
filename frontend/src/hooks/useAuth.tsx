import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  requestAuth,
  requestCurrentUser,
  requestForgotPassword,
  requestResendVerificationEmail,
} from '../services/authApi';
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
import type { Language } from '../types/language';

type AuthContextValue = {
  isLoadingSession: boolean;
  isSubmitting: boolean;
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
  requestManagerRole: boolean;
  rememberMe: boolean;
  error: string | null;
  notice: string | null;
  forgotPasswordCooldownSeconds: number;
  resendVerificationCooldownSeconds: number;
  session: AuthResponse | null;
  restaurants: Restaurant[];
  selectedRestaurantId: number | null;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setName: (value: string) => void;
  setSelectedRestaurantId: (restaurantId: number | null) => void;
  setRequestManagerRole: Dispatch<SetStateAction<boolean>>;
  setRememberMe: Dispatch<SetStateAction<boolean>>;
  submitAuth: (currentMode: AuthMode, text: AppText, language: Language) => Promise<void>;
  forgotPassword: (text: AppText, language: Language) => Promise<void>;
  resendVerificationEmail: (text: AppText, language: Language) => Promise<void>;
  logout: (noticeMessage?: string | null) => Promise<void>;
  toggleMode: () => void;
  updateSessionUser: (user: User) => Promise<void>;
  postLoginAnimationPending: boolean;
  consumePostLoginAnimation: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthErrorMessage(rawMessage: string, currentMode: AuthMode, text: AppText) {
  if (rawMessage === text.auth.restaurantMissing || rawMessage.includes('RESTAURANT_REQUIRED')) {
    return text.auth.restaurantMissing;
  }

  if (rawMessage.includes('ACCOUNT_PENDING_ADMIN_APPROVAL')) {
    return text.auth.pendingAdminApprovalRequired;
  }

  if (rawMessage.includes('ACCOUNT_PENDING_APPROVAL')) {
    return text.auth.pendingApprovalRequired;
  }

  if (rawMessage.includes('EMAIL_VERIFICATION_REQUIRED')) {
    return text.auth.emailVerificationRequired;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [requestManagerRole, setRequestManagerRole] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [forgotPasswordCooldownSeconds, setForgotPasswordCooldownSeconds] = useState(0);
  const [resendVerificationCooldownSeconds, setResendVerificationCooldownSeconds] =
    useState(0);
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [postLoginAnimationPending, setPostLoginAnimationPending] = useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        const stored = await loadStoredSession();
        setRememberMe(stored.rememberMe);

        if (!stored.session?.accessToken) {
          setSession(null);
          return;
        }

        const currentUser = await requestCurrentUser(stored.session.accessToken);
        const validatedSession = {
          accessToken: stored.session.accessToken,
          user: currentUser,
        };

        setSession(validatedSession);
        await persistSession(validatedSession, stored.rememberMe);
      } catch {
        await clearSession();
        setSession(null);
      } finally {
        setIsLoadingSession(false);
      }
    }

    void initSession();
  }, []);

  useEffect(() => {
    if (forgotPasswordCooldownSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setForgotPasswordCooldownSeconds((currentValue) =>
        currentValue > 1 ? currentValue - 1 : 0,
      );
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [forgotPasswordCooldownSeconds]);

  useEffect(() => {
    if (resendVerificationCooldownSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setResendVerificationCooldownSeconds((currentValue) =>
        currentValue > 1 ? currentValue - 1 : 0,
      );
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [resendVerificationCooldownSeconds]);

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

  async function submitAuth(currentMode: AuthMode, text: AppText, language: Language) {
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
          currentMode === 'register' && selectedRestaurantId ? selectedRestaurantId : undefined,
        requestManagerRole: currentMode === 'register' ? requestManagerRole : undefined,
        language,
      });

      if (currentMode === 'register') {
        const registerData = authData as RegisterResponse;
        if (
          registerData.pendingApproval ||
          registerData.requiresEmailVerification
        ) {
          setMode('login');
          setPassword('');
          setRequestManagerRole(false);
          setResendVerificationCooldownSeconds(30);
          setNotice(
            requestManagerRole
              ? text.auth.pendingAdminApprovalAfterEmailVerification
              : text.auth.pendingApprovalAfterEmailVerification,
          );
          return;
        }
      }

      const loginData = authData as AuthResponse;
      setSession(loginData);
      setPostLoginAnimationPending(true);
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

  async function forgotPassword(text: AppText, language: Language) {
    if (forgotPasswordCooldownSeconds > 0) {
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(text.auth.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await requestForgotPassword(normalizedEmail, language);
      setNotice(text.auth.resetEmailSent);
      setForgotPasswordCooldownSeconds(30);
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

  async function resendVerificationEmail(text: AppText, language: Language) {
    if (resendVerificationCooldownSeconds > 0) {
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(text.auth.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await requestResendVerificationEmail(normalizedEmail, language);
      setNotice(text.auth.verificationEmailResent);
      setResendVerificationCooldownSeconds(30);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message.includes('INVALID_EMAIL')) {
        setError(text.auth.invalidEmail);
      } else {
        setError(text.auth.verificationEmailResendFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout(noticeMessage?: string | null) {
    await clearSession();
    setSession(null);
    setEmail('');
    setPassword('');
    setName('');
    setRequestManagerRole(false);
    setMode('login');
    setError(null);
    setNotice(noticeMessage ?? null);
    setForgotPasswordCooldownSeconds(0);
    setResendVerificationCooldownSeconds(0);
    setPostLoginAnimationPending(false);
  }

  function toggleMode() {
    setError(null);
    setNotice(null);
    setForgotPasswordCooldownSeconds(0);
    setResendVerificationCooldownSeconds(0);
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
    setRequestManagerRole(false);
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

  function consumePostLoginAnimation() {
    setPostLoginAnimationPending(false);
  }

  return (
    <AuthContext.Provider
      value={{
        isLoadingSession,
        isSubmitting,
        mode,
        email,
        password,
        name,
        requestManagerRole,
        rememberMe,
        error,
        notice,
        forgotPasswordCooldownSeconds,
        resendVerificationCooldownSeconds,
        session,
        restaurants,
        selectedRestaurantId,
        setEmail,
        setPassword,
        setName,
        setSelectedRestaurantId,
        setRequestManagerRole,
        setRememberMe,
        submitAuth,
        forgotPassword,
        resendVerificationEmail,
        logout,
        toggleMode,
        updateSessionUser,
        postLoginAnimationPending,
        consumePostLoginAnimation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
