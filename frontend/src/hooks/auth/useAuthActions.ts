import type { Dispatch, SetStateAction } from 'react';
import {
  requestAuth,
  requestForgotPassword,
  requestResendVerificationEmail,
} from '../../services/authApi';
import { clearSession, persistSession } from '../../services/sessionStorage';
import type { AppText } from '../../locales/translations';
import type { AuthMode, AuthResponse, User } from '../../types/auth';
import type { Language } from '../../types/language';
import { isRegisterResponse, mapAuthErrorMessage } from './auth.shared';
import type { useAuthFormState } from './useAuthFormState';

type UseAuthActionsParams = {
  form: ReturnType<typeof useAuthFormState>;
  session: {
    setSession: Dispatch<SetStateAction<AuthResponse | null>>;
    setPostLoginAnimationPending: Dispatch<SetStateAction<boolean>>;
  };
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
};

export function useAuthActions({
  form,
  session,
  setIsSubmitting,
}: UseAuthActionsParams) {
  function buildRegisterName() {
    return [form.lastName.trim(), form.firstName.trim()]
      .filter((value) => value.length > 0)
      .join(' ');
  }

  async function submitAuth(
    currentMode: AuthMode,
    text: AppText,
    language: Language,
  ) {
    setIsSubmitting(true);
    form.setError(null);
    form.setNotice(null);

    try {
      if (currentMode === 'register' && !form.selectedRestaurantId) {
        throw new Error(text.auth.restaurantMissing);
      }

      const authData = await requestAuth(currentMode, {
        email: form.email.trim(),
        password: form.password,
        name: currentMode === 'register' ? buildRegisterName() : undefined,
        restaurantId:
          currentMode === 'register' && form.selectedRestaurantId
            ? form.selectedRestaurantId
            : undefined,
        requestManagerRole:
          currentMode === 'register' ? form.requestManagerRole : undefined,
        language,
      });

      if (isRegisterResponse(authData)) {
        if (authData.pendingApproval || authData.requiresEmailVerification) {
          form.setMode('login');
          form.setPassword('');
          form.setRequestManagerRole(false);
          form.setResendVerificationCooldownSeconds(30);
          form.setNotice(
            form.requestManagerRole
              ? text.auth.pendingAdminApprovalAfterEmailVerification
              : text.auth.pendingApprovalAfterEmailVerification,
          );
          return;
        }

        return;
      }

      session.setSession(authData);
      session.setPostLoginAnimationPending(true);
      await persistSession(authData, form.rememberMe);
      form.setPassword('');
    } catch (requestError) {
      if (requestError instanceof Error) {
        form.setError(
          mapAuthErrorMessage(requestError.message, currentMode, text),
        );
      } else {
        form.setError(
          currentMode === 'login'
            ? text.auth.loginFailed
            : text.auth.registerFailed,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function forgotPassword(text: AppText, language: Language) {
    if (form.forgotPasswordCooldownSeconds > 0) {
      return;
    }

    const normalizedEmail = form.email.trim();
    if (!normalizedEmail) {
      form.setError(text.auth.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    form.setError(null);
    form.setNotice(null);

    try {
      await requestForgotPassword(normalizedEmail, language);
      form.setNotice(text.auth.resetEmailSent);
      form.setForgotPasswordCooldownSeconds(30);
    } catch (requestError) {
      if (
        requestError instanceof Error &&
        requestError.message.includes('INVALID_EMAIL')
      ) {
        form.setError(text.auth.invalidEmail);
      } else {
        form.setError(text.auth.resetEmailFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendVerificationEmail(text: AppText, language: Language) {
    if (form.resendVerificationCooldownSeconds > 0) {
      return;
    }

    const normalizedEmail = form.email.trim();
    if (!normalizedEmail) {
      form.setError(text.auth.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    form.setError(null);
    form.setNotice(null);

    try {
      await requestResendVerificationEmail(normalizedEmail, language);
      form.setNotice(text.auth.verificationEmailResent);
      form.setResendVerificationCooldownSeconds(30);
    } catch (requestError) {
      if (
        requestError instanceof Error &&
        requestError.message.includes('INVALID_EMAIL')
      ) {
        form.setError(text.auth.invalidEmail);
      } else {
        form.setError(text.auth.verificationEmailResendFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout(noticeMessage?: string | null) {
    await clearSession();
    session.setSession(null);
    form.setEmail('');
    form.setPassword('');
    form.setFirstName('');
    form.setLastName('');
    form.setRequestManagerRole(false);
    form.setMode('login');
    form.setError(null);
    form.setNotice(noticeMessage ?? null);
    form.setForgotPasswordCooldownSeconds(0);
    form.setResendVerificationCooldownSeconds(0);
    session.setPostLoginAnimationPending(false);
  }

  function toggleMode() {
    form.setError(null);
    form.setNotice(null);
    form.setForgotPasswordCooldownSeconds(0);
    form.setResendVerificationCooldownSeconds(0);
    form.setMode((currentMode) =>
      currentMode === 'login' ? 'register' : 'login',
    );
    form.setRequestManagerRole(false);
  }

  async function updateSessionUser(user: User) {
    session.setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = {
        ...currentSession,
        user,
      };

      void persistSession(nextSession, form.rememberMe);
      return nextSession;
    });
  }

  return {
    submitAuth,
    forgotPassword,
    resendVerificationEmail,
    logout,
    toggleMode,
    updateSessionUser,
  };
}
