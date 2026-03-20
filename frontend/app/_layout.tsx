import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
import { LanguageProvider, useLanguage } from '../src/hooks/useLanguage';
import { ThemeProvider } from '../src/hooks/useTheme';
import { onUnauthorized } from '../src/services/authSession';

function RootStack() {
  const auth = useAuth();
  const language = useLanguage();

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      void auth.logout(language.text.auth.sessionExpired);
    });

    return unsubscribe;
  }, [auth, language.text.auth.sessionExpired]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const lockDurationMs = 450;
    const lastClickAt = new WeakMap<Element, number>();

    function handleWebClickCapture(event: MouseEvent) {
      if (event.defaultPrevented) {
        return;
      }

      if (event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const rawTarget = event.target;
      if (!(rawTarget instanceof Element)) {
        return;
      }

      const clickableTarget = rawTarget.closest('button, [role="button"], a');
      if (!clickableTarget) {
        return;
      }

      const now = Date.now();
      const previousClick = lastClickAt.get(clickableTarget);

      if (
        typeof previousClick === 'number' &&
        now - previousClick < lockDurationMs
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      lastClickAt.set(clickableTarget, now);
    }

    document.addEventListener('click', handleWebClickCapture, true);

    return () => {
      document.removeEventListener('click', handleWebClickCapture, true);
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="(app)"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
