import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { sectionsByModule } from '../constants/documentTaxonomy';
import { fetchRestaurants } from '../services/restaurantsApi';
import {
  fetchTrainingAccessUsers,
  updateUserManagerRole,
  updateUserTrainingAccess,
  type TrainingAccessUser,
} from '../services/usersApi';
import { styles } from '../styles/appStyles';
import type { Restaurant, TrainingSection, User } from '../types/auth';

type AdminTrainingAccessPanelProps = {
  accessToken: string;
  currentUser: User;
};

const allSections = Object.values(sectionsByModule)
  .flat()
  .map((option) => ({
    key: option.key as TrainingSection,
    label: option.label,
  }));

export function AdminTrainingAccessPanel({
  accessToken,
  currentUser,
}: AdminTrainingAccessPanelProps) {
  const canManageRoles = currentUser.role === 'ADMIN';
  const canFilterRestaurant = currentUser.role === 'ADMIN';
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    null,
  );
  const [isRestaurantListOpen, setIsRestaurantListOpen] = useState(false);
  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draftSections, setDraftSections] = useState<TrainingSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingRoleUserId, setIsUpdatingRoleUserId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    if (canFilterRestaurant) {
      void fetchRestaurants()
        .then((result) => {
          if (!isActive) {
            return;
          }

          setRestaurants(result);
          const firstRestaurant = result[0];
          if (firstRestaurant) {
            setSelectedRestaurantId(firstRestaurant.id);
          }
        })
        .catch((requestError) => {
          if (isActive) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : 'Cannot load restaurants',
            );
          }
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });
    } else {
      const managerRestaurant = currentUser.restaurant;
      if (!managerRestaurant) {
        setError('Manager must be assigned to a restaurant');
        setIsLoading(false);
      } else {
        setRestaurants([managerRestaurant]);
        setSelectedRestaurantId(managerRestaurant.id);
        setIsLoading(false);
      }
    }

    return () => {
      isActive = false;
    };
  }, [accessToken, canFilterRestaurant, currentUser.restaurant]);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setUsers([]);
      setSelectedUserId(null);
      setDraftSections([]);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    void fetchTrainingAccessUsers(accessToken, {
      restaurantId: selectedRestaurantId,
    })
      .then((result) => {
        if (!isActive) {
          return;
        }

        const filteredResult =
          currentUser.role === 'MANAGER'
            ? result.filter((user) => user.role !== 'MANAGER')
            : result;

        setUsers(filteredResult);
        const firstUser = filteredResult[0];
        if (firstUser) {
          setSelectedUserId(firstUser.id);
          setDraftSections(firstUser.trainingAccess);
        } else {
          setSelectedUserId(null);
          setDraftSections([]);
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Cannot load users',
          );
          setUsers([]);
          setSelectedUserId(null);
          setDraftSections([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, currentUser.role, selectedRestaurantId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );
  const sectionLabelByKey = useMemo(
    () =>
      Object.fromEntries(
        allSections.map((section) => [section.key, section.label]),
      ) as Record<TrainingSection, string>,
    [],
  );
  const selectedRestaurant =
    restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null;

  function toggleSection(section: TrainingSection) {
    setDraftSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  }

  async function saveAccess() {
    if (!selectedUser) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserTrainingAccess(
        accessToken,
        selectedUser.id,
        draftSections,
      );
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cannot save access');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleManagerRole(user: TrainingAccessUser) {
    if (!canManageRoles) {
      return;
    }

    setIsUpdatingRoleUserId(user.id);
    setError(null);
    try {
      const updated = await updateUserManagerRole(accessToken, user.id, {
        isManager: user.role !== 'MANAGER',
        restaurantId: selectedRestaurantId ?? undefined,
      });

      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Cannot update manager role',
      );
    } finally {
      setIsUpdatingRoleUserId(null);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>Training Access Manager</Text>
      <Text style={styles.uploadSubtitle}>
        Configure which formation sections each user can view.
      </Text>

      <Text style={styles.uploadFieldTitle}>Restaurant</Text>
      <View style={styles.restaurantSelectWrap}>
        <Pressable
          style={styles.restaurantSelectTrigger}
          onPress={() => {
            if (canFilterRestaurant) {
              setIsRestaurantListOpen((currentValue) => !currentValue);
            }
          }}
        >
          <Text style={styles.restaurantSelectTriggerText}>
            {selectedRestaurant?.name ?? 'Choose a restaurant'}
          </Text>
          <Text style={styles.restaurantSelectChevron}>
            {isRestaurantListOpen ? '▲' : '▼'}
          </Text>
        </Pressable>

        {isRestaurantListOpen && canFilterRestaurant ? (
          <View style={styles.restaurantSelectList}>
            {restaurants.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                style={[
                  styles.restaurantSelectItem,
                  selectedRestaurantId === restaurant.id &&
                    styles.restaurantSelectItemActive,
                ]}
                onPress={() => {
                  setSelectedRestaurantId(restaurant.id);
                  setIsRestaurantListOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.restaurantSelectItemText,
                    selectedRestaurantId === restaurant.id &&
                      styles.restaurantSelectItemTextActive,
                  ]}
                >
                  {restaurant.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.uploadFieldTitle}>Employees and access labels</Text>
      <View style={styles.docBlock}>
        {users.length === 0 ? (
          <Text style={styles.docEmpty}>{isLoading ? 'Loading...' : 'No employee in this restaurant.'}</Text>
        ) : (
          users.map((user) => (
            <Pressable
              key={user.id}
              style={[
                styles.docItem,
                selectedUserId === user.id && styles.trainingTabActive,
              ]}
              onPress={() => {
                setSelectedUserId(user.id);
                setDraftSections(user.trainingAccess);
              }}
            >
              <Text
                style={[
                  styles.docItemTitle,
                  selectedUserId === user.id && styles.trainingTabTextActive,
                ]}
              >
                {user.name ?? user.email} ({user.role})
              </Text>
              <View style={styles.uploadChipWrap}>
                {user.trainingAccess.length === 0 ? (
                  <Text
                    style={[
                      styles.docEmpty,
                      selectedUserId === user.id && styles.trainingTabTextActive,
                    ]}
                  >
                    Aucun acces / 无权限
                  </Text>
                ) : (
                  user.trainingAccess.map((section) => (
                    <Text
                      key={`${user.id}-${section}`}
                      style={[
                        styles.pill,
                        selectedUserId === user.id && styles.trainingTabTextActive,
                      ]}
                    >
                      {sectionLabelByKey[section]}
                    </Text>
                  ))
                )}
              </View>

              {canManageRoles ? (
                <Pressable
                  style={[
                    styles.secondaryButton,
                    isUpdatingRoleUserId === user.id && styles.buttonDisabled,
                  ]}
                  disabled={isUpdatingRoleUserId === user.id}
                  onPress={() => {
                    void toggleManagerRole(user);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>
                    {user.role === 'MANAGER'
                      ? 'Retirer manager'
                      : 'Definir manager'}
                  </Text>
                </Pressable>
              ) : null}
            </Pressable>
          ))
        )}
      </View>

      <Text style={styles.uploadFieldTitle}>User</Text>
      <View style={styles.uploadChipWrap}>
        {users.map((user) => (
          <Pressable
            key={user.id}
            style={[
              styles.uploadChip,
              selectedUserId === user.id && styles.uploadChipActive,
            ]}
            onPress={() => {
              setSelectedUserId(user.id);
              setDraftSections(user.trainingAccess);
            }}
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

      <Text style={styles.uploadFieldTitle}>Allowed Sections</Text>
      <View style={styles.uploadChipWrap}>
        {allSections.map((section) => (
          <Pressable
            key={section.key}
            style={[
              styles.uploadChip,
              draftSections.includes(section.key) && styles.uploadChipActive,
            ]}
            onPress={() => toggleSection(section.key)}
          >
            <Text
              style={[
                styles.uploadChipText,
                draftSections.includes(section.key) && styles.uploadChipTextActive,
              ]}
            >
              {section.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.primaryButton, (isSaving || isLoading) && styles.buttonDisabled]}
        disabled={isSaving || isLoading || !selectedUser}
        onPress={() => {
          void saveAccess();
        }}
      >
        <Text style={styles.primaryButtonText}>
          {isSaving ? 'Saving access...' : 'Save access'}
        </Text>
      </Pressable>
    </View>
  );
}
