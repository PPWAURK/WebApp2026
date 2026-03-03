import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  createRestaurant,
  fetchRestaurants,
} from '../../services/restaurantsApi';
import {
  assignUserRestaurant,
  fetchTrainingAccessUsers,
  type TrainingAccessUser,
} from '../../services/usersApi';
import type { AppText } from '../../locales/translations';
import { styles } from './AdminRestaurantPanel.styles';
import type { Restaurant } from '../../types/auth';

type AdminRestaurantPanelProps = {
  accessToken: string;
  text: AppText;
};

export function AdminRestaurantPanel({ accessToken, text }: AdminRestaurantPanelProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [employeeUsers, setEmployeeUsers] = useState<TrainingAccessUser[]>([]);
  const [selectedTransferUserId, setSelectedTransferUserId] = useState<number | null>(null);
  const [transferSearch, setTransferSearch] = useState('');
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
      const [restaurantData, trainingUsers] = await Promise.all([
        fetchRestaurants(),
        fetchTrainingAccessUsers(accessToken),
      ]);

      const allUsers = trainingUsers.filter((entry) => entry.role !== 'ADMIN');

      setRestaurants(restaurantData);
      setEmployeeUsers(allUsers);

      if (restaurantData.length > 0) {
        setSelectedRestaurantId((current) => current ?? restaurantData[0].id);
      }

      if (allUsers.length > 0) {
        setSelectedTransferUserId((current) => current ?? allUsers[0].id);
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

  const visibleTransferUsers = useMemo(() => {
    const query = transferSearch.trim().toLowerCase();

    if (!query) {
      return employeeUsers;
    }

    return employeeUsers.filter((entry) => {
      const name = entry.name?.toLowerCase() ?? '';
      return name.includes(query) || entry.email.toLowerCase().includes(query);
    });
  }, [employeeUsers, transferSearch]);

  const selectedTransferUser = useMemo(
    () => employeeUsers.find((entry) => entry.id === selectedTransferUserId) ?? null,
    [employeeUsers, selectedTransferUserId],
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

  async function onTransferUser() {
    if (!selectedTransferUser || !selectedRestaurantId) {
      return;
    }

    setIsAssigning(true);
    setError(null);
    try {
      await assignUserRestaurant(accessToken, selectedTransferUser.id, selectedRestaurantId);

      setEmployeeUsers((current) =>
        current.map((entry) =>
          entry.id === selectedTransferUser.id
            ? {
                ...entry,
                restaurantId: selectedRestaurantId,
                restaurant:
                  restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ??
                  entry.restaurant,
              }
            : entry,
        ),
      );
    } catch {
      setError(text.adminRestaurant.transferError);
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

      <Text style={styles.uploadFieldTitle}>{text.adminRestaurant.transferEmployees}</Text>
      <TextInput
        style={styles.input}
        placeholder={text.adminRestaurant.transferSearchPlaceholder}
        placeholderTextColor="#a98a8d"
        value={transferSearch}
        onChangeText={setTransferSearch}
      />

      <View style={styles.uploadChipWrap}>
        {visibleTransferUsers.map((entry) => (
          <Pressable
            key={entry.id}
            style={[
              styles.uploadChip,
              selectedTransferUserId === entry.id && styles.uploadChipActive,
            ]}
            onPress={() => setSelectedTransferUserId(entry.id)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedTransferUserId === entry.id && styles.uploadChipTextActive,
              ]}
            >
              {entry.name ?? entry.email}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedTransferUser ? (
        <Text style={styles.docEmpty}>
          {text.adminRestaurant.currentRestaurantLabel}:{' '}
          {selectedTransferUser.restaurant?.name ?? text.adminRestaurant.unassignedLabel}
        </Text>
      ) : null}

      <Pressable
        style={[
          styles.secondaryButton,
          (isAssigning || !selectedTransferUser || !selectedRestaurantId) && styles.buttonDisabled,
        ]}
        disabled={isAssigning || !selectedTransferUser || !selectedRestaurantId}
        onPress={() => {
          void onTransferUser();
        }}
      >
        <Text style={styles.secondaryButtonText}>
          {isAssigning ? text.adminRestaurant.transferring : text.adminRestaurant.transferButton}
        </Text>
      </Pressable>
    </View>
  );
}
