import { createContext, type ReactNode, useContext, useState } from 'react';
import type { AuthContextValue } from './auth/auth.shared';
import { useAuthActions } from './auth/useAuthActions';
import { useAuthFormState } from './auth/useAuthFormState';
import { useAuthSessionState } from './auth/useAuthSessionState';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useAuthFormState();
  const session = useAuthSessionState({ setRememberMe: form.setRememberMe });
  const actions = useAuthActions({
    form,
    session: {
      setSession: session.setSession,
      setPostLoginAnimationPending: session.setPostLoginAnimationPending,
    },
    setIsSubmitting,
  });

  return (
    <AuthContext.Provider
      value={{
        isLoadingSession: session.isLoadingSession,
        isSubmitting,
        mode: form.mode,
        email: form.email,
        password: form.password,
        name: form.name,
        requestManagerRole: form.requestManagerRole,
        rememberMe: form.rememberMe,
        error: form.error,
        notice: form.notice,
        forgotPasswordCooldownSeconds: form.forgotPasswordCooldownSeconds,
        resendVerificationCooldownSeconds:
          form.resendVerificationCooldownSeconds,
        session: session.session,
        restaurants: form.restaurants,
        selectedRestaurantId: form.selectedRestaurantId,
        setEmail: form.setEmail,
        setPassword: form.setPassword,
        setName: form.setName,
        setSelectedRestaurantId: form.setSelectedRestaurantId,
        setRequestManagerRole: form.setRequestManagerRole,
        setRememberMe: form.setRememberMe,
        submitAuth: actions.submitAuth,
        forgotPassword: actions.forgotPassword,
        resendVerificationEmail: actions.resendVerificationEmail,
        logout: actions.logout,
        toggleMode: actions.toggleMode,
        updateSessionUser: actions.updateSessionUser,
        postLoginAnimationPending: session.postLoginAnimationPending,
        consumePostLoginAnimation: session.consumePostLoginAnimation,
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
