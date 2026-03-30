import type { Dispatch, SetStateAction } from 'react';
import type { AppText } from '../../locales/translations';
import type {
  AuthMode,
  AuthResponse,
  RegisterResponse,
  Restaurant,
  User,
} from '../../types/auth';
import type { Language } from '../../types/language';

export type AuthContextValue = {
  isLoadingSession: boolean;
  isSubmitting: boolean;
  mode: AuthMode;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setSelectedRestaurantId: (restaurantId: number | null) => void;
  setRequestManagerRole: Dispatch<SetStateAction<boolean>>;
  setRememberMe: Dispatch<SetStateAction<boolean>>;
  submitAuth: (
    currentMode: AuthMode,
    text: AppText,
    language: Language,
  ) => Promise<void>;
  forgotPassword: (text: AppText, language: Language) => Promise<void>;
  resendVerificationEmail: (text: AppText, language: Language) => Promise<void>;
  logout: (noticeMessage?: string | null) => Promise<void>;
  toggleMode: () => void;
  updateSessionUser: (user: User) => Promise<void>;
  postLoginAnimationPending: boolean;
  consumePostLoginAnimation: () => void;
};

export type AuthFormState = {
  mode: AuthMode;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  restaurants: Restaurant[];
  selectedRestaurantId: number | null;
  requestManagerRole: boolean;
  rememberMe: boolean;
  error: string | null;
  notice: string | null;
  forgotPasswordCooldownSeconds: number;
  resendVerificationCooldownSeconds: number;
  setMode: Dispatch<SetStateAction<AuthMode>>;
  setEmail: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
  setFirstName: Dispatch<SetStateAction<string>>;
  setLastName: Dispatch<SetStateAction<string>>;
  setRestaurants: Dispatch<SetStateAction<Restaurant[]>>;
  setSelectedRestaurantId: Dispatch<SetStateAction<number | null>>;
  setRequestManagerRole: Dispatch<SetStateAction<boolean>>;
  setRememberMe: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
  setForgotPasswordCooldownSeconds: Dispatch<SetStateAction<number>>;
  setResendVerificationCooldownSeconds: Dispatch<SetStateAction<number>>;
};

export type AuthSessionState = {
  isLoadingSession: boolean;
  session: AuthResponse | null;
  postLoginAnimationPending: boolean;
  setSession: Dispatch<SetStateAction<AuthResponse | null>>;
  setPostLoginAnimationPending: Dispatch<SetStateAction<boolean>>;
  consumePostLoginAnimation: () => void;
  setIsLoadingSession: Dispatch<SetStateAction<boolean>>;
};

export function mapAuthErrorMessage(
  rawMessage: string,
  currentMode: AuthMode,
  text: AppText,
) {
  if (
    rawMessage === text.auth.restaurantMissing ||
    rawMessage.includes('RESTAURANT_REQUIRED')
  ) {
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

  return currentMode === 'login'
    ? text.auth.loginFailed
    : text.auth.registerFailed;
}

export function isRegisterResponse(
  response: AuthResponse | RegisterResponse,
): response is RegisterResponse {
  return 'pendingApproval' in response;
}
