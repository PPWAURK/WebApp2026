import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import App from '../../App';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function AppRoute() {
  const auth = useAuth();
  const language = useLanguage();
  const navigation = useNavigation();
  const router = useRouter();
  const confirmedExitRef = useRef(false);

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

  return <App />;
}
