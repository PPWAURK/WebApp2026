import { useCallback, useEffect, useMemo, useState } from 'react';

export type PreAuthRoute = 'landing' | 'auth' | 'resetPassword';

function normalizeToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRoute(value: string | null | undefined): PreAuthRoute {
  if (!value) {
    return 'landing';
  }

  const normalized = value
    .toLowerCase()
    .replace(/^#?\/?/, '')
    .split('?')[0]
    .replace(/\/$/, '');
  if (normalized === 'auth' || normalized === 'login' || normalized === 'signin') {
    return 'auth';
  }

  if (
    normalized === 'reset-password' ||
    normalized === 'resetpassword' ||
    normalized === 'password-reset'
  ) {
    return 'resetPassword';
  }

  return 'landing';
}

function getRouteFromLocation(): { route: PreAuthRoute; resetToken: string | null } {
  if (typeof window === 'undefined') {
    return { route: 'landing', resetToken: null };
  }

  const fromHash = normalizeRoute(window.location.hash);
  if (fromHash !== 'landing') {
    const hashParts = window.location.hash.split('?');
    const hashToken =
      hashParts.length > 1
        ? normalizeToken(new URLSearchParams(hashParts[1]).get('token'))
        : null;

    return {
      route: fromHash,
      resetToken: hashToken,
    };
  }

  const pathRoute = normalizeRoute(window.location.pathname);
  const searchToken = normalizeToken(
    new URLSearchParams(window.location.search).get('token'),
  );

  return {
    route: pathRoute,
    resetToken: searchToken,
  };
}

function routeToHash(route: PreAuthRoute, resetToken?: string | null): string {
  if (route === 'auth') {
    return '#/auth';
  }

  if (route === 'resetPassword') {
    const token = normalizeToken(resetToken);
    return token ? `#/reset-password?token=${encodeURIComponent(token)}` : '#/reset-password';
  }

  return '#/';
}

export function usePreAuthRouter() {
  const [routeState, setRouteState] = useState<{
    route: PreAuthRoute;
    resetToken: string | null;
  }>(() =>
    typeof window === 'undefined'
      ? { route: 'landing', resetToken: null }
      : getRouteFromLocation(),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    function syncRouteFromLocation() {
      setRouteState(getRouteFromLocation());
    }

    syncRouteFromLocation();
    window.addEventListener('hashchange', syncRouteFromLocation);
    window.addEventListener('popstate', syncRouteFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncRouteFromLocation);
      window.removeEventListener('popstate', syncRouteFromLocation);
    };
  }, []);

  const navigate = useCallback(
    (nextRoute: PreAuthRoute, replace = false, resetToken?: string | null) => {
      const normalizedResetToken =
        nextRoute === 'resetPassword' ? normalizeToken(resetToken) : null;

      setRouteState({
        route: nextRoute,
        resetToken: normalizedResetToken,
      });

      if (typeof window === 'undefined') {
        return;
      }

      const nextHash = routeToHash(nextRoute, normalizedResetToken);
      if (window.location.hash === nextHash) {
        return;
      }

      if (replace) {
        window.history.replaceState(null, '', nextHash);
        return;
      }

      window.history.pushState(null, '', nextHash);
    },
    [],
  );

  const goToLanding = useCallback((replace = false) => {
    navigate('landing', replace);
  }, [navigate]);

  const goToAuth = useCallback((replace = false) => {
    navigate('auth', replace);
  }, [navigate]);

  const goToResetPassword = useCallback(
    (token?: string | null, replace = false) => {
      navigate('resetPassword', replace, token);
    },
    [navigate],
  );

  return useMemo(
    () => ({
      route: routeState.route,
      resetToken: routeState.resetToken,
      goToLanding,
      goToAuth,
      goToResetPassword,
    }),
    [goToAuth, goToLanding, goToResetPassword, routeState],
  );
}
