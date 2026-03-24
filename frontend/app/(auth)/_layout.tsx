import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { styles } from '../../src/styles/App.styles';
import { normalizePathname } from '../../src/utils/menuNavigation';

export default function AuthGroupLayout() {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const styleId = 'webapp-input-browser-overrides';
    if (document.getElementById(styleId)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      html[data-auth-route="true"] *:focus,
      html[data-auth-route="true"] *:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }

      html[data-auth-route="true"] input:focus-visible,
      html[data-auth-route="true"] textarea:focus-visible,
      html[data-auth-route="true"] select:focus-visible {
        outline: none !important;
        outline-offset: 0 !important;
        box-shadow: none !important;
      }

      html[data-auth-route="true"] input,
      html[data-auth-route="true"] textarea,
      html[data-auth-route="true"] select {
        -webkit-tap-highlight-color: transparent !important;
        -webkit-appearance: none !important;
        appearance: none !important;
        border-radius: 10px !important;
        border: none !important;
        box-shadow: none !important;
        background-clip: padding-box !important;
        background-color: transparent !important;
      }

      input:focus,
      input:focus-visible,
      input:active,
      textarea:focus,
      textarea:focus-visible,
      select:focus,
      select:focus-visible {
        outline: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      input:focus:not(:focus-visible),
      textarea:focus:not(:focus-visible),
      select:focus:not(:focus-visible) {
        outline: none !important;
        box-shadow: none !important;
      }

      input[data-focus-visible-added],
      textarea[data-focus-visible-added],
      select[data-focus-visible-added] {
        outline: none !important;
        box-shadow: none !important;
      }

      input[type="email"],
      input[type="password"],
      input[type="text"],
      input[type="search"],
      input[type="tel"],
      input[type="url"],
      input[type="number"] {
        -webkit-appearance: none !important;
        appearance: none !important;
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }

      input[type="email"]:focus,
      input[type="password"]:focus,
      input[type="text"]:focus,
      input[type="search"]:focus,
      input[type="tel"]:focus,
      input[type="url"]:focus,
      input[type="number"]:focus,
      input[type="email"]:focus-visible,
      input[type="password"]:focus-visible,
      input[type="text"]:focus-visible,
      input[type="search"]:focus-visible,
      input[type="tel"]:focus-visible,
      input[type="url"]:focus-visible,
      input[type="number"]:focus-visible {
        outline: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      input[class*="css-textinput"],
      textarea[class*="css-textinput"],
      input[class*="r-outline"],
      textarea[class*="r-outline"],
      input[class*="r-border"],
      textarea[class*="r-border"] {
        -webkit-appearance: none !important;
        appearance: none !important;
        outline: none !important;
        border: none !important;
        border-color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      input[class*="css-textinput"]:focus,
      input[class*="css-textinput"]:focus-visible,
      input[class*="r-outline"]:focus,
      input[class*="r-outline"]:focus-visible,
      input[class*="r-border"]:focus,
      input[class*="r-border"]:focus-visible {
        outline: none !important;
        border: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      input[class*="css-textinput"][data-focus-visible-added],
      input[class*="r-outline"][data-focus-visible-added],
      input[class*="r-border"][data-focus-visible-added] {
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active,
      textarea:-webkit-autofill,
      textarea:-webkit-autofill:hover,
      textarea:-webkit-autofill:focus,
      textarea:-webkit-autofill:active,
      select:-webkit-autofill,
      select:-webkit-autofill:hover,
      select:-webkit-autofill:focus,
      select:-webkit-autofill:active {
        background-color: #ffffff !important;
        -webkit-text-fill-color: #ab1e24 !important;
        caret-color: #ab1e24 !important;
        -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
        box-shadow: 0 0 0 1000px #ffffff inset !important;
        transition: background-color 9999s ease-in-out 0s;
      }

      html[data-auth-route="true"] input:-webkit-autofill,
      html[data-auth-route="true"] input:-webkit-autofill:hover,
      html[data-auth-route="true"] input:-webkit-autofill:focus,
      html[data-auth-route="true"] input:-webkit-autofill:active,
      html[data-auth-route="true"] textarea:-webkit-autofill,
      html[data-auth-route="true"] textarea:-webkit-autofill:hover,
      html[data-auth-route="true"] textarea:-webkit-autofill:focus,
      html[data-auth-route="true"] textarea:-webkit-autofill:active,
      html[data-auth-route="true"] select:-webkit-autofill,
      html[data-auth-route="true"] select:-webkit-autofill:hover,
      html[data-auth-route="true"] select:-webkit-autofill:focus,
      html[data-auth-route="true"] select:-webkit-autofill:active {
        border-radius: 10px !important;
        background-color: #ffffff !important;
        -webkit-text-fill-color: #ab1e24 !important;
        caret-color: #ab1e24 !important;
        -webkit-background-clip: padding-box !important;
        -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
        box-shadow: 0 0 0 1000px #ffffff inset !important;
      }

      html[data-auth-route="true"] input[type="password"]::-ms-reveal,
      html[data-auth-route="true"] input[type="password"]::-ms-clear,
      html[data-auth-route="true"] input[type="password"]::-webkit-contacts-auto-fill-button,
      html[data-auth-route="true"] input[type="password"]::-webkit-credentials-auto-fill-button {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      styleElement.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const isInteractiveAuthRoute =
      pathname === '/login' ||
      pathname === '/reset-password' ||
      pathname === '/verify-email' ||
      pathname === '/auth';

    if (isInteractiveAuthRoute) {
      root.setAttribute('data-auth-route', 'true');
    } else {
      root.removeAttribute('data-auth-route');
    }

    return () => {
      root.removeAttribute('data-auth-route');
    };
  }, [pathname]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    if (normalizePathname(pathname) !== '/') {
      return;
    }

    const hash = window.location.hash;
    if (!hash.startsWith('#/')) {
      return;
    }

    const [rawPath, rawQuery] = hash.slice(1).split('?');
    const normalizedHashPath = normalizePathname(rawPath || '/');

    if (
      normalizedHashPath === '/auth' ||
      normalizedHashPath === '/login' ||
      normalizedHashPath === '/signin'
    ) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
      router.replace('/login');
      return;
    }

    if (
      normalizedHashPath === '/reset-password' ||
      normalizedHashPath === '/resetpassword' ||
      normalizedHashPath === '/password-reset'
    ) {
      const hashToken =
        new URLSearchParams(rawQuery || '').get('token') ?? undefined;
      const normalizedHashToken =
        typeof hashToken === 'string' ? hashToken.trim() || null : null;

      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );

      if (normalizedHashToken) {
        router.replace(
          `/reset-password?token=${encodeURIComponent(normalizedHashToken)}`,
        );
        return;
      }

      router.replace('/reset-password');
      return;
    }

    if (
      normalizedHashPath === '/verify-email' ||
      normalizedHashPath === '/verifyemail' ||
      normalizedHashPath === '/email-verification'
    ) {
      const hashToken =
        new URLSearchParams(rawQuery || '').get('token') ?? undefined;
      const normalizedHashToken =
        typeof hashToken === 'string' ? hashToken.trim() || null : null;

      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );

      if (normalizedHashToken) {
        router.replace(
          `/verify-email?token=${encodeURIComponent(normalizedHashToken)}`,
        );
        return;
      }

      router.replace('/verify-email');
    }
  }, [pathname, router]);

  if (auth.isLoadingSession) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  if (auth.session && !(pathname === '/login' && auth.postLoginAnimationPending)) {
    return <Redirect href="/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
