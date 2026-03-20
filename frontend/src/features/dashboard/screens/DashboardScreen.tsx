import { ScrollView, View } from 'react-native';
import { SessionCard } from '../../../components/SessionCard';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';
import { styles } from '../../../styles/App.styles';

export function DashboardScreen() {
  const auth = useAuth();
  const language = useLanguage();

  if (!auth.session) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.authenticatedContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageTransitionLayer}>
        <SessionCard
          user={auth.session.user}
          accessToken={auth.session.accessToken}
          text={language.text}
        />
      </View>
    </ScrollView>
  );
}
