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
  fetchTopOrderedProductMonths,
  fetchTopOrderedProductsBySupplier,
  type OrderSummary,
  type TopOrderedProduct,
} from '../../services/ordersApi';
import { fetchSuppliers, type SupplierItem } from '../../services/suppliersApi';

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
  const isAdmin = user.role === 'ADMIN';
  const isSupervisor = isManager || isAdmin;

  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [levelSearch, setLevelSearch] = useState('');
  const [isApprovingUserId, setIsApprovingUserId] = useState<number | null>(null);
  const [isUpdatingLevelUserId, setIsUpdatingLevelUserId] = useState<number | null>(null);
  const [isDeletingUserId, setIsDeletingUserId] = useState<number | null>(null);
  const [levelEditorUser, setLevelEditorUser] = useState<TrainingAccessUser | null>(null);
  const [openRestaurantFilterFor, setOpenRestaurantFilterFor] = useState<
    'approval' | 'level' | null
  >(null);
  const [selectedEmployeeRestaurantFilter, setSelectedEmployeeRestaurantFilter] = useState<
    number | 'ALL' | 'NONE'
  >('ALL');

  const [latestOrder, setLatestOrder] = useState<OrderSummary | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [topProducts, setTopProducts] = useState<TopOrderedProduct[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [topProductsError, setTopProductsError] = useState<string | null>(null);
  const [chartSuppliers, setChartSuppliers] = useState<SupplierItem[]>([]);
  const [selectedChartSupplierId, setSelectedChartSupplierId] = useState<number | null>(null);
  const [chartMonths, setChartMonths] = useState<string[]>([]);
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(null);
  const [orderPreviewUrl, setOrderPreviewUrl] = useState<string | null>(null);
  const [orderPreviewLoading, setOrderPreviewLoading] = useState(false);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    const managerRestaurantId = user.restaurant?.id;
    if (isManager && !managerRestaurantId) {
      setUsers([]);
      setUsersError(text.dashboard.managerRestaurantMissing);
      return;
    }

    let isActive = true;
    setUsersLoading(true);
    setUsersError(null);

    void fetchTrainingAccessUsers(
      accessToken,
      isManager ? { restaurantId: managerRestaurantId } : undefined,
    )
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
    isSupervisor,
    text.dashboard.managerRestaurantMissing,
    text.dashboard.quickLoadUsersError,
    user.id,
    user.restaurant?.id,
  ]);

  useEffect(() => {
    if (!isSupervisor) {
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
  }, [accessToken, isSupervisor, text.dashboard.quickLoadOrderError]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    let isActive = true;

    void fetchSuppliers(accessToken)
      .then((result) => {
        if (!isActive) {
          return;
        }

        setChartSuppliers(result);
        setSelectedChartSupplierId((current) => {
          if (current && result.some((supplier) => supplier.id === current)) {
            return current;
          }

          return result[0]?.id ?? null;
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setChartSuppliers([]);
        setSelectedChartSupplierId(null);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isSupervisor]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    if (!selectedChartSupplierId) {
      setChartMonths([]);
      setSelectedChartMonth(null);
      return;
    }

    let isActive = true;

    void fetchTopOrderedProductMonths(accessToken, selectedChartSupplierId)
      .then((months) => {
        if (!isActive) {
          return;
        }

        setChartMonths(months);
        setSelectedChartMonth((current) => {
          if (current && months.includes(current)) {
            return current;
          }
          return months[0] ?? null;
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setChartMonths([]);
        setSelectedChartMonth(null);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isSupervisor, selectedChartSupplierId]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    if (!selectedChartSupplierId) {
      setTopProducts([]);
      setTopProductsError(null);
      setTopProductsLoading(false);
      return;
    }

    if (!selectedChartMonth) {
      setTopProducts([]);
      setTopProductsError(null);
      setTopProductsLoading(false);
      return;
    }

    let isActive = true;
    setTopProductsLoading(true);
    setTopProductsError(null);

    void fetchTopOrderedProductsBySupplier(
      accessToken,
      selectedChartSupplierId,
      selectedChartMonth,
    )
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
  }, [
    accessToken,
    isSupervisor,
    selectedChartMonth,
    selectedChartSupplierId,
    text.dashboard.topProductsLoadError,
  ]);

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

  const employeeRestaurantOptions = useMemo(() => {
    const restaurantsMap = new Map<number, string>();

    for (const entry of users) {
      if (entry.restaurant?.id && entry.restaurant.name) {
        restaurantsMap.set(entry.restaurant.id, entry.restaurant.name);
      }
    }

    return Array.from(restaurantsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [users]);

  const usersFilteredByRestaurant = useMemo(() => {
    if (!isAdmin || selectedEmployeeRestaurantFilter === 'ALL') {
      return users;
    }

    if (selectedEmployeeRestaurantFilter === 'NONE') {
      return users.filter((entry) => !entry.restaurantId);
    }

    return users.filter((entry) => entry.restaurantId === selectedEmployeeRestaurantFilter);
  }, [isAdmin, selectedEmployeeRestaurantFilter, users]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    if (
      typeof selectedEmployeeRestaurantFilter === 'number' &&
      !employeeRestaurantOptions.some((restaurant) => restaurant.id === selectedEmployeeRestaurantFilter)
    ) {
      setSelectedEmployeeRestaurantFilter('ALL');
    }
  }, [employeeRestaurantOptions, isAdmin, selectedEmployeeRestaurantFilter]);

  const accountApprovalUsers = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return usersFilteredByRestaurant
      .filter((entry) => !entry.isApproved)
      .filter((entry) => {
        if (!query) {
          return true;
        }

        const name = entry.name?.toLowerCase() ?? '';
        return name.includes(query) || entry.email.toLowerCase().includes(query);
      });
  }, [accountSearch, usersFilteredByRestaurant]);

  const deletionUsers = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return usersFilteredByRestaurant.filter((entry) => {
      if (!query) {
        return true;
      }

      const name = entry.name?.toLowerCase() ?? '';
      return name.includes(query) || entry.email.toLowerCase().includes(query);
    });
  }, [accountSearch, usersFilteredByRestaurant]);

  const levelUsers = useMemo(() => {
    const query = levelSearch.trim().toLowerCase();
    return usersFilteredByRestaurant.filter((entry) => {
      if (!query) {
        return true;
      }

      const name = entry.name?.toLowerCase() ?? '';
      return name.includes(query) || entry.email.toLowerCase().includes(query);
    });
  }, [levelSearch, usersFilteredByRestaurant]);

  function getSelectedRestaurantFilterLabel() {
    if (selectedEmployeeRestaurantFilter === 'ALL') {
      return text.dashboard.quickRestaurantFilterAll;
    }

    if (selectedEmployeeRestaurantFilter === 'NONE') {
      return text.dashboard.quickRestaurantFilterUnassigned;
    }

    return (
      employeeRestaurantOptions.find(
        (restaurant) => restaurant.id === selectedEmployeeRestaurantFilter,
      )?.name ?? text.dashboard.quickRestaurantFilterAll
    );
  }

  function renderAdminRestaurantFilter(section: 'approval' | 'level') {
    if (!isAdmin) {
      return null;
    }

    const isOpen = openRestaurantFilterFor === section;

    const options: Array<{
      key: string;
      label: string;
      value: number | 'ALL' | 'NONE';
    }> = [
      {
        key: 'ALL',
        label: text.dashboard.quickRestaurantFilterAll,
        value: 'ALL',
      },
      {
        key: 'NONE',
        label: text.dashboard.quickRestaurantFilterUnassigned,
        value: 'NONE',
      },
      ...employeeRestaurantOptions.map((restaurant) => ({
        key: `${restaurant.id}`,
        label: restaurant.name,
        value: restaurant.id,
      })),
    ];

    return (
      <View style={styles.restaurantFilterBlock}>
        <Text style={styles.quickSectionTitle}>{text.dashboard.quickRestaurantFilterTitle}</Text>
        <View style={styles.restaurantFilterSelectWrap}>
          <Pressable
            style={styles.restaurantFilterSelectTrigger}
            onPress={() => setOpenRestaurantFilterFor((current) => (current === section ? null : section))}
          >
            <Text style={styles.restaurantFilterSelectText}>{getSelectedRestaurantFilterLabel()}</Text>
            <Text style={styles.restaurantFilterSelectChevron}>{isOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {isOpen ? (
            <View style={styles.restaurantFilterSelectList}>
              {options.map((option, index) => {
                const isActive = selectedEmployeeRestaurantFilter === option.value;

                return (
                  <Pressable
                    key={`restaurant-filter-option-${option.key}`}
                    style={[
                      styles.restaurantFilterSelectItem,
                      isActive && styles.restaurantFilterSelectItemActive,
                      index === options.length - 1 && styles.restaurantFilterSelectItemLast,
                    ]}
                    onPress={() => {
                      setSelectedEmployeeRestaurantFilter(option.value);
                      setOpenRestaurantFilterFor(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.restaurantFilterSelectItemText,
                        isActive && styles.restaurantFilterSelectItemTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

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
      <>
        <View style={styles.quickBlock}>
          <Text style={styles.quickBlockTitle}>{text.dashboard.quickApproveTitle}</Text>
          {renderAdminRestaurantFilter('approval')}
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
      </>
    );
  }

  function renderLevelQuickBlock() {
    return (
      <View style={styles.quickBlock}>
        <Text style={styles.quickBlockTitle}>{text.dashboard.quickLevelTitle}</Text>
        {renderAdminRestaurantFilter('level')}
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
    );
  }

  function renderTopProductsChart() {
    return (
      <View style={styles.quickBlock}>
        <Text style={styles.quickBlockTitle}>{text.dashboard.topProductsTitle}</Text>
        <Text style={styles.subtitle}>{text.dashboard.topProductsSubtitle}</Text>

        {chartSuppliers.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartSupplierTabs}
          >
            {chartSuppliers.map((supplier) => {
              const isActive = supplier.id === selectedChartSupplierId;
              return (
                <Pressable
                  key={`chart-supplier-${supplier.id}`}
                  style={[styles.chartSupplierChip, isActive && styles.chartSupplierChipActive]}
                  onPress={() => setSelectedChartSupplierId(supplier.id)}
                >
                  <Text
                    style={[
                      styles.chartSupplierChipText,
                      isActive && styles.chartSupplierChipTextActive,
                    ]}
                  >
                    {supplier.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.subtitle}>{text.dashboard.topProductsEmpty}</Text>
        )}

        {chartMonths.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartSupplierTabs}
          >
            {chartMonths.map((month) => {
              const isActive = month === selectedChartMonth;
              return (
                <Pressable
                  key={`chart-month-${month}`}
                  style={[styles.chartSupplierChip, isActive && styles.chartSupplierChipActive]}
                  onPress={() => setSelectedChartMonth(month)}
                >
                  <Text
                    style={[
                      styles.chartSupplierChipText,
                      isActive && styles.chartSupplierChipTextActive,
                    ]}
                  >
                    {month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {topProductsLoading ? (
          <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
        ) : null}

        {topProductsError ? <Text style={styles.errorText}>{topProductsError}</Text> : null}

        {!topProductsLoading && !topProductsError && chartSuppliers.length > 0 && topProducts.length === 0 ? (
          <Text style={styles.subtitle}>{text.dashboard.topProductsEmpty}</Text>
        ) : null}

        {topProducts.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chartWrap}
            contentContainerStyle={styles.chartScrollContent}
          >
            {(() => {
              const maxQuantity = Math.max(
                ...topProducts.map((product) => product.totalQuantity),
                1,
              );
              const yTicks = [0, 0.25, 0.5, 0.75, 1];
              const axisLeft = 34;
              const axisTop = 34;
              const plotHeight = 176;
              const axisBottom = axisTop + plotHeight;
              const pointGap = 96;
              const axisRight = axisLeft + (topProducts.length - 1) * pointGap;

              const points = topProducts.map((product, index) => {
                const ratio = Math.max(0, Math.min(1, product.totalQuantity / maxQuantity));
                return {
                  product,
                  x: axisLeft + index * pointGap,
                  y: axisTop + (1 - ratio) * plotHeight,
                };
              });

              return (
                <View style={[styles.lineChartCanvas, { width: axisRight + 24 }]}>
                  {yTicks.map((tick) => {
                    const y = axisTop + (1 - tick) * plotHeight;
                    const tickLabel = Math.round(maxQuantity * tick);

                    return (
                      <View key={`tick-${tick}`} style={[styles.lineChartGridRow, { top: y }]}> 
                        <Text style={styles.lineChartYLabel}>{tickLabel}</Text>
                        <View style={styles.lineChartGridLine} />
                      </View>
                    );
                  })}

                  <View style={[styles.lineChartAxisY, { left: axisLeft, top: axisTop, height: plotHeight }]} />
                  <View style={[styles.lineChartAxisX, { left: axisLeft, top: axisBottom, width: axisRight - axisLeft }]} />

                  {points.slice(0, -1).map((point, index) => {
                    const nextPoint = points[index + 1];
                    const dx = nextPoint.x - point.x;
                    const dy = nextPoint.y - point.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

                    return (
                      <View
                        key={`segment-${point.product.month}-${point.product.productId}`}
                        style={[
                          styles.lineChartSegment,
                          {
                            left: point.x + dx / 2 - length / 2,
                            top: point.y + dy / 2 - 1,
                            width: length,
                            transform: [{ rotate: `${angle}deg` }],
                          },
                        ]}
                      />
                    );
                  })}

                  {points.map(({ product, x, y }) => {
                    const label =
                      product.nameFr?.trim() || product.nameZh?.trim() || `${product.productId}`;

                    return (
                      <View key={`point-${product.month}-${product.supplierId}-${product.productId}`}>
                        <View style={[styles.lineChartPoint, { left: x - 4, top: y - 4 }]} />
                        <Text style={[styles.lineChartValue, { left: x - 18, top: y - 24 }]}>
                          {product.totalQuantity}
                        </Text>
                        <Text
                          style={[styles.lineChartProductLabel, { left: x - 40, top: axisBottom + 10 }]}
                          numberOfLines={2}
                        >
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </ScrollView>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.stackCardWrap}>
      <View style={isSupervisor ? styles.managerDashboardLayout : undefined}>
        <View style={isSupervisor ? styles.managerLeftColumn : undefined}>
          <View style={[styles.card, isSupervisor && styles.managerLeftCard]}>
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

          {isAdmin ? renderLevelQuickBlock() : null}

          {isAdmin ? (
            <>
              <AdminRestaurantPanel accessToken={accessToken} text={text} />
              <AdminTrainingAccessPanel
                accessToken={accessToken}
                currentUser={user}
                text={text}
              />
              <AdminUploadPanel accessToken={accessToken} text={text} />
            </>
          ) : null}

          {isManager ? renderTopProductsChart() : null}
        </View>

        {isSupervisor ? (
          <View style={styles.quickColumn}>
            {!isAdmin ? renderLevelQuickBlock() : null}
            {renderManagerQuickBlocks()}
          </View>
        ) : null}
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

      {user.role === 'EMPLOYEE' ? (
        <View style={styles.card}>
          <Text style={styles.subtitle}>{text.dashboard.uploadPermission}</Text>
        </View>
      ) : null}
    </View>
  );
}
