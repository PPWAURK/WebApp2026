import { useState } from 'react';
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
      <Text style={styles.uploadTitle}>{text.adminRestaurant.title}</Text>
      <Text style={styles.uploadSubtitle}>{text.adminRestaurant.subtitle}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
  );
}
