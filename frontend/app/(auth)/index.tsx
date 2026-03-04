import { Manrope_400Regular, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { useRouter } from 'expo-router';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { PreLoginHome } from '../../src/components/PreLoginHome';
import { useLanguage } from '../../src/hooks/useLanguage';
import { styles } from '../../src/styles/App.styles';

export default function AuthLandingScreen() {
  const router = useRouter();
  const language = useLanguage();
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
        <PreLoginHome
          text={language.text}
          onStart={() => {
            router.replace('/login');
          }}
        />
      </SafeAreaView>
    </View>
  );
}
