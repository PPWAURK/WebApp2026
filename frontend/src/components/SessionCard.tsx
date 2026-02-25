import { Pressable, Text, View } from 'react-native';
import { AdminTrainingAccessPanel } from './AdminTrainingAccessPanel';
import { AdminUploadPanel } from './AdminUploadPanel';
import type { AppText } from '../locales/translations';
import { styles } from '../styles/appStyles';
import type { User } from '../types/auth';

type SessionCardProps = {
  user: User;
  accessToken: string;
  text: AppText;
  onLogout: () => void;
};

export function SessionCard({ user, accessToken, text, onLogout }: SessionCardProps) {
  return (
    <View style={styles.stackCardWrap}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {text.dashboard.welcome} {user.name ?? text.dashboard.fallbackName}
        </Text>
        <Text style={styles.subtitle}>{user.email}</Text>

        <View style={styles.pillRow}>
          <Text style={styles.pill}>{text.dashboard.role}: {user.role}</Text>
          <Text style={styles.pill}>{text.dashboard.workplace}: {user.workplaceRole}</Text>
        </View>

        <Text style={styles.meta}>
          {text.dashboard.probation}: {user.isOnProbation ? text.dashboard.yes : text.dashboard.no}
        </Text>

        <Pressable style={styles.secondaryButton} onPress={onLogout}>
          <Text style={styles.secondaryButtonText}>{text.dashboard.logout}</Text>
        </Pressable>
      </View>

      {user.role === 'ADMIN' ? (
        <>
          <AdminTrainingAccessPanel accessToken={accessToken} />
          <AdminUploadPanel accessToken={accessToken} text={text} />
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.subtitle}>{text.dashboard.uploadPermission}</Text>
        </View>
      )}
    </View>
  );
}
