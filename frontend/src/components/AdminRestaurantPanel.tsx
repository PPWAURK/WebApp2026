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
import { styles } from '../styles/appStyles';
import type { Restaurant } from '../types/auth';

type AdminRestaurantPanelProps = {
  accessToken: string;
};

export function AdminRestaurantPanel({ accessToken }: AdminRestaurantPanelProps) {
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cannot load restaurant data');
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cannot create restaurant');
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cannot assign user');
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>Restaurant Manager</Text>
      <Text style={styles.uploadSubtitle}>
        Create restaurants and assign employees still not attached to an establishment.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.uploadFieldTitle}>New Restaurant</Text>
      <TextInput
        style={styles.input}
        placeholder="Restaurant name"
        placeholderTextColor="#a98a8d"
        value={restaurantName}
        onChangeText={setRestaurantName}
      />
      <TextInput
        style={styles.input}
        placeholder="Restaurant address"
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
          {isSavingRestaurant ? 'Creating...' : 'Add restaurant'}
        </Text>
      </Pressable>

      <Text style={styles.uploadFieldTitle}>Unassigned Employees</Text>
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

      <Text style={styles.uploadFieldTitle}>Assign To Restaurant</Text>
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
          {isLoading ? 'Loading...' : 'All employees are already assigned.'}
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
          {isAssigning ? 'Assigning...' : 'Assign selected employee'}
        </Text>
      </Pressable>
    </View>
  );
}
