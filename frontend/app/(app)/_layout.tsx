import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { styles } from '../../src/styles/App.styles';

export default function AppGroupLayout() {
  const auth = useAuth();

  if (auth.isLoadingSession) {
    return (
      <SafeAreaView style={styles.loaderPage}>
        <ActivityIndicator size="large" color="#ab1e24" />
      </SafeAreaView>
    );
  }

  if (!auth.session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
