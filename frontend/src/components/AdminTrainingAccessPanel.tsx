import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { getSectionsByModule } from '../constants/documentTaxonomy';
import type { AppText } from '../locales/translations';
import { fetchRestaurants } from '../services/restaurantsApi';
import {
  fetchTrainingAccessUsers,
  confirmUserProbation,
  updateUserManagerRole,
  updateUserTrainingAccess,
  type TrainingAccessUser,
} from '../services/usersApi';
import { styles } from '../styles/appStyles';
import type { Restaurant, TrainingSection, User } from '../types/auth';

type AdminTrainingAccessPanelProps = {
  accessToken: string;
  currentUser: User;
  text: AppText;
};

export function AdminTrainingAccessPanel({
  accessToken,
  currentUser,
  text,
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
  const [isConfirmingProbationUserId, setIsConfirmingProbationUserId] = useState<number | null>(
    null,
  );
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isUpdatingRoleUserId, setIsUpdatingRoleUserId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const allSections = useMemo(
    () =>
      Object.values(getSectionsByModule(text))
        .flat()
        .map((option) => ({
          key: option.key as TrainingSection,
          label: option.label,
        })),
    [text],
  );

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
        .catch(() => {
          if (isActive) {
            setError(text.adminTraining.loadRestaurantsError);
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
        setError(text.adminTraining.managerRestaurantRequired);
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
  }, [
    canFilterRestaurant,
    currentUser.restaurant,
    text.adminTraining.loadRestaurantsError,
    text.adminTraining.managerRestaurantRequired,
  ]);

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

        const normalizedUsers = filteredResult.map((user) => ({
          ...user,
          trainingAccess: user.trainingAccess ?? [],
        }));

        setUsers(normalizedUsers);
        const firstUser = normalizedUsers[0];
        if (firstUser) {
          setSelectedUserId(firstUser.id);
          setDraftSections(firstUser.trainingAccess ?? []);
        } else {
          setSelectedUserId(null);
          setDraftSections([]);
        }
      })
      .catch(() => {
        if (isActive) {
          setError(text.adminTraining.loadUsersError);
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
  }, [
    accessToken,
    currentUser.role,
    selectedRestaurantId,
    text.adminTraining.loadUsersError,
  ]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const sectionLabelByKey = useMemo(
    () =>
      Object.fromEntries(
        allSections.map((section) => [section.key, section.label]),
      ) as Record<TrainingSection, string>,
    [allSections],
  );

  const selectedRestaurant =
    restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null;

  const visibleUsers = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const name = user.name?.toLowerCase() ?? '';
      const email = user.email.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [employeeSearch, users]);

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
    } catch {
      setError(text.adminTraining.saveError);
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

      const normalizedUpdated = {
        ...updated,
        trainingAccess: updated.trainingAccess ?? [],
      };

      setUsers((current) =>
        current.map((item) =>
          item.id === normalizedUpdated.id ? normalizedUpdated : item,
        ),
      );
    } catch {
      setError(text.adminTraining.updateManagerError);
    } finally {
      setIsUpdatingRoleUserId(null);
    }
  }

  async function handleConfirmProbation(user: TrainingAccessUser) {
    if (!user.isOnProbation) {
      return;
    }

    const confirmationMessage = text.adminTraining.confirmProbationMessage;
    const confirmed =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.confirm(confirmationMessage)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              text.adminTraining.confirmProbationButton,
              confirmationMessage,
              [
                {
                  text: text.adminTraining.confirmProbationCancel,
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: text.adminTraining.confirmProbationConfirm,
                  style: 'destructive',
                  onPress: () => resolve(true),
                },
              ],
              { cancelable: true, onDismiss: () => resolve(false) },
            );
          });

    if (!confirmed) {
      return;
    }

    setIsConfirmingProbationUserId(user.id);
    setError(null);

    try {
      const updated = await confirmUserProbation(accessToken, user.id);
      setUsers((current) =>
        current.map((entry) =>
          entry.id === updated.id
            ? {
                ...entry,
                isOnProbation: updated.isOnProbation,
              }
            : entry,
        ),
      );
    } catch {
      setError(text.adminTraining.confirmProbationError);
    } finally {
      setIsConfirmingProbationUserId(null);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{text.adminTraining.title}</Text>
      <Text style={styles.uploadSubtitle}>{text.adminTraining.subtitle}</Text>

      <Text style={styles.uploadFieldTitle}>{text.adminTraining.restaurantLabel}</Text>
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
            {selectedRestaurant?.name ?? text.adminTraining.restaurantPlaceholder}
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

      <Text style={styles.uploadFieldTitle}>{text.adminTraining.usersAndLabels}</Text>
      <TextInput
        style={styles.input}
        placeholder={text.adminTraining.searchEmployeePlaceholder}
        placeholderTextColor="#a98a8d"
        value={employeeSearch}
        onChangeText={setEmployeeSearch}
      />
      <View style={styles.docBlock}>
        {users.length === 0 ? (
          <Text style={styles.docEmpty}>
            {isLoading ? text.adminTraining.loading : text.adminTraining.noEmployee}
          </Text>
        ) : visibleUsers.length === 0 ? (
          <Text style={styles.docEmpty}>{text.adminTraining.noEmployeeMatch}</Text>
        ) : (
          visibleUsers.map((user) => (
            <Pressable
              key={user.id}
              style={[
                styles.docItem,
                selectedUserId === user.id && styles.trainingTabActive,
              ]}
              onPress={() => {
                setSelectedUserId(user.id);
                setDraftSections(user.trainingAccess ?? []);
              }}
            >
              <Text
                style={[
                  styles.docItemTitle,
                  selectedUserId === user.id && styles.trainingTabTextActive,
                ]}
              >
                {user.name ?? user.email} ({text.adminTraining.roleValues[user.role]})
              </Text>
              <Text
                style={[
                  styles.docItemMeta,
                  selectedUserId === user.id && styles.trainingTabTextActive,
                ]}
              >
                {text.adminTraining.probationStatusLabel}:{' '}
                {user.isOnProbation
                  ? text.adminTraining.probationValues.probation
                  : text.adminTraining.probationValues.official}
              </Text>
              <View style={styles.uploadChipWrap}>
                {(user.trainingAccess ?? []).length === 0 ? (
                  <Text
                    style={[
                      styles.docEmpty,
                      selectedUserId === user.id && styles.trainingTabTextActive,
                    ]}
                  >
                    {text.adminTraining.noAccess}
                  </Text>
                ) : (
                  (user.trainingAccess ?? []).map((section) => (
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

              {user.role === 'EMPLOYEE' ? (
                <Pressable
                  style={[
                    styles.secondaryButton,
                    (!user.isOnProbation || isConfirmingProbationUserId === user.id) &&
                      styles.buttonDisabled,
                  ]}
                  disabled={!user.isOnProbation || isConfirmingProbationUserId === user.id}
                  onPress={() => {
                    void handleConfirmProbation(user);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isConfirmingProbationUserId === user.id
                      ? text.adminTraining.confirmProbationSaving
                      : user.isOnProbation
                        ? text.adminTraining.confirmProbationButton
                        : text.adminTraining.confirmProbationDone}
                  </Text>
                </Pressable>
              ) : null}

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
                      ? text.adminTraining.removeManager
                      : text.adminTraining.defineManager}
                  </Text>
                </Pressable>
              ) : null}
            </Pressable>
          ))
        )}
      </View>

      <Text style={styles.uploadFieldTitle}>{text.adminTraining.userLabel}</Text>
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
              setDraftSections(user.trainingAccess ?? []);
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

      <Text style={styles.uploadFieldTitle}>{text.adminTraining.allowedSections}</Text>
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
          {isSaving ? text.adminTraining.saving : text.adminTraining.save}
        </Text>
      </Pressable>
    </View>
  );
}
