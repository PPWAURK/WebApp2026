import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { styles } from '../../src/styles/App.styles';

export default function AuthGroupLayout() {
  const auth = useAuth();
  const pathname = usePathname();

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
