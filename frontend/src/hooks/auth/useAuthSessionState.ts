import { useEffect, useState } from 'react';
import { requestCurrentUser } from '../../services/authApi';
import {
  clearSession,
  loadStoredSession,
  persistSession,
} from '../../services/sessionStorage';
import type { AuthResponse } from '../../types/auth';

type UseAuthSessionStateParams = {
  setRememberMe: (value: boolean) => void;
};

export function useAuthSessionState({
  setRememberMe,
}: UseAuthSessionStateParams) {
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [postLoginAnimationPending, setPostLoginAnimationPending] =
    useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        const stored = await loadStoredSession();
        setRememberMe(stored.rememberMe);

        if (!stored.session?.accessToken) {
          setSession(null);
          return;
        }

        const currentUser = await requestCurrentUser(
          stored.session.accessToken,
        );
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
  }, [setRememberMe]);

  function consumePostLoginAnimation() {
    setPostLoginAnimationPending(false);
  }

  return {
    isLoadingSession,
    session,
    postLoginAnimationPending,
    setSession,
    setIsLoadingSession,
    setPostLoginAnimationPending,
    consumePostLoginAnimation,
  };
}
