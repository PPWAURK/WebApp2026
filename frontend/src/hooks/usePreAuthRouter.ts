import { useCallback, useEffect, useMemo, useState } from 'react';

export type PreAuthRoute = 'landing' | 'auth';

function normalizeRoute(value: string | null | undefined): PreAuthRoute {
  if (!value) {
    return 'landing';
  }

  const normalized = value.toLowerCase().replace(/^#?\/?/, '');
  if (normalized === 'auth' || normalized === 'login' || normalized === 'signin') {
    return 'auth';
  }

  return 'landing';
}

function getRouteFromLocation(): PreAuthRoute {
  if (typeof window === 'undefined') {
    return 'landing';
  }

  const fromHash = normalizeRoute(window.location.hash);
  if (fromHash !== 'landing') {
    return fromHash;
  }

  return normalizeRoute(window.location.pathname);
}

function routeToHash(route: PreAuthRoute): string {
  return route === 'auth' ? '#/auth' : '#/';
}

export function usePreAuthRouter() {
  const [route, setRoute] = useState<PreAuthRoute>(() =>
    typeof window === 'undefined' ? 'landing' : getRouteFromLocation(),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    function syncRouteFromLocation() {
      setRoute(getRouteFromLocation());
    }

    syncRouteFromLocation();
    window.addEventListener('hashchange', syncRouteFromLocation);
    window.addEventListener('popstate', syncRouteFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncRouteFromLocation);
      window.removeEventListener('popstate', syncRouteFromLocation);
    };
  }, []);

  const navigate = useCallback((nextRoute: PreAuthRoute, replace = false) => {
    setRoute(nextRoute);

    if (typeof window === 'undefined') {
      return;
    }

    const nextHash = routeToHash(nextRoute);
    if (window.location.hash === nextHash) {
      return;
    }

    if (replace) {
      window.history.replaceState(null, '', nextHash);
      return;
    }

    window.history.pushState(null, '', nextHash);
  }, []);

  const goToLanding = useCallback((replace = false) => {
    navigate('landing', replace);
  }, [navigate]);

  const goToAuth = useCallback((replace = false) => {
    navigate('auth', replace);
  }, [navigate]);

  return useMemo(
    () => ({
      route,
      goToLanding,
      goToAuth,
    }),
    [goToAuth, goToLanding, route],
  );
}
