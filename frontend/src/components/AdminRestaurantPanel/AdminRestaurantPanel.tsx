import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { createRestaurant } from '../../services/restaurantsApi';
import type { AppText } from '../../locales/translations';
import { styles } from './AdminRestaurantPanel.styles';

type AdminRestaurantPanelProps = {
  accessToken: string;
  text: AppText;
};

export function AdminRestaurantPanel({
  accessToken,
  text,
}: AdminRestaurantPanelProps) {
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreateRestaurant() {
    setIsSavingRestaurant(true);
    setError(null);

    try {
      await createRestaurant(accessToken, {
        name: restaurantName,
        address: restaurantAddress,
      });
      setRestaurantName('');
      setRestaurantAddress('');
    } catch (createError) {
      if (createError instanceof Error && createError.message.trim()) {
        setError(createError.message);
      } else {
        setError(text.adminRestaurant.createError);
      }
    } finally {
      setIsSavingRestaurant(false);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="storefront-outline" size={18} color="#ffffff" />
          </View>
          <Text style={styles.uploadTitle}>{text.adminRestaurant.title}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {text.adminRestaurant.newRestaurant}
          </Text>
        </View>
      </View>

      <View style={styles.introStrip}>
        <Text style={styles.uploadSubtitle}>{text.adminRestaurant.subtitle}</Text>
      </View>

      <View style={styles.body}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.fieldBlock}>
          <Text style={styles.uploadFieldTitle}>
            {text.adminRestaurant.newRestaurant}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={text.adminRestaurant.namePlaceholder}
            placeholderTextColor="#a98a8d"
            value={restaurantName}
            onChangeText={setRestaurantName}
          />
          <TextInput
            style={styles.input}
            placeholder={text.adminRestaurant.addressPlaceholder}
            placeholderTextColor="#a98a8d"
            value={restaurantAddress}
            onChangeText={setRestaurantAddress}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.primaryButton,
            isSavingRestaurant && styles.buttonDisabled,
          ]}
          disabled={isSavingRestaurant}
          onPress={() => {
            void onCreateRestaurant();
          }}
        >
          <Text style={styles.primaryButtonText}>
            {isSavingRestaurant
              ? text.adminRestaurant.creating
              : text.adminRestaurant.createButton}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
