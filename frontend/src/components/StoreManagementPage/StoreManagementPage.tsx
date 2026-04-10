import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import {
  fetchRestaurants,
  updateRestaurant,
} from '../../services/restaurantsApi';
import {
  approveUserAccount,
  deleteUserAccount,
  fetchTrainingAccessUsers,
  rejectUserAccount,
  updateUserLevel,
  updateUserManagerRole,
  type TrainingAccessUser,
} from '../../services/usersApi';
import type { EmployeeLevel, Restaurant } from '../../types/auth';
import { ConfirmDialog } from '../ConfirmDialog';
import { styles } from './StoreManagementPage.styles';

type StoreManagementPageProps = {
  text: AppText;
  accessToken: string;
};

const EDITABLE_EMPLOYEE_LEVELS: EmployeeLevel[] = [
  'L0_PROBATION',
  'L1_PARTNER',
  'L2_PARTNER',
  'L3_PARTNER',
  'L4_EXCELLENT',
  'L5_PAM',
  'L5_AM',
];

function getDisplayName(
  user: Pick<TrainingAccessUser, 'name' | 'email'>,
  fallbackName: string,
) {
  const trimmedName = user.name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  return user.email.split('@')[0]?.trim() || fallbackName;
}

export function StoreManagementPage({
  text,
  accessToken,
}: StoreManagementPageProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1120;
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    null,
  );
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);
  const [isUpdatingUserId, setIsUpdatingUserId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<TrainingAccessUser | null>(null);
  const [levelEditorUser, setLevelEditorUser] =
    useState<TrainingAccessUser | null>(null);
  const [isApprovingUserId, setIsApprovingUserId] = useState<number | null>(
    null,
  );
  const [isRejectingUserId, setIsRejectingUserId] = useState<number | null>(
    null,
  );
  const [approvingUser, setApprovingUser] =
    useState<TrainingAccessUser | null>(null);
  const [rejectingUser, setRejectingUser] =
    useState<TrainingAccessUser | null>(null);

  useEffect(() => {
    void loadData();
  }, [accessToken]);

  useEffect(() => {
    const selectedRestaurant = restaurants.find(
      (entry) => entry.id === selectedRestaurantId,
    );

    setRestaurantName(selectedRestaurant?.name ?? '');
    setRestaurantAddress(selectedRestaurant?.address ?? '');
  }, [restaurants, selectedRestaurantId]);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [restaurantResult, usersResult] = await Promise.all([
        fetchRestaurants(),
        fetchTrainingAccessUsers(accessToken),
      ]);

      setRestaurants(restaurantResult);
      setUsers(usersResult);
      setSelectedRestaurantId((currentValue) => {
        if (
          currentValue &&
          restaurantResult.some((entry) => entry.id === currentValue)
        ) {
          return currentValue;
        }

        return restaurantResult[0]?.id ?? null;
      });
    } catch {
      setError(text.storeManagement.loadError);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedRestaurant = useMemo(
    () =>
      restaurants.find((entry) => entry.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId],
  );

  const restaurantUsers = useMemo(
    () =>
      users
        .filter(
          (entry) =>
            entry.restaurant?.id === selectedRestaurantId &&
            entry.role !== 'ADMIN' &&
            entry.isApproved,
        )
        .sort((left, right) => {
          if (left.role !== right.role) {
            return left.role === 'MANAGER' ? -1 : 1;
          }

          return getDisplayName(
            left,
            text.dashboard.fallbackName,
          ).localeCompare(getDisplayName(right, text.dashboard.fallbackName));
        }),
    [selectedRestaurantId, text.dashboard.fallbackName, users],
  );

  const pendingApprovalUsers = useMemo(
    () =>
      users
        .filter(
          (entry) =>
            entry.restaurant?.id === selectedRestaurantId &&
            entry.role === 'EMPLOYEE' &&
            !entry.isApproved &&
            entry.isEmailVerified,
        )
        .sort((left, right) =>
          getDisplayName(left, text.dashboard.fallbackName).localeCompare(
            getDisplayName(right, text.dashboard.fallbackName),
          ),
        ),
    [selectedRestaurantId, text.dashboard.fallbackName, users],
  );

  const pendingEmailVerificationUsers = useMemo(
    () =>
      users
        .filter(
          (entry) =>
            entry.restaurant?.id === selectedRestaurantId &&
            entry.role === 'EMPLOYEE' &&
            !entry.isApproved &&
            !entry.isEmailVerified,
        )
        .sort((left, right) =>
          getDisplayName(left, text.dashboard.fallbackName).localeCompare(
            getDisplayName(right, text.dashboard.fallbackName),
          ),
        ),
    [selectedRestaurantId, text.dashboard.fallbackName, users],
  );

  async function handleSaveRestaurant() {
    if (!selectedRestaurant) {
      return;
    }

    setIsSavingRestaurant(true);
    setError(null);

    try {
      const updatedRestaurant = await updateRestaurant(
        accessToken,
        selectedRestaurant.id,
        {
          name: restaurantName,
          address: restaurantAddress,
        },
      );

      setRestaurants((currentValue) =>
        currentValue.map((entry) =>
          entry.id === updatedRestaurant.id ? updatedRestaurant : entry,
        ),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : text.storeManagement.saveError,
      );
    } finally {
      setIsSavingRestaurant(false);
    }
  }

  async function handleUpdateLevel(level: EmployeeLevel) {
    if (!levelEditorUser) {
      return;
    }

    setIsUpdatingUserId(levelEditorUser.id);
    setError(null);

    try {
      const updated = await updateUserLevel(accessToken, levelEditorUser.id, level);

      setUsers((currentValue) =>
        currentValue.map((entry) =>
          entry.id === levelEditorUser.id
            ? {
                ...entry,
                employeeLevel: updated.employeeLevel,
                role: updated.role,
                isOnProbation: updated.isOnProbation,
              }
            : entry,
        ),
      );
      setLevelEditorUser(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : text.storeManagement.levelUpdateError,
      );
    } finally {
      setIsUpdatingUserId(null);
    }
  }

  async function handleToggleManagerRole(entry: TrainingAccessUser) {
    setIsUpdatingUserId(entry.id);
    setError(null);

    try {
      const updated = await updateUserManagerRole(accessToken, entry.id, {
        isManager: entry.role !== 'MANAGER',
      });

      setUsers((currentValue) =>
        currentValue.map((userEntry) =>
          userEntry.id === entry.id
            ? {
                ...userEntry,
                role: updated.role,
                employeeLevel: updated.employeeLevel,
                isOnProbation: updated.isOnProbation,
              }
            : userEntry,
        ),
      );
      if (levelEditorUser?.id === entry.id) {
        setLevelEditorUser(null);
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : text.storeManagement.roleUpdateError,
      );
    } finally {
      setIsUpdatingUserId(null);
    }
  }

  async function handleDeleteUser() {
    if (!deletingUser) {
      return;
    }

    setIsUpdatingUserId(deletingUser.id);
    setError(null);

    try {
      await deleteUserAccount(accessToken, deletingUser.id);
      setUsers((currentValue) =>
        currentValue.filter((entry) => entry.id !== deletingUser.id),
      );
      if (levelEditorUser?.id === deletingUser.id) {
        setLevelEditorUser(null);
      }
      setDeletingUser(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : text.storeManagement.deleteError,
      );
    } finally {
      setIsUpdatingUserId(null);
    }
  }

  async function handleApproveAccount() {
    if (!approvingUser) {
      return;
    }

    setIsApprovingUserId(approvingUser.id);
    setError(null);

    try {
      const updated = await approveUserAccount(accessToken, approvingUser.id);
      setUsers((currentValue) =>
        currentValue.map((entry) =>
          entry.id === updated.id
            ? { ...entry, isApproved: updated.isApproved }
            : entry,
        ),
      );
      setApprovingUser(null);
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : text.adminTraining.approveAccountError,
      );
    } finally {
      setIsApprovingUserId(null);
    }
  }

  async function handleRejectAccount() {
    if (!rejectingUser) {
      return;
    }

    setIsRejectingUserId(rejectingUser.id);
    setError(null);

    try {
      await rejectUserAccount(accessToken, rejectingUser.id);
      setUsers((currentValue) =>
        currentValue.filter((entry) => entry.id !== rejectingUser.id),
      );
      setRejectingUser(null);
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : text.adminTraining.rejectAccountError,
      );
    } finally {
      setIsRejectingUserId(null);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{text.storeManagement.title}</Text>
        <Text style={styles.subtitle}>{text.storeManagement.subtitle}</Text>
        {error ? <Text style={styles.statusText}>{error}</Text> : null}
      </View>

      <View style={[styles.grid, isWideLayout && styles.gridWide]}>
        <View style={[styles.column, styles.leftColumn]}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{text.storeManagement.selectTitle}</Text>
            <Text style={styles.cardSubtitle}>
              {text.storeManagement.selectSubtitle}
            </Text>
            {isLoading ? (
              <Text style={styles.emptyText}>{text.storeManagement.loading}</Text>
            ) : restaurants.length === 0 ? (
              <Text style={styles.emptyText}>
                {text.storeManagement.noRestaurants}
              </Text>
            ) : (
              <View style={styles.restaurantSelectorWrap}>
                {restaurants.map((entry) => (
                  <Pressable
                    key={entry.id}
                    style={[
                      styles.restaurantChip,
                      selectedRestaurantId === entry.id &&
                        styles.restaurantChipActive,
                    ]}
                    onPress={() => setSelectedRestaurantId(entry.id)}
                  >
                    <Text
                      style={[
                        styles.restaurantChipText,
                        selectedRestaurantId === entry.id &&
                          styles.restaurantChipTextActive,
                      ]}
                    >
                      {entry.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{text.storeManagement.infoTitle}</Text>
            <Text style={styles.cardSubtitle}>
              {text.storeManagement.infoSubtitle}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{text.storeManagement.nameLabel}</Text>
              <TextInput
                value={restaurantName}
                onChangeText={setRestaurantName}
                editable={selectedRestaurant !== null && !isSavingRestaurant}
                placeholder={text.storeManagement.namePlaceholder}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {text.storeManagement.addressLabel}
              </Text>
              <TextInput
                value={restaurantAddress}
                onChangeText={setRestaurantAddress}
                editable={selectedRestaurant !== null && !isSavingRestaurant}
                placeholder={text.storeManagement.addressPlaceholder}
                multiline
                style={[styles.input, styles.multilineInput]}
              />
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                (selectedRestaurant === null || isSavingRestaurant) &&
                  styles.primaryButtonDisabled,
              ]}
              disabled={selectedRestaurant === null || isSavingRestaurant}
              onPress={() => {
                void handleSaveRestaurant();
              }}
            >
              <Text style={styles.primaryButtonText}>
                {isSavingRestaurant
                  ? text.storeManagement.saving
                  : text.storeManagement.save}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.column, styles.rightColumn]}>
          <View style={styles.card}>
            <View style={styles.pendingHeader}>
              <Text style={styles.cardTitle}>
                {text.storeManagement.pendingTitle}
              </Text>
              <View style={styles.pendingCountBadge}>
                <Text style={styles.pendingCountText}>
                  {pendingApprovalUsers.length +
                    pendingEmailVerificationUsers.length}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              {text.storeManagement.pendingSubtitle}
            </Text>

            {isLoading ? (
              <Text style={styles.emptyText}>
                {text.storeManagement.loading}
              </Text>
            ) : !selectedRestaurant ? (
              <Text style={styles.emptyText}>
                {text.storeManagement.noRestaurantSelected}
              </Text>
            ) : pendingApprovalUsers.length === 0 &&
              pendingEmailVerificationUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                {text.storeManagement.noPendingAccounts}
              </Text>
            ) : (
              <>
                {pendingApprovalUsers.length > 0 ? (
                  <View style={styles.pendingSection}>
                    <Text style={styles.pendingSectionTitle}>
                      {text.storeManagement.pendingApprovalSectionTitle}
                    </Text>
                    {pendingApprovalUsers.map((entry) => (
                      <View key={entry.id} style={styles.userCard}>
                        <View style={styles.userHeader}>
                          <View style={styles.userIdentity}>
                            <Text style={styles.userName}>
                              {getDisplayName(entry, text.dashboard.fallbackName)}
                            </Text>
                            <Text style={styles.userEmail}>{entry.email}</Text>
                          </View>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              {text.adminTraining.accountStatusValues.pending}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.actionsWrap}>
                          <Pressable
                            style={[styles.secondaryButton, styles.dangerButton]}
                            disabled={
                              isApprovingUserId === entry.id ||
                              isRejectingUserId === entry.id
                            }
                            onPress={() => setRejectingUser(entry)}
                          >
                            <Text
                              style={[
                                styles.secondaryButtonText,
                                styles.dangerButtonText,
                              ]}
                            >
                              {text.adminTraining.rejectAccountButton}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.primaryButton,
                              styles.inlinePrimaryButton,
                              (isApprovingUserId === entry.id ||
                                isRejectingUserId === entry.id) &&
                                styles.primaryButtonDisabled,
                            ]}
                            disabled={
                              isApprovingUserId === entry.id ||
                              isRejectingUserId === entry.id
                            }
                            onPress={() => setApprovingUser(entry)}
                          >
                            <Text style={styles.primaryButtonText}>
                              {isApprovingUserId === entry.id
                                ? text.adminTraining.approveAccountSaving
                                : text.adminTraining.approveAccountButton}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {pendingEmailVerificationUsers.length > 0 ? (
                  <View style={styles.pendingSection}>
                    <Text style={styles.pendingSectionTitle}>
                      {text.storeManagement.pendingEmailSectionTitle}
                    </Text>
                    {pendingEmailVerificationUsers.map((entry) => (
                      <View key={entry.id} style={styles.userCard}>
                        <View style={styles.userHeader}>
                          <View style={styles.userIdentity}>
                            <Text style={styles.userName}>
                              {getDisplayName(entry, text.dashboard.fallbackName)}
                            </Text>
                            <Text style={styles.userEmail}>{entry.email}</Text>
                          </View>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              {
                                text.adminTraining.accountStatusValues
                                  .emailVerificationPending
                              }
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardSubtitle}>
                          {text.storeManagement.pendingEmailHint}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{text.storeManagement.accountsTitle}</Text>
            <Text style={styles.cardSubtitle}>
              {text.storeManagement.accountsSubtitle}
            </Text>

            {isLoading ? (
              <Text style={styles.emptyText}>{text.storeManagement.loading}</Text>
            ) : !selectedRestaurant ? (
              <Text style={styles.emptyText}>
                {text.storeManagement.noRestaurantSelected}
              </Text>
            ) : restaurantUsers.length === 0 ? (
              <Text style={styles.emptyText}>{text.storeManagement.noAccounts}</Text>
            ) : (
              restaurantUsers.map((entry) => (
                <View key={entry.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View>
                      <Text style={styles.userName}>
                        {getDisplayName(entry, text.dashboard.fallbackName)}
                      </Text>
                      <Text style={styles.userEmail}>{entry.email}</Text>
                    </View>

                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {text.dashboard.roleValues[entry.role]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailText}>
                      {`${text.storeManagement.levelLabel}: ${text.dashboard.levels[entry.employeeLevel]}`}
                    </Text>
                  </View>

                  <View style={styles.actionsWrap}>
                    {entry.role === 'EMPLOYEE' ? (
                      <Pressable
                        style={styles.secondaryButton}
                        disabled={isUpdatingUserId === entry.id}
                        onPress={() => setLevelEditorUser(entry)}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {text.storeManagement.editLevel}
                        </Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={styles.secondaryButton}
                      disabled={isUpdatingUserId === entry.id}
                      onPress={() => {
                        void handleToggleManagerRole(entry);
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {entry.role === 'MANAGER'
                          ? text.storeManagement.removeManagerRole
                          : text.storeManagement.makeManager}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.secondaryButton, styles.dangerButton]}
                      disabled={isUpdatingUserId === entry.id}
                      onPress={() => setDeletingUser(entry)}
                    >
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          styles.dangerButtonText,
                        ]}
                      >
                        {text.storeManagement.deleteAccount}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={levelEditorUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (isUpdatingUserId === null) {
            setLevelEditorUser(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {text.storeManagement.levelModalTitle}
              </Text>
              <Pressable
                style={styles.secondaryButton}
                disabled={isUpdatingUserId !== null}
                onPress={() => setLevelEditorUser(null)}
              >
                <Text style={styles.secondaryButtonText}>
                  {text.storeManagement.levelModalClose}
                </Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.levelList}>
              {EDITABLE_EMPLOYEE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.levelOption,
                    levelEditorUser?.employeeLevel === level &&
                      styles.levelOptionActive,
                  ]}
                  disabled={isUpdatingUserId !== null}
                  onPress={() => {
                    void handleUpdateLevel(level);
                  }}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      levelEditorUser?.employeeLevel === level &&
                        styles.levelOptionTextActive,
                    ]}
                  >
                    {text.dashboard.levels[level]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={deletingUser !== null}
        title={text.storeManagement.deleteTitle}
        message={
          deletingUser
            ? text.storeManagement.deleteMessage.replace(
                '{name}',
                getDisplayName(deletingUser, text.dashboard.fallbackName),
              )
            : text.storeManagement.deleteMessage.replace('{name}', '')
        }
        cancelLabel={text.auth.exitLoginCancel}
        confirmLabel={text.storeManagement.deleteConfirm}
        destructive
        onCancel={() => setDeletingUser(null)}
        onConfirm={() => {
          void handleDeleteUser();
        }}
      />

      <ConfirmDialog
        visible={approvingUser !== null}
        title={text.dashboard.quickApproveTitle}
        message={text.adminTraining.approveAccountMessage}
        cancelLabel={text.adminTraining.approveAccountCancel}
        confirmLabel={text.adminTraining.approveAccountConfirm}
        onCancel={() => {
          if (isApprovingUserId === null) {
            setApprovingUser(null);
          }
        }}
        onConfirm={() => {
          void handleApproveAccount();
        }}
      />

      <ConfirmDialog
        visible={rejectingUser !== null}
        title={text.adminTraining.rejectAccountTitle}
        message={text.adminTraining.rejectAccountMessage}
        cancelLabel={text.adminTraining.approveAccountCancel}
        confirmLabel={text.adminTraining.rejectAccountConfirm}
        destructive
        onCancel={() => {
          if (isRejectingUserId === null) {
            setRejectingUser(null);
          }
        }}
        onConfirm={() => {
          void handleRejectAccount();
        }}
      />
    </ScrollView>
  );
}
