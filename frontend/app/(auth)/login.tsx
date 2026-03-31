import {
  Manrope_400Regular,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { AuthForm } from '../../src/components/AuthForm';
import { LoginSvgLoader } from '../../src/components/LoginSvgLoader';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { styles } from '../../src/styles/App.styles';

const LOGIN_ANIMATION_DURATION_MS = 2000;
const CAN_USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const auth = useAuth();
  const language = useLanguage();
  const [isPostLoginLoading, setIsPostLoginLoading] = useState(false);
  const hasStartedPostLoginRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const loaderScale = useRef(new Animated.Value(0.86)).current;
  const shouldDisableOuterScroll = width >= 768;
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (!auth.session || !auth.postLoginAnimationPending) {
      hasStartedPostLoginRef.current = false;
      return;
    }

    if (hasStartedPostLoginRef.current) {
      return;
    }

    hasStartedPostLoginRef.current = true;

    setIsPostLoginLoading(true);
    loaderOpacity.setValue(0);
    loaderScale.setValue(0.86);

    Animated.parallel([
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.exp),
        useNativeDriver: CAN_USE_NATIVE_DRIVER,
      }),
      Animated.timing(loaderScale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.exp),
        useNativeDriver: CAN_USE_NATIVE_DRIVER,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(loaderOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: CAN_USE_NATIVE_DRIVER,
        }),
        Animated.timing(loaderScale, {
          toValue: 1.04,
          duration: 280,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: CAN_USE_NATIVE_DRIVER,
        }),
      ]).start(() => {
        timeoutRef.current = null;
        auth.consumePostLoginAnimation();
        router.replace('/dashboard');
      });
    }, LOGIN_ANIMATION_DURATION_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      loaderOpacity.stopAnimation();
      loaderScale.stopAnimation();
    };
  }, [
    auth.postLoginAnimationPending,
    auth.session?.accessToken,
    loaderOpacity,
    loaderScale,
    router,
  ]);

  if (!fontsLoaded || auth.isLoadingSession || language.isLoadingLanguage) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  if (isPostLoginLoading) {
    return (
      <View style={styles.page}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[styles.loginLoaderFullscreen, { opacity: loaderOpacity }]}
          >
            <Animated.View
              style={[
                styles.loginLoaderCard,
                {
                  transform: [{ scale: loaderScale }],
                },
              ]}
            >
              <LoginSvgLoader />
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAreaContent}
        >
          {shouldDisableOuterScroll ? (
            <View style={styles.staticContent}>
              <AuthForm
                mode={auth.mode}
                title={
                  auth.mode === 'login'
                    ? language.text.auth.loginTitle
                    : language.text.auth.registerTitle
                }
                text={language.text}
                language={language.language}
                email={auth.email}
                password={auth.password}
                firstName={auth.firstName}
                lastName={auth.lastName}
                restaurants={auth.restaurants}
                selectedRestaurantId={auth.selectedRestaurantId}
                requestManagerRole={auth.requestManagerRole}
                rememberMe={auth.rememberMe}
                isSubmitting={auth.isSubmitting}
                forgotPasswordCooldownSeconds={
                  auth.forgotPasswordCooldownSeconds
                }
                resendVerificationCooldownSeconds={
                  auth.resendVerificationCooldownSeconds
                }
                error={auth.error}
                notice={auth.notice}
                onEmailChange={auth.setEmail}
                onPasswordChange={auth.setPassword}
                onFirstNameChange={auth.setFirstName}
                onLastNameChange={auth.setLastName}
                onSelectRestaurant={auth.setSelectedRestaurantId}
                onToggleRequestManagerRole={() => {
                  auth.setRequestManagerRole((currentValue) => !currentValue);
                }}
                onRememberToggle={() => {
                  auth.setRememberMe((currentValue) => !currentValue);
                }}
                onSelectLanguage={(nextLanguage) => {
                  void language.setLanguage(nextLanguage);
                }}
                onSubmit={() => {
                  void auth.submitAuth(
                    auth.mode,
                    language.text,
                    language.language,
                  );
                }}
                onForgotPassword={() => {
                  void auth.forgotPassword(language.text, language.language);
                }}
                onResendVerification={() => {
                  void auth.resendVerificationEmail(
                    language.text,
                    language.language,
                  );
                }}
                onToggleMode={auth.toggleMode}
                onBackToLanding={() => {
                  router.replace('/');
                }}
              />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              <AuthForm
                mode={auth.mode}
                title={
                  auth.mode === 'login'
                    ? language.text.auth.loginTitle
                    : language.text.auth.registerTitle
                }
                text={language.text}
                language={language.language}
                email={auth.email}
                password={auth.password}
                firstName={auth.firstName}
                lastName={auth.lastName}
                restaurants={auth.restaurants}
                selectedRestaurantId={auth.selectedRestaurantId}
                requestManagerRole={auth.requestManagerRole}
                rememberMe={auth.rememberMe}
                isSubmitting={auth.isSubmitting}
                forgotPasswordCooldownSeconds={
                  auth.forgotPasswordCooldownSeconds
                }
                resendVerificationCooldownSeconds={
                  auth.resendVerificationCooldownSeconds
                }
                error={auth.error}
                notice={auth.notice}
                onEmailChange={auth.setEmail}
                onPasswordChange={auth.setPassword}
                onFirstNameChange={auth.setFirstName}
                onLastNameChange={auth.setLastName}
                onSelectRestaurant={auth.setSelectedRestaurantId}
                onToggleRequestManagerRole={() => {
                  auth.setRequestManagerRole((currentValue) => !currentValue);
                }}
                onRememberToggle={() => {
                  auth.setRememberMe((currentValue) => !currentValue);
                }}
                onSelectLanguage={(nextLanguage) => {
                  void language.setLanguage(nextLanguage);
                }}
                onSubmit={() => {
                  void auth.submitAuth(
                    auth.mode,
                    language.text,
                    language.language,
                  );
                }}
                onForgotPassword={() => {
                  void auth.forgotPassword(language.text, language.language);
                }}
                onResendVerification={() => {
                  void auth.resendVerificationEmail(
                    language.text,
                    language.language,
                  );
                }}
                onToggleMode={auth.toggleMode}
                onBackToLanding={() => {
                  router.replace('/');
                }}
              />
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
