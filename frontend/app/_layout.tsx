import { Stack } from 'expo-router';
import { AuthProvider } from '../src/hooks/useAuth';
import { LanguageProvider } from '../src/hooks/useLanguage';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
      </AuthProvider>
    </LanguageProvider>
  );
}
