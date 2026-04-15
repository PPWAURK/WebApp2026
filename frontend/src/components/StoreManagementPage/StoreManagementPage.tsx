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
  updateUserSupervisorRole,
  type TrainingAccessUser,
} from '../../services/usersApi';
import { EMPLOYEE_LEVELS } from '../../features/dashboard/lib/dashboardShared';
import type { EmployeeLevel, Restaurant } from '../../types/auth';
import { isManagerLikeRole } from '../../utils/roleAccess';
import { ConfirmDialog } from '../ConfirmDialog';
import { styles } from './StoreManagementPage.styles';

type StoreManagementPageProps = {
  text: AppText;
  accessToken: string;
};

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

function isLinkedToRestaurant(
  user: TrainingAccessUser,
  restaurantId: number | null,
) {
  if (!restaurantId) {
    return false;
  }

  if (user.restaurant?.id === restaurantId) {
    return true;
  }

  return user.managedRestaurants.some(
    (restaurant) => restaurant.id === restaurantId,
  );
}

function getRoleSortPriority(role: TrainingAccessUser['role']) {
  if (role === 'REGIONAL_MANAGER') {
    return 0;
  }

  if (role === 'MANAGER') {
    return 1;
  }

  if (role === 'EMPLOYEE') {
    return 2;
  }

  return 3;
}

export function StoreManagementPage({
  text,
  accessToken,
}: StoreManagementPageProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 768;
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
  const [regionalScopeUser, setRegionalScopeUser] =
    useState<TrainingAccessUser | null>(null);
  const [regionalScopeManagedIds, setRegionalScopeManagedIds] = useState<
    number[]
  >([]);
  const [regionalScopePrimaryRestaurantId, setRegionalScopePrimaryRestaurantId] =
    useState<number | null>(null);

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
            isLinkedToRestaurant(entry, selectedRestaurantId) &&
            entry.role !== 'ADMIN' &&
            entry.isApproved,
        )
        .sort((left, right) => {
          if (left.role !== right.role) {
            return getRoleSortPriority(left.role) - getRoleSortPriority(right.role);
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

  function replaceUserEntry(updated: TrainingAccessUser) {
    setUsers((currentValue) =>
      currentValue.map((entry) =>
        entry.id === updated.id ? { ...entry, ...updated } : entry,
      ),
    );
  }

  function openRegionalScopeEditor(entry: TrainingAccessUser) {
    const managedRestaurantIds =
      entry.role === 'REGIONAL_MANAGER'
        ? entry.managedRestaurants.map((restaurant) => restaurant.id)
        : [
            entry.restaurant?.id ??
              selectedRestaurantId ??
              restaurants[0]?.id,
          ].filter((restaurantId): restaurantId is number => restaurantId != null);

    const primaryRestaurantId =
      entry.restaurant?.id && managedRestaurantIds.includes(entry.restaurant.id)
        ? entry.restaurant.id
        : managedRestaurantIds[0] ?? null;

    setRegionalScopeUser(entry);
    setRegionalScopeManagedIds(managedRestaurantIds);
    setRegionalScopePrimaryRestaurantId(primaryRestaurantId);
  }

  function toggleRegionalScopeRestaurant(restaurantId: number) {
    setRegionalScopeManagedIds((currentValue) => {
      const nextValue = currentValue.includes(restaurantId)
        ? currentValue.filter((entry) => entry !== restaurantId)
        : [...currentValue, restaurantId];

      setRegionalScopePrimaryRestaurantId((currentPrimaryRestaurantId) => {
        if (nextValue.length === 0) {
          return null;
        }

        if (
          currentPrimaryRestaurantId !== null &&
          nextValue.includes(currentPrimaryRestaurantId)
        ) {
          return currentPrimaryRestaurantId;
        }

        return nextValue[0] ?? null;
      });

      return nextValue;
    });
  }

  async function handleSetManagerRole(
    entry: TrainingAccessUser,
    nextRole: 'EMPLOYEE' | 'MANAGER',
  ) {
    setIsUpdatingUserId(entry.id);
    setError(null);

    try {
      const updated = await updateUserSupervisorRole(accessToken, entry.id, {
        role: nextRole,
        primaryRestaurantId: selectedRestaurantId ?? entry.restaurant?.id ?? undefined,
      });

      replaceUserEntry(updated);
      if (levelEditorUser?.id === entry.id) {
        setLevelEditorUser(null);
      }
      if (regionalScopeUser?.id === entry.id) {
        setRegionalScopeUser(null);
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

  async function handleSaveRegionalScope() {
    if (!regionalScopeUser) {
      return;
    }

    if (regionalScopeManagedIds.length === 0) {
      setError(text.storeManagement.regionalScopeEmpty);
      return;
    }

    const primaryRestaurantId =
      regionalScopePrimaryRestaurantId !== null &&
      regionalScopeManagedIds.includes(regionalScopePrimaryRestaurantId)
        ? regionalScopePrimaryRestaurantId
        : regionalScopeManagedIds[0];

    if (!primaryRestaurantId) {
      setError(text.storeManagement.regionalScopePrimaryEmpty);
      return;
    }

    setIsUpdatingUserId(regionalScopeUser.id);
    setError(null);

    try {
      const updated = await updateUserSupervisorRole(
        accessToken,
        regionalScopeUser.id,
        {
          role: 'REGIONAL_MANAGER',
          primaryRestaurantId,
          managedRestaurantIds: regionalScopeManagedIds,
        },
      );

      replaceUserEntry(updated);
      setRegionalScopeUser(null);
      if (selectedRestaurantId === null) {
        setSelectedRestaurantId(primaryRestaurantId);
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

  function renderRegionalScopeEditor() {
    if (!regionalScopeUser) {
      return null;
    }

    const selectedRestaurants = restaurants.filter((entry) =>
      regionalScopeManagedIds.includes(entry.id),
    );

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (isUpdatingUserId === null) {
            setRegionalScopeUser(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {text.storeManagement.regionalScopeModalTitle.replace(
                  '{name}',
                  getDisplayName(regionalScopeUser, text.dashboard.fallbackName),
                )}
              </Text>
              <Pressable
                style={styles.secondaryButton}
                disabled={isUpdatingUserId !== null}
                onPress={() => setRegionalScopeUser(null)}
              >
                <Text style={styles.secondaryButtonText}>
                  {text.storeManagement.levelModalClose}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.cardSubtitle}>
                {text.storeManagement.regionalScopeModalSubtitle}
              </Text>

              <View style={styles.modalSection}>
                <Text style={styles.fieldLabel}>
                  {text.storeManagement.regionalScopeManagedLabel}
                </Text>
                <View style={styles.restaurantSelectorWrap}>
                  {restaurants.map((entry) => {
                    const isSelected = regionalScopeManagedIds.includes(entry.id);

                    return (
                      <Pressable
                        key={entry.id}
                        style={[
                          styles.restaurantChip,
                          isSelected && styles.restaurantChipActive,
                        ]}
                        disabled={isUpdatingUserId !== null}
                        onPress={() => toggleRegionalScopeRestaurant(entry.id)}
                      >
                        <Text
                          style={[
                            styles.restaurantChipText,
                            isSelected && styles.restaurantChipTextActive,
                          ]}
                        >
                          {entry.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.fieldLabel}>
                  {text.storeManagement.regionalScopePrimaryLabel}
                </Text>

                {selectedRestaurants.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {text.storeManagement.regionalScopeEmpty}
                  </Text>
                ) : (
                  <View style={styles.restaurantSelectorWrap}>
                    {selectedRestaurants.map((entry) => {
                      const isPrimary =
                        regionalScopePrimaryRestaurantId === entry.id;

                      return (
                        <Pressable
                          key={entry.id}
                          style={[
                            styles.primarySelectionCard,
                            isPrimary && styles.primarySelectionCardActive,
                          ]}
                          disabled={isUpdatingUserId !== null}
                          onPress={() =>
                            setRegionalScopePrimaryRestaurantId(entry.id)
                          }
                        >
                          <Text
                            style={[
                              styles.primarySelectionTitle,
                              isPrimary && styles.primarySelectionTitleActive,
                            ]}
                          >
                            {entry.name}
                          </Text>
                          <Text
                            style={[
                              styles.primarySelectionSubtitle,
                              isPrimary && styles.primarySelectionSubtitleActive,
                            ]}
                          >
                            {entry.address}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            <Pressable
              style={[
                styles.primaryButton,
                (isUpdatingUserId !== null || selectedRestaurants.length === 0) &&
                  styles.primaryButtonDisabled,
              ]}
              disabled={isUpdatingUserId !== null || selectedRestaurants.length === 0}
              onPress={() => {
                void handleSaveRegionalScope();
              }}
            >
              <Text style={styles.primaryButtonText}>
                {isUpdatingUserId === regionalScopeUser.id
                  ? text.storeManagement.saving
                  : text.storeManagement.regionalScopeSave}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
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
      if (regionalScopeUser?.id === deletingUser.id) {
        setRegionalScopeUser(null);
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
              <ScrollView
                style={styles.restaurantList}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {restaurants.map((entry, index) => {
                  const isActive = selectedRestaurantId === entry.id;
                  return (
                    <Pressable
                      key={entry.id}
                      style={[
                        styles.restaurantListItem,
                        index < restaurants.length - 1 &&
                          styles.restaurantListItemBorder,
                        isActive && styles.restaurantListItemActive,
                      ]}
                      onPress={() => setSelectedRestaurantId(entry.id)}
                    >
                      {isActive ? (
                        <View style={styles.restaurantListItemAccent} />
                      ) : null}
                      <View style={styles.restaurantListItemBody}>
                        <Text
                          style={[
                            styles.restaurantListItemName,
                            isActive && styles.restaurantListItemNameActive,
                          ]}
                        >
                          {entry.name}
                        </Text>
                        <Text style={styles.restaurantListItemAddress}>
                          {entry.address}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
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
                            style={[styles.secondaryButton, styles.dangerButton, styles.actionsButton]}
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
                              styles.actionsButton,
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
                  {entry.managedRestaurants.length > 0 ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailText}>
                        {entry.managedRestaurants
                          .map((restaurant) => restaurant.name)
                          .join(' · ')}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.actionsWrap}>
                    {entry.role === 'EMPLOYEE' ? (
                      <Pressable
                        style={[styles.secondaryButton, styles.actionsButton]}
                        disabled={isUpdatingUserId === entry.id}
                        onPress={() => setLevelEditorUser(entry)}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {text.storeManagement.editLevel}
                        </Text>
                      </Pressable>
                    ) : null}

                    {entry.role !== 'REGIONAL_MANAGER' ? (
                      <Pressable
                        style={[styles.secondaryButton, styles.actionsButton]}
                        disabled={isUpdatingUserId === entry.id}
                        onPress={() => {
                          void handleSetManagerRole(
                            entry,
                            entry.role === 'MANAGER' ? 'EMPLOYEE' : 'MANAGER',
                          );
                        }}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {entry.role === 'MANAGER'
                            ? text.storeManagement.removeManagerRole
                            : text.storeManagement.makeManager}
                        </Text>
                      </Pressable>
                    ) : null}

                    {entry.role === 'REGIONAL_MANAGER' ? (
                      <Pressable
                        style={[styles.secondaryButton, styles.actionsButton]}
                        disabled={isUpdatingUserId === entry.id}
                        onPress={() => {
                          void handleSetManagerRole(entry, 'MANAGER');
                        }}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {text.storeManagement.convertToManager}
                        </Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={[styles.secondaryButton, styles.actionsButton]}
                      disabled={isUpdatingUserId === entry.id}
                      onPress={() => openRegionalScopeEditor(entry)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {isManagerLikeRole(entry.role)
                          ? text.storeManagement.editRegionalScope
                          : text.storeManagement.makeRegionalManager}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.secondaryButton, styles.dangerButton, styles.actionsButton]}
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
              {EMPLOYEE_LEVELS.map((level) => (
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

      {renderRegionalScopeEditor()}

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
