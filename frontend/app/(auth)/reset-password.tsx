import { Manrope_400Regular, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import { ResetPasswordForm } from '../../src/components/ResetPasswordForm';
import { useLanguage } from '../../src/hooks/useLanguage';
import { requestResetPassword } from '../../src/services/authApi';
import { styles } from '../../src/styles/App.styles';

function normalizeToken(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const language = useLanguage();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = normalizeToken(params.token);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded || language.isLoadingLanguage) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAreaContent}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <ResetPasswordForm
              text={language.text}
              password={password}
              isSubmitting={isSubmitting}
              error={error}
              notice={notice}
              hasToken={Boolean(token)}
              onPasswordChange={setPassword}
              onSubmit={() => {
                if (!token) {
                  setError(language.text.auth.resetTokenMissing);
                  return;
                }

                if (password.trim().length < 8) {
                  setError(language.text.auth.passwordTooShort);
                  return;
                }

                setIsSubmitting(true);
                setError(null);
                setNotice(null);

                void requestResetPassword(token, password)
                  .then(() => {
                    setPassword('');
                    setNotice(language.text.auth.resetPasswordSuccess);
                    setTimeout(() => {
                      router.replace('/login');
                    }, 900);
                  })
                  .catch((requestError: unknown) => {
                    if (
                      requestError instanceof Error &&
                      requestError.message.includes('INVALID_OR_EXPIRED_RESET_TOKEN')
                    ) {
                      setError(language.text.auth.resetTokenInvalidOrExpired);
                      return;
                    }

                    if (
                      requestError instanceof Error &&
                      requestError.message.includes('PASSWORD_TOO_SHORT')
                    ) {
                      setError(language.text.auth.passwordTooShort);
                      return;
                    }

                    setError(language.text.auth.resetPasswordFailed);
                  })
                  .finally(() => {
                    setIsSubmitting(false);
                  });
              }}
              onBackToLogin={() => {
                router.replace('/login');
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
