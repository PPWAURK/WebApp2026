import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { getSectionsByModule } from '../../constants/documentTaxonomy';
import type { AppText } from '../../locales/translations';
import { fetchRestaurants } from '../../services/restaurantsApi';
import {
  approveUserAccount,
  fetchTrainingAccessByLevel,
  fetchTrainingAccessUsers,
  confirmUserProbation,
  updateTrainingAccessByLevel,
  updateUserManagerRole,
  type TrainingAccessUser,
  type TrainingAccessByLevelProfile,
} from '../../services/usersApi';
import { styles } from './AdminTrainingAccessPanel.styles';
import type {
  EmployeeLevel,
  Restaurant,
  TrainingSection,
  User,
} from '../../types/auth';

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
  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<EmployeeLevel | null>(null);
  const [levelProfiles, setLevelProfiles] = useState<TrainingAccessByLevelProfile[]>([]);
  const [draftSections, setDraftSections] = useState<TrainingSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingProbationUserId, setIsConfirmingProbationUserId] = useState<number | null>(
    null,
  );
  const [isApprovingUserId, setIsApprovingUserId] = useState<number | null>(null);
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
    if (currentUser.role !== 'ADMIN') {
      setLevelProfiles([]);
      return;
    }

    let isActive = true;

    void fetchTrainingAccessByLevel(accessToken)
      .then((profiles) => {
        if (!isActive) {
          return;
        }

        setLevelProfiles(profiles);
      })
      .catch(() => {
        if (isActive) {
          setError(text.adminTraining.loadLevelProfilesError);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, currentUser.role, text.adminTraining.loadLevelProfilesError]);

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
        } else {
          setSelectedUserId(null);
        }
      })
      .catch(() => {
        if (isActive) {
          setError(text.adminTraining.loadUsersError);
          setUsers([]);
          setSelectedUserId(null);
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

  const levelOptions = useMemo(() => {
    const levels = Array.from(new Set(levelProfiles.map((profile) => profile.employeeLevel)));
    return levels.sort((left, right) => left.localeCompare(right));
  }, [levelProfiles]);

  const sectionProfileByLevel = useMemo(() => {
    const profile = new Map<EmployeeLevel, TrainingSection[]>();

    for (const entry of levelProfiles) {
      profile.set(entry.employeeLevel, entry.sections ?? []);
    }

    return profile;
  }, [levelProfiles]);

  useEffect(() => {
    if (levelOptions.length === 0) {
      setSelectedLevel(null);
      setDraftSections([]);
      return;
    }

    setSelectedLevel((current) =>
      current && levelOptions.includes(current) ? current : levelOptions[0],
    );
  }, [levelOptions]);

  useEffect(() => {
    if (!selectedLevel) {
      setDraftSections([]);
      return;
    }

    setDraftSections(sectionProfileByLevel.get(selectedLevel) ?? []);
  }, [sectionProfileByLevel, selectedLevel]);

  const sectionLabelByKey = useMemo(
    () =>
      Object.fromEntries(
        allSections.map((section) => [section.key, section.label]),
      ) as Record<TrainingSection, string>,
    [allSections],
  );

  function toggleSection(section: TrainingSection) {
    setDraftSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  }

  async function saveAccess() {
    if (!selectedLevel) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updatedProfile = await updateTrainingAccessByLevel(
        accessToken,
        selectedLevel,
        draftSections,
      );

      setLevelProfiles((current) =>
        current.some((entry) => entry.employeeLevel === updatedProfile.employeeLevel)
          ? current.map((entry) =>
              entry.employeeLevel === updatedProfile.employeeLevel ? updatedProfile : entry,
            )
          : [...current, updatedProfile],
      );

      setUsers((current) =>
        current.map((user) =>
          user.employeeLevel === selectedLevel
            ? {
                ...user,
                trainingAccess: updatedProfile.sections,
              }
            : user,
        ),
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

  async function handleApproveAccount(user: TrainingAccessUser) {
    if (user.isApproved) {
      return;
    }

    const confirmationMessage = text.adminTraining.approveAccountMessage;
    const confirmed =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.confirm(confirmationMessage)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              text.adminTraining.approveAccountButton,
              confirmationMessage,
              [
                {
                  text: text.adminTraining.approveAccountCancel,
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: text.adminTraining.approveAccountConfirm,
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

    setIsApprovingUserId(user.id);
    setError(null);

    try {
      const updated = await approveUserAccount(accessToken, user.id);
      setUsers((current) =>
        current.map((entry) =>
          entry.id === updated.id
            ? {
                ...entry,
                isApproved: updated.isApproved,
              }
            : entry,
        ),
      );
    } catch {
      setError(text.adminTraining.approveAccountError);
    } finally {
      setIsApprovingUserId(null);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{text.adminTraining.title}</Text>
      <Text style={styles.uploadSubtitle}>{text.adminTraining.subtitle}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.docBlock}>
        {users.length === 0 ? (
          <Text style={styles.docEmpty}>
            {isLoading ? text.adminTraining.loading : text.adminTraining.noEmployee}
          </Text>
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
                  setSelectedLevel(user.employeeLevel);
                  setDraftSections(
                    sectionProfileByLevel.get(user.employeeLevel) ??
                      user.trainingAccess ??
                      [],
                  );
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
                {text.adminTraining.accountStatusLabel}:{' '}
                {user.isApproved
                  ? text.adminTraining.accountStatusValues.approved
                  : text.adminTraining.accountStatusValues.pending}
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

              {user.role === 'EMPLOYEE' ? (
                <Pressable
                  style={[
                    styles.secondaryButton,
                    (user.isApproved || isApprovingUserId === user.id) && styles.buttonDisabled,
                  ]}
                  disabled={user.isApproved || isApprovingUserId === user.id}
                  onPress={() => {
                    void handleApproveAccount(user);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isApprovingUserId === user.id
                      ? text.adminTraining.approveAccountSaving
                      : user.isApproved
                        ? text.adminTraining.approveAccountDone
                        : text.adminTraining.approveAccountButton}
                  </Text>
                </Pressable>
              ) : null}
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

      <Text style={styles.uploadFieldTitle}>{text.adminTraining.levelLabel}</Text>
      <View style={styles.uploadChipWrap}>
        {levelOptions.map((level) => (
          <Pressable
            key={level}
            style={[
              styles.uploadChip,
              selectedLevel === level && styles.uploadChipActive,
            ]}
            onPress={() => {
              setSelectedLevel(level);
              setDraftSections(sectionProfileByLevel.get(level) ?? []);
            }}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedLevel === level && styles.uploadChipTextActive,
              ]}
            >
              {text.dashboard.levels[level]}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedLevel ? (
        <Text style={styles.docItemMeta}>
          {text.adminTraining.levelScopePrefix}{' '}
          {users.filter((user) => user.employeeLevel === selectedLevel).length}{' '}
          {text.adminTraining.levelScopeSuffix}
        </Text>
      ) : null}

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
        disabled={isSaving || isLoading || !selectedLevel}
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
