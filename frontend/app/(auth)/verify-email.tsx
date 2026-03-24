import { Manrope_400Regular, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { styles as authFormStyles } from '../../src/components/AuthForm/AuthForm.styles';
import { useLanguage } from '../../src/hooks/useLanguage';
import { requestVerifyEmail } from '../../src/services/authApi';
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

type VerificationState = 'loading' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const language = useLanguage();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = normalizeToken(params.token);
  const attemptedTokenRef = useRef<string | null>(null);
  const [state, setState] = useState<VerificationState>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState<string | null>(
    token ? null : language.text.auth.verifyEmailInvalidOrExpired,
  );
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage(language.text.auth.verifyEmailInvalidOrExpired);
      return;
    }

    if (attemptedTokenRef.current === token) {
      return;
    }

    attemptedTokenRef.current = token;

    let isActive = true;

    setState('loading');
    setMessage(null);

    void requestVerifyEmail(token)
      .then((result) => {
        if (!isActive) {
          return;
        }

        setState('success');
        setMessage(
          result.message.includes('ACCOUNT_PENDING_ADMIN_APPROVAL')
            ? language.text.auth.verifyEmailSuccessPendingAdminApproval
            : language.text.auth.verifyEmailSuccessPendingApproval,
        );
      })
      .catch((requestError: unknown) => {
        if (!isActive) {
          return;
        }

        setState('error');

        if (
          requestError instanceof Error &&
          requestError.message.includes(
            'INVALID_OR_EXPIRED_EMAIL_VERIFICATION_TOKEN',
          )
        ) {
          setMessage(language.text.auth.verifyEmailInvalidOrExpired);
          return;
        }

        setMessage(language.text.auth.verifyEmailFailed);
      });

    return () => {
      isActive = false;
    };
  }, [
    language.text.auth.verifyEmailFailed,
    language.text.auth.verifyEmailInvalidOrExpired,
    language.text.auth.verifyEmailSuccessPendingAdminApproval,
    language.text.auth.verifyEmailSuccessPendingApproval,
    token,
  ]);

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
        <View style={styles.content}>
          <View style={authFormStyles.card}>
            <Image
              source={require('../../../assets/ZHAO-元素element/logo/1.png')}
              style={authFormStyles.logo}
              resizeMode="contain"
            />

            <Text style={authFormStyles.title}>
              {language.text.auth.verifyEmailTitle}
            </Text>

            {state === 'loading' ? (
              <>
                <ActivityIndicator size="small" color="#ab1e24" />
                <Text style={authFormStyles.notice}>
                  {language.text.auth.verifyEmailPending}
                </Text>
              </>
            ) : null}

            {state === 'success' && message ? (
              <Text style={authFormStyles.notice}>{message}</Text>
            ) : null}

            {state === 'error' && message ? (
              <Text style={authFormStyles.error}>{message}</Text>
            ) : null}

            <Pressable
              style={[authFormStyles.primaryButton, authFormStyles.primaryButtonActive]}
              onPress={() => {
                router.replace('/login');
              }}
            >
              <Text style={authFormStyles.primaryButtonText}>
                {language.text.auth.backToLogin}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
