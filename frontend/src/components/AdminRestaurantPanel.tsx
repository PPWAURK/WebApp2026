import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  createRestaurant,
  fetchRestaurants,
} from '../services/restaurantsApi';
import {
  assignUserRestaurant,
  fetchUnassignedUsers,
  type UnassignedUser,
} from '../services/usersApi';
import type { AppText } from '../locales/translations';
import { styles } from '../styles/appStyles';
import type { Restaurant } from '../types/auth';

type AdminRestaurantPanelProps = {
  accessToken: string;
  text: AppText;
};

export function AdminRestaurantPanel({ accessToken, text }: AdminRestaurantPanelProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [restaurantData, unassigned] = await Promise.all([
        fetchRestaurants(),
        fetchUnassignedUsers(accessToken),
      ]);

      setRestaurants(restaurantData);
      setUnassignedUsers(unassigned);

      if (restaurantData.length > 0) {
        setSelectedRestaurantId((current) => current ?? restaurantData[0].id);
      }

      if (unassigned.length > 0) {
        setSelectedUserId((current) => current ?? unassigned[0].id);
      }
    } catch {
      setError(text.adminRestaurant.loadError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [accessToken]);

  const selectedUser = useMemo(
    () => unassignedUsers.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, unassignedUsers],
  );

  async function onCreateRestaurant() {
    setIsSavingRestaurant(true);
    setError(null);

    try {
      const created = await createRestaurant(accessToken, {
        name: restaurantName,
        address: restaurantAddress,
      });
      setRestaurants((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedRestaurantId(created.id);
      setRestaurantName('');
      setRestaurantAddress('');
    } catch {
      setError(text.adminRestaurant.createError);
    } finally {
      setIsSavingRestaurant(false);
    }
  }

  async function onAssignUser() {
    if (!selectedUser || !selectedRestaurantId) {
      return;
    }

    setIsAssigning(true);
    setError(null);
    try {
      await assignUserRestaurant(accessToken, selectedUser.id, selectedRestaurantId);
      const nextUsers = unassignedUsers.filter((user) => user.id !== selectedUser.id);
      setUnassignedUsers(nextUsers);
      setSelectedUserId(nextUsers[0]?.id ?? null);
    } catch {
      setError(text.adminRestaurant.assignError);
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{text.adminRestaurant.title}</Text>
      <Text style={styles.uploadSubtitle}>
        {text.adminRestaurant.subtitle}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.uploadFieldTitle}>{text.adminRestaurant.newRestaurant}</Text>
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
        style={[styles.primaryButton, isSavingRestaurant && styles.buttonDisabled]}
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

      <Text style={styles.uploadFieldTitle}>{text.adminRestaurant.unassignedEmployees}</Text>
      <View style={styles.uploadChipWrap}>
        {unassignedUsers.map((user) => (
          <Pressable
            key={user.id}
            style={[
              styles.uploadChip,
              selectedUserId === user.id && styles.uploadChipActive,
            ]}
            onPress={() => setSelectedUserId(user.id)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedUserId === user.id && styles.uploadChipTextActive,
              ]}
            >
              {user.name ?? user.email}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.uploadFieldTitle}>{text.adminRestaurant.assignToRestaurant}</Text>
      <View style={styles.uploadChipWrap}>
        {restaurants.map((restaurant) => (
          <Pressable
            key={restaurant.id}
            style={[
              styles.uploadChip,
              selectedRestaurantId === restaurant.id && styles.uploadChipActive,
            ]}
            onPress={() => setSelectedRestaurantId(restaurant.id)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedRestaurantId === restaurant.id && styles.uploadChipTextActive,
              ]}
            >
              {restaurant.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {unassignedUsers.length === 0 ? (
        <Text style={styles.docEmpty}>
          {isLoading ? text.adminRestaurant.loading : text.adminRestaurant.allAssigned}
        </Text>
      ) : null}

      <Pressable
        style={[styles.secondaryButton, (isAssigning || !selectedUser || !selectedRestaurantId) && styles.buttonDisabled]}
        disabled={isAssigning || !selectedUser || !selectedRestaurantId}
        onPress={() => {
          void onAssignUser();
        }}
      >
        <Text style={styles.secondaryButtonText}>
          {isAssigning
            ? text.adminRestaurant.assigning
            : text.adminRestaurant.assignButton}
        </Text>
      </Pressable>
    </View>
  );
}
