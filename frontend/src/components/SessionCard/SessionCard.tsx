import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminRestaurantPanel } from '../AdminRestaurantPanel';
import { AdminTrainingAccessPanel } from '../AdminTrainingAccessPanel';
import { AdminUploadPanel } from '../AdminUploadPanel';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { EmployeeLevel, User } from '../../types/auth';
import {
  approveUserAccount,
  deleteUserAccount,
  fetchTrainingAccessUsers,
  updateUserLevel,
  type TrainingAccessUser,
} from '../../services/usersApi';
import {
  buildOrderBonUrl,
  fetchOrders,
  fetchTopOrderedProductsBySupplier,
  type OrderSummary,
  type SupplierTopProducts,
} from '../../services/ordersApi';

type SessionCardProps = {
  user: User;
  accessToken: string;
  text: AppText;
  onLogout: () => void;
};

const EMPLOYEE_LEVELS: EmployeeLevel[] = [
  'L0_PROBATION',
  'L1_PARTNER',
  'L2_PARTNER',
  'L3_PARTNER',
  'L4_EXCELLENT',
  'L5_PAM',
  'L5_AM',
  'L6_PM',
  'L6_MA',
  'L7_PDI',
  'L7_D',
];

export function SessionCard({ user, accessToken, text, onLogout }: SessionCardProps) {
  const roleLabel = text.dashboard.roleValues[user.role];
  const workplaceLabel = text.dashboard.workplaceValues[user.workplaceRole];
  const isManager = user.role === 'MANAGER';

  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [levelSearch, setLevelSearch] = useState('');
  const [isApprovingUserId, setIsApprovingUserId] = useState<number | null>(null);
  const [isUpdatingLevelUserId, setIsUpdatingLevelUserId] = useState<number | null>(null);
  const [isDeletingUserId, setIsDeletingUserId] = useState<number | null>(null);
  const [levelEditorUser, setLevelEditorUser] = useState<TrainingAccessUser | null>(null);

  const [latestOrder, setLatestOrder] = useState<OrderSummary | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [topProducts, setTopProducts] = useState<SupplierTopProducts[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [topProductsError, setTopProductsError] = useState<string | null>(null);
  const [orderPreviewUrl, setOrderPreviewUrl] = useState<string | null>(null);
  const [orderPreviewLoading, setOrderPreviewLoading] = useState(false);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    const managerRestaurantId = user.restaurant?.id;
    if (!managerRestaurantId) {
      setUsers([]);
      setUsersError(text.dashboard.managerRestaurantMissing);
      return;
    }

    let isActive = true;
    setUsersLoading(true);
    setUsersError(null);

    void fetchTrainingAccessUsers(accessToken, { restaurantId: managerRestaurantId })
      .then((result) => {
        if (!isActive) {
          return;
        }

        setUsers(
          result.filter((entry) => entry.role !== 'ADMIN' && entry.id !== user.id),
        );
      })
      .catch(() => {
        if (isActive) {
          setUsersError(text.dashboard.quickLoadUsersError);
          setUsers([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setUsersLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    accessToken,
    isManager,
    text.dashboard.managerRestaurantMissing,
    text.dashboard.quickLoadUsersError,
    user.id,
    user.restaurant?.id,
  ]);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    let isActive = true;
    setOrderLoading(true);
    setOrderError(null);

    void fetchOrders(accessToken)
      .then((orders) => {
        if (!isActive) {
          return;
        }

        setLatestOrder(orders[0] ?? null);
      })
      .catch(() => {
        if (isActive) {
          setOrderError(text.dashboard.quickLoadOrderError);
          setLatestOrder(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setOrderLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isManager, text.dashboard.quickLoadOrderError]);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    let isActive = true;
    setTopProductsLoading(true);
    setTopProductsError(null);

    void fetchTopOrderedProductsBySupplier(accessToken)
      .then((result) => {
        if (!isActive) {
          return;
        }

        setTopProducts(result);
      })
      .catch(() => {
        if (isActive) {
          setTopProductsError(text.dashboard.topProductsLoadError);
          setTopProducts([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setTopProductsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isManager, text.dashboard.topProductsLoadError]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (!latestOrder) {
      setOrderPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      return;
    }

    let isActive = true;
    setOrderPreviewLoading(true);

    void fetch(buildOrderBonUrl(latestOrder.id), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('ORDER_PREVIEW_FAILED');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setOrderPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          return objectUrl;
        });
      })
      .catch(() => {
        if (isActive) {
          setOrderPreviewUrl((currentUrl) => {
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }
            return null;
          });
        }
      })
      .finally(() => {
        if (isActive) {
          setOrderPreviewLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, latestOrder]);

  const accountApprovalUsers = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return users
      .filter((entry) => !entry.isApproved)
      .filter((entry) => {
        if (!query) {
          return true;
        }

        const name = entry.name?.toLowerCase() ?? '';
        return name.includes(query) || entry.email.toLowerCase().includes(query);
      });
  }, [accountSearch, users]);

  const deletionUsers = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return users.filter((entry) => {
      if (!query) {
        return true;
      }

      const name = entry.name?.toLowerCase() ?? '';
      return name.includes(query) || entry.email.toLowerCase().includes(query);
    });
  }, [accountSearch, users]);

  const levelUsers = useMemo(() => {
    const query = levelSearch.trim().toLowerCase();
    return users.filter((entry) => {
      if (!query) {
        return true;
      }

      const name = entry.name?.toLowerCase() ?? '';
      return name.includes(query) || entry.email.toLowerCase().includes(query);
    });
  }, [levelSearch, users]);

  async function confirmAction(title: string, message: string, confirmLabel: string) {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.confirm(message);
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: text.adminTraining.confirmProbationCancel, style: 'cancel', onPress: () => resolve(false) },
          { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  }

  async function handleApproveAccount(entry: TrainingAccessUser) {
    const confirmed = await confirmAction(
      text.dashboard.quickApproveTitle,
      text.adminTraining.approveAccountMessage,
      text.adminTraining.approveAccountConfirm,
    );
    if (!confirmed) {
      return;
    }

    setIsApprovingUserId(entry.id);
    try {
      const updated = await approveUserAccount(accessToken, entry.id);
      setUsers((current) =>
        current.map((userEntry) =>
          userEntry.id === updated.id
            ? { ...userEntry, isApproved: updated.isApproved }
            : userEntry,
        ),
      );
    } finally {
      setIsApprovingUserId(null);
    }
  }

  async function handleUpdateEmployeeLevel(entry: TrainingAccessUser, level: EmployeeLevel) {
    const levelLabel = text.dashboard.levels[level];
    const confirmed = await confirmAction(
      text.dashboard.levelModalTitle,
      `${text.dashboard.levelModalTitle}: ${levelLabel} ?`,
      text.adminTraining.confirmProbationConfirm,
    );

    if (!confirmed) {
      return;
    }

    setIsUpdatingLevelUserId(entry.id);
    setUsersError(null);

    try {
      const updated = await updateUserLevel(accessToken, entry.id, level);
      setUsers((current) =>
        current.map((userEntry) =>
          userEntry.id === updated.id
            ? {
                ...userEntry,
                role: updated.role,
                employeeLevel: updated.employeeLevel,
                isOnProbation: updated.isOnProbation,
              }
            : userEntry,
        ),
      );
      setLevelEditorUser((current) => (current?.id === entry.id ? null : current));
    } catch {
      setUsersError(text.dashboard.levelUpdateError);
    } finally {
      setIsUpdatingLevelUserId(null);
    }
  }

  async function handleDeleteUser(entry: TrainingAccessUser) {
    const confirmed = await confirmAction(
      text.dashboard.quickDeleteTitle,
      text.dashboard.quickDeleteMessage,
      text.dashboard.quickDeleteConfirm,
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingUserId(entry.id);
    try {
      await deleteUserAccount(accessToken, entry.id);
      setUsers((current) => current.filter((userEntry) => userEntry.id !== entry.id));
    } finally {
      setIsDeletingUserId(null);
    }
  }

  function renderManagerQuickBlocks() {
    return (
      <View style={styles.quickColumn}>
        <View style={styles.quickBlock}>
          <Text style={styles.quickBlockTitle}>{text.dashboard.quickApproveTitle}</Text>
          <TextInput
            style={styles.quickSearchInput}
            placeholder={text.dashboard.quickSearchPlaceholder}
            placeholderTextColor="#a98a8d"
            value={accountSearch}
            onChangeText={setAccountSearch}
          />
          {usersLoading ? <Text style={styles.subtitle}>{text.adminTraining.loading}</Text> : null}
          {usersError ? <Text style={styles.errorText}>{usersError}</Text> : null}
          {!usersLoading && !usersError && accountApprovalUsers.length === 0 ? (
            <Text style={styles.subtitle}>{text.dashboard.quickNoPendingAccount}</Text>
          ) : null}
          {accountApprovalUsers.slice(0, 4).map((entry) => (
            <View key={`approve-${entry.id}`} style={styles.quickRowCard}>
              <Text style={styles.quickRowTitle}>{entry.name ?? entry.email}</Text>
              <Text style={styles.subtitle}>{entry.email}</Text>
              <Pressable
                style={[
                  styles.secondaryButton,
                    isApprovingUserId === entry.id && styles.buttonDisabled,
                ]}
                disabled={isApprovingUserId === entry.id}
                onPress={() => {
                  void handleApproveAccount(entry);
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  {isApprovingUserId === entry.id
                    ? text.adminTraining.approveAccountSaving
                    : text.adminTraining.approveAccountButton}
                  </Text>
                </Pressable>
            </View>
          ))}

          <View style={styles.quickSectionDivider}>
            <Text style={styles.quickSectionTitle}>{text.dashboard.quickDeleteSectionTitle}</Text>
          </View>

          {deletionUsers.length === 0 ? (
            <Text style={styles.subtitle}>{text.dashboard.quickNoEmployee}</Text>
          ) : (
            deletionUsers.slice(0, 4).map((entry) => (
              <View key={`delete-${entry.id}`} style={styles.quickRowCard}>
                <View style={styles.quickLevelRow}>
                  <View style={styles.quickLevelInfo}>
                    <Text style={styles.quickRowTitle}>{entry.name ?? entry.email}</Text>
                    <Text style={styles.subtitle}>{entry.email}</Text>
                  </View>

                <Pressable
                  style={[
                    styles.iconDeleteButton,
                    isDeletingUserId === entry.id && styles.buttonDisabled,
                  ]}
                  accessibilityLabel={text.dashboard.quickDeleteButton}
                  disabled={isDeletingUserId === entry.id}
                  onPress={() => {
                    void handleDeleteUser(entry);
                  }}
                >
                  <Ionicons
                    name={isDeletingUserId === entry.id ? 'hourglass-outline' : 'trash-outline'}
                    size={20}
                    color="#ab1e24"
                  />
                </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.quickBlock}>
          <Text style={styles.quickBlockTitle}>{text.dashboard.quickLevelTitle}</Text>
          <TextInput
            style={styles.quickSearchInput}
            placeholder={text.dashboard.quickSearchPlaceholder}
            placeholderTextColor="#a98a8d"
            value={levelSearch}
            onChangeText={setLevelSearch}
          />
          {levelUsers.length === 0 ? (
            <Text style={styles.subtitle}>{text.dashboard.quickNoEmployee}</Text>
          ) : (
            levelUsers.slice(0, 6).map((entry) => (
              <View key={`level-${entry.id}`} style={styles.quickRowCard}>
                <View style={styles.quickLevelRow}>
                  <View style={styles.quickLevelInfo}>
                    <Text style={styles.quickRowTitle}>{entry.name ?? entry.email}</Text>
                    <Text style={styles.subtitle}>{entry.email}</Text>
                    <Text style={styles.subtitle}>
                      {text.dashboard.employeeLevelLabel}: {text.dashboard.levels[entry.employeeLevel]}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.iconActionButton,
                      isUpdatingLevelUserId === entry.id && styles.buttonDisabled,
                    ]}
                    accessibilityLabel={text.dashboard.levelModalTitle}
                    disabled={isUpdatingLevelUserId === entry.id}
                    onPress={() => {
                      setLevelEditorUser(entry);
                    }}
                  >
                    <Ionicons
                      name={
                        isUpdatingLevelUserId === entry.id
                          ? 'hourglass-outline'
                          : 'arrow-up-circle-outline'
                      }
                      size={20}
                      color="#7f1b21"
                    />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.quickBlock}>
          <Text style={styles.quickBlockTitle}>{text.dashboard.quickLatestOrderTitle}</Text>
          {orderLoading ? <Text style={styles.subtitle}>{text.adminTraining.loading}</Text> : null}
          {orderError ? <Text style={styles.errorText}>{orderError}</Text> : null}
          {!orderLoading && !orderError && !latestOrder ? (
            <Text style={styles.subtitle}>{text.dashboard.quickNoOrder}</Text>
          ) : null}
          {latestOrder ? (
            <View style={styles.quickRowCard}>
              <View style={styles.quickMetaInlineRow}>
                <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
                  {text.orders.orderNumberLabel}
                </Text>
                <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
                  {text.orders.deliveryDateLabel}
                </Text>
                <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
                  {text.orders.supplierLabel}
                </Text>
                <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
                  {text.orders.summaryItems}
                </Text>
                {Platform.OS === 'web' ? <View style={styles.quickEyeSpacer} /> : null}
              </View>

              <View style={styles.quickMetaInlineRow}>
                <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
                  {latestOrder.number}
                </Text>
                <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
                  {latestOrder.deliveryDate}
                </Text>
                <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
                  {latestOrder.supplierName}
                </Text>
                <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
                  {latestOrder.totalItems}
                </Text>

                {Platform.OS === 'web' ? (
                  <Pressable
                    style={[
                      styles.eyePreviewButton,
                      (!orderPreviewUrl || orderPreviewLoading) && styles.buttonDisabled,
                    ]}
                    disabled={!orderPreviewUrl || orderPreviewLoading}
                    onPress={() => setIsOrderPreviewOpen(true)}
                  >
                    <Ionicons name="eye-outline" size={20} color="#7f1b21" />
                  </Pressable>
                ) : null}
              </View>

              {Platform.OS === 'web' ? null : (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    void Linking.openURL(buildOrderBonUrl(latestOrder.id));
                  }}
                >
                  <Text style={styles.secondaryButtonText}>{text.orders.downloadBonButton}</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  function renderTopProductsChart() {
    return (
      <View style={styles.quickBlock}>
        <Text style={styles.quickBlockTitle}>{text.dashboard.topProductsTitle}</Text>
        <Text style={styles.subtitle}>{text.dashboard.topProductsSubtitle}</Text>

        {topProductsLoading ? (
          <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
        ) : null}

        {topProductsError ? <Text style={styles.errorText}>{topProductsError}</Text> : null}

        {!topProductsLoading && !topProductsError && topProducts.length === 0 ? (
          <Text style={styles.subtitle}>{text.dashboard.topProductsEmpty}</Text>
        ) : null}

        {topProducts.map((supplier) => {
          const maxQuantity = Math.max(
            ...supplier.products.map((product) => product.totalQuantity),
            1,
          );

          return (
            <View key={`supplier-${supplier.supplierId}`} style={styles.chartSupplierBlock}>
              <Text style={styles.chartSupplierTitle}>{supplier.supplierName}</Text>

              {supplier.products.map((product) => {
                const ratio = Math.max(8, Math.round((product.totalQuantity / maxQuantity) * 100));
                const productLabel =
                  product.nameFr?.trim() || product.nameZh?.trim() || `${product.productId}`;

                return (
                  <View key={`supplier-${supplier.supplierId}-product-${product.productId}`}>
                    <View style={styles.chartRowHeader}>
                      <Text style={styles.chartRowLabel} numberOfLines={1}>
                        {productLabel}
                      </Text>
                      <Text style={styles.chartRowValue}>{product.totalQuantity}</Text>
                    </View>

                    <View style={styles.chartTrack}>
                      <View style={[styles.chartBar, { width: `${ratio}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.stackCardWrap}>
      <View style={isManager ? styles.managerDashboardLayout : undefined}>
        <View style={isManager ? styles.managerLeftColumn : undefined}>
          <View style={[styles.card, isManager && styles.managerLeftCard]}>
            <Text style={styles.title}>
              {text.dashboard.welcome} {user.name ?? text.dashboard.fallbackName}
            </Text>
            <Text style={styles.subtitle}>{user.email}</Text>
            {user.restaurant ? (
              <Text style={styles.subtitle}>
                {user.restaurant.name} - {user.restaurant.address}
              </Text>
            ) : null}

            <View style={styles.pillRow}>
              <Text style={styles.pill}>{text.dashboard.role}: {roleLabel}</Text>
              <Text style={styles.pill}>{text.dashboard.workplace}: {workplaceLabel}</Text>
            </View>

            <Text style={styles.meta}>
              {text.dashboard.probation}: {user.isOnProbation ? text.dashboard.yes : text.dashboard.no}
            </Text>

            <Pressable style={styles.secondaryButton} onPress={onLogout}>
              <Text style={styles.secondaryButtonText}>{text.dashboard.logout}</Text>
            </Pressable>
          </View>

          {isManager ? renderTopProductsChart() : null}
        </View>

        {isManager ? renderManagerQuickBlocks() : null}
      </View>

      {Platform.OS === 'web' ? (
        <Modal
          visible={isOrderPreviewOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOrderPreviewOpen(false)}
        >
          <View style={styles.previewModalBackdrop}>
            <View style={styles.previewModalCard}>
              <View style={styles.previewModalHeader}>
                <Text style={styles.quickBlockTitle}>{text.dashboard.quickLatestOrderTitle}</Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setIsOrderPreviewOpen(false)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {text.dashboard.quickPreviewCloseButton}
                  </Text>
                </Pressable>
              </View>

              {orderPreviewUrl ? (
                <iframe
                  src={orderPreviewUrl}
                  style={styles.orderPreviewFrame as never}
                  title={latestOrder ? `order-preview-${latestOrder.id}` : 'order-preview'}
                />
              ) : (
                <Text style={styles.subtitle}>{text.dashboard.quickPreviewUnavailable}</Text>
              )}
            </View>
          </View>
        </Modal>
      ) : null}

      <Modal
        visible={levelEditorUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLevelEditorUser(null)}
      >
        <View style={styles.previewModalBackdrop}>
          <View style={styles.levelModalCard}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.quickBlockTitle}>{text.dashboard.levelModalTitle}</Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setLevelEditorUser(null)}
              >
                <Text style={styles.secondaryButtonText}>{text.dashboard.levelModalClose}</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.levelListWrap} contentContainerStyle={styles.levelListContent}>
              {EMPLOYEE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.levelListItem,
                    levelEditorUser?.employeeLevel === level && styles.levelListItemActive,
                    isUpdatingLevelUserId === levelEditorUser?.id && styles.buttonDisabled,
                  ]}
                  disabled={isUpdatingLevelUserId === levelEditorUser?.id}
                  onPress={() => {
                    if (!levelEditorUser) {
                      return;
                    }

                    void handleUpdateEmployeeLevel(levelEditorUser, level);
                  }}
                >
                  <Text
                    style={[
                      styles.levelListItemText,
                      levelEditorUser?.employeeLevel === level && styles.levelListItemTextActive,
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

      {user.role === 'ADMIN' ? (
        <>
          <AdminRestaurantPanel accessToken={accessToken} text={text} />
          <AdminTrainingAccessPanel
            accessToken={accessToken}
            currentUser={user}
            text={text}
          />
          <AdminUploadPanel accessToken={accessToken} text={text} />
        </>
      ) : user.role === 'EMPLOYEE' ? (
        <View style={styles.card}>
          <Text style={styles.subtitle}>{text.dashboard.uploadPermission}</Text>
        </View>
      ) : null}
    </View>
  );
}
