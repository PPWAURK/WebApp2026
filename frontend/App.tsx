import { Manrope_400Regular, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { AuthForm } from './src/components/AuthForm';
import { HeaderDrawer } from './src/components/HeaderDrawer';
import { RestaurantFormsPage } from './src/components/RestaurantFormsPage';
import { SessionCard } from './src/components/SessionCard';
import { TrainingPage } from './src/components/TrainingPage';
import { useAuth } from './src/hooks/useAuth';
import { useLanguage } from './src/hooks/useLanguage';
import { styles } from './src/styles/appStyles';
import type { MenuPage } from './src/types/menu';

export default function App() {
  const auth = useAuth();
  const language = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePage, setActivePage] = useState<MenuPage>('dashboard');

  useEffect(() => {
    if (!auth.session) {
      setIsDrawerOpen(false);
      setActivePage('dashboard');
    }
  }, [auth.session]);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded || auth.isLoadingSession || language.isLoadingLanguage) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  function renderAuthenticatedContent() {
    if (!auth.session) {
      return null;
    }

    if (activePage === 'training') {
      return (
        <TrainingPage
          text={language.text}
          accessToken={auth.session.accessToken}
          currentUser={auth.session.user}
        />
      );
    }

    if (activePage === 'restaurantForms') {
      return <RestaurantFormsPage text={language.text} />;
    }

    return (
      <SessionCard
        user={auth.session.user}
        accessToken={auth.session.accessToken}
        text={language.text}
        onLogout={() => void auth.logout()}
      />
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appFrame}>
          {auth.session ? (
            <HeaderDrawer
              isOpen={isDrawerOpen}
              text={language.text}
              language={language.language}
              activePage={activePage}
              onToggle={() => setIsDrawerOpen((isOpen) => !isOpen)}
              onClose={() => setIsDrawerOpen(false)}
              onSelectPage={setActivePage}
              onSelectLanguage={(nextLanguage) => {
                void language.setLanguage(nextLanguage);
              }}
            />
          ) : null}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAreaContent}
          >
            <ScrollView
              contentContainerStyle={[
                styles.content,
                auth.session && styles.contentWithHeader,
              ]}
            >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{language.text.appBadge}</Text>
            </View>

            {!auth.session ? (
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
                name={auth.name}
                rememberMe={auth.rememberMe}
                isSubmitting={auth.isSubmitting}
                error={auth.error}
                onEmailChange={auth.setEmail}
                onPasswordChange={auth.setPassword}
                onNameChange={auth.setName}
                onRememberToggle={() =>
                  auth.setRememberMe((currentValue) => !currentValue)
                }
                onSelectLanguage={(nextLanguage) => {
                  void language.setLanguage(nextLanguage);
                }}
                onSubmit={() => void auth.submitAuth(auth.mode)}
                onToggleMode={auth.toggleMode}
              />
            ) : (
              renderAuthenticatedContent()
            )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  );
}
