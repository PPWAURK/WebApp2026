import { Pressable, Text, View } from 'react-native';
import { AdminRestaurantPanel } from './AdminRestaurantPanel';
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
        {user.restaurant ? (
          <Text style={styles.subtitle}>
            {user.restaurant.name} - {user.restaurant.address}
          </Text>
        ) : null}

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

      {user.role === 'ADMIN' || user.role === 'MANAGER' ? (
        <>
          {user.role === 'ADMIN' ? <AdminRestaurantPanel accessToken={accessToken} /> : null}
          <AdminTrainingAccessPanel accessToken={accessToken} currentUser={user} />
          {user.role === 'ADMIN' ? (
            <AdminUploadPanel accessToken={accessToken} text={text} />
          ) : null}
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.subtitle}>{text.dashboard.uploadPermission}</Text>
        </View>
      )}
    </View>
  );
}
