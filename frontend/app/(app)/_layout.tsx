import {
  Manrope_400Regular,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import {
  Redirect,
  Slot,
  useNavigation,
  usePathname,
  useRouter,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  View,
} from 'react-native';
import { AuthenticatedShell } from '../../src/components/AuthenticatedShell';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { OrderFlowProvider } from '../../src/hooks/useOrderFlow';
import { useTheme } from '../../src/hooks/useTheme';
import { styles } from '../../src/styles/App.styles';
import { menuPageToPath, pathnameToMenuPage } from '../../src/utils/menuNavigation';

export default function AppGroupLayout() {
  const auth = useAuth();
  const language = useLanguage();
  const theme = useTheme();
  const navigation = useNavigation();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const confirmedExitRef = useRef(false);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });
  const activePage = pathnameToMenuPage(pathname) ?? 'dashboard';

  useEffect(() => {
    confirmedExitRef.current = false;
  }, [auth.session?.accessToken]);

  useEffect(() => {
    if (!auth.session) {
      return;
    }

    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (confirmedExitRef.current) {
        return;
      }

      const actionType = event.data.action?.type;
      const shouldConfirmLogout =
        actionType === 'GO_BACK' ||
        actionType === 'POP' ||
        actionType === 'POP_TO_TOP';

      if (!shouldConfirmLogout || navigation.canGoBack()) {
        return;
      }

      event.preventDefault();

      const confirmLogout = async () => {
        confirmedExitRef.current = true;

        try {
          await auth.logout();
        } finally {
          router.replace('/login');
        }
      };

      if (Platform.OS === 'web') {
        const shouldLogout =
          typeof window !== 'undefined' &&
          window.confirm(language.text.auth.exitLoginMessage);

        if (shouldLogout) {
          void confirmLogout();
        }

        return;
      }

      Alert.alert(
        language.text.auth.exitLoginTitle,
        language.text.auth.exitLoginMessage,
        [
          {
            text: language.text.auth.exitLoginCancel,
            style: 'cancel',
          },
          {
            text: language.text.auth.exitLoginConfirm,
            style: 'destructive',
            onPress: () => {
              void confirmLogout();
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [
    auth,
    auth.session,
    language.text.auth.exitLoginCancel,
    language.text.auth.exitLoginConfirm,
    language.text.auth.exitLoginMessage,
    language.text.auth.exitLoginTitle,
    navigation,
    router,
  ]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (
    !fontsLoaded ||
    auth.isLoadingSession ||
    language.isLoadingLanguage ||
    theme.isLoadingTheme
  ) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  if (!auth.session) {
    return <Redirect href="/login" />;
  }

  const isDarkMode = theme.theme === 'dark';
  const authenticatedBackground = isDarkMode ? '#101214' : '#f6efe8';

  return (
    <View
      style={[
        styles.page,
        styles.authenticatedPage,
        { backgroundColor: authenticatedBackground },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <SafeAreaView
        style={[
          styles.safeArea,
          styles.authenticatedSafeArea,
          { backgroundColor: authenticatedBackground },
        ]}
      >
        <View
          style={[
            styles.appFrame,
            styles.authenticatedAppFrame,
            { backgroundColor: authenticatedBackground },
          ]}
        >
          <OrderFlowProvider>
            <AuthenticatedShell
              isSidebarOpen={isSidebarOpen}
              text={language.text}
              language={language.language}
              theme={theme.theme}
              currentUser={auth.session.user}
              activePage={activePage}
              onToggleSidebar={() =>
                setIsSidebarOpen((currentValue) => !currentValue)
              }
              onCloseSidebar={() => setIsSidebarOpen(false)}
              onSelectPage={(page) => {
                const targetPath = menuPageToPath(page);

                if (targetPath === pathname) {
                  return;
                }

                router.replace(targetPath);
              }}
              onSelectLanguage={(nextLanguage) => {
                void language.setLanguage(nextLanguage);
              }}
              onSelectTheme={(nextTheme) => {
                void theme.setTheme(nextTheme);
              }}
              onLogout={() => {
                void auth.logout();
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.authenticatedKeyboardArea}
              >
                <Slot />
              </KeyboardAvoidingView>
            </AuthenticatedShell>
          </OrderFlowProvider>
        </View>
      </SafeAreaView>
    </View>
  );
}
