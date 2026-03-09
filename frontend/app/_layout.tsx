import { Stack } from 'expo-router';
import { AuthProvider } from '../src/hooks/useAuth';
import { LanguageProvider } from '../src/hooks/useLanguage';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
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
      </AuthProvider>
    </LanguageProvider>
  );
}
