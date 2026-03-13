import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import * as DocumentPicker from 'expo-document-picker';
import { AdminRestaurantPanel } from '../AdminRestaurantPanel';
import { AdminTrainingAccessPanel } from '../AdminTrainingAccessPanel';
import { AdminUploadPanel } from '../AdminUploadPanel';
import { ConfirmDialog } from '../ConfirmDialog';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { EmployeeLevel, User, WorkplaceRole } from '../../types/auth';
import {
  approveUserAccount,
  deleteUserAccount,
  fetchTrainingAccessUsers,
  updateUserWorkplaceRole,
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
import {
  uploadSingleFile,
  type UploadedFileResponse,
} from '../../services/uploadsApi';
import {
  createNewsPost,
  deleteNewsPost,
  fetchNewsReadTracking,
  fetchNewsFeed,
  markNewsAsRead,
  type NewsAudience,
  type NewsReadTrackingResponse,
  type NewsPostItem,
} from '../../services/newsApi';

type SessionCardProps = {
  user: User;
  accessToken: string;
  text: AppText;
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

const WORKPLACE_ROLES: WorkplaceRole[] = ['SALLE', 'CUISINE', 'BOTH'];

const PICKER_TYPES = [
  'image/*',
  'video/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const NEWS_ATTACHMENT_MODULE = 'TRAINING';
const NEWS_ATTACHMENT_SECTION = 'RECIPE_TRAINING';
type NewsLane = 'NEWS' | 'CONGRATS' | 'CRITIQUE';

const NEWS_LANE_MARKERS: Record<NewsLane, string> = {
  NEWS: '[NEWS]',
  CONGRATS: '[CONGRATS]',
  CRITIQUE: '[CRITIQUE]',
};

function getNewsLaneFromTitle(title: string): NewsLane {
  const normalizedTitle = title.trim().toUpperCase();
  if (normalizedTitle.startsWith(NEWS_LANE_MARKERS.CONGRATS)) {
    return 'CONGRATS';
  }
  if (normalizedTitle.startsWith(NEWS_LANE_MARKERS.CRITIQUE)) {
    return 'CRITIQUE';
  }
  return 'NEWS';
}

function stripNewsLaneMarker(title: string): string {
  return title.replace(/^\s*\[(NEWS|CONGRATS|CRITIQUE)\]\s*/i, '').trim();
}

function normalizeNewsTagKey(tag: string): string {
  return tag.trim().toLocaleLowerCase();
}

function parseNewsTagsInput(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const entry of value.split(/[\n,]/)) {
    const normalizedTag = entry.trim().replace(/^#+/, '').replace(/\s+/g, ' ');

    if (!normalizedTag) {
      continue;
    }

    const key = normalizeNewsTagKey(normalizedTag);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(normalizedTag);
  }

  return tags;
}

function formatNewsTag(tag: string): string {
  return `#${tag}`;
}

function getNewsAudienceLabel(audience: NewsAudience, text: AppText): string {
  if (audience === 'MANAGERS') {
    return text.dashboard.whatsNewAudienceManagers;
  }

  if (audience === 'EMPLOYEES') {
    return text.dashboard.whatsNewAudienceEmployees;
  }

  return text.dashboard.whatsNewAudienceAll;
}

function getVisibleLevelsSummary(
  visibleEmployeeLevels: EmployeeLevel[],
  text: AppText,
): string {
  if (visibleEmployeeLevels.length === 0) {
    return text.dashboard.newsVisibleLevelsAll;
  }

  const labels = visibleEmployeeLevels.map(
    (level) => text.dashboard.levels[level],
  );

  if (labels.length <= 2) {
    return labels.join(' / ');
  }

  return `${labels.slice(0, 2).join(' / ')} +${labels.length - 2}`;
}

export function SessionCard({ user, accessToken, text }: SessionCardProps) {
  const isManager = user.role === 'MANAGER';
  const isAdmin = user.role === 'ADMIN';
  const isSupervisor = isManager || isAdmin;

  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [levelBlockError, setLevelBlockError] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [levelSearch, setLevelSearch] = useState('');
  const [isApprovingUserId, setIsApprovingUserId] = useState<number | null>(
    null,
  );
  const [isUpdatingLevelUserId, setIsUpdatingLevelUserId] = useState<
    number | null
  >(null);
  const [isUpdatingWorkplaceUserId, setIsUpdatingWorkplaceUserId] = useState<
    number | null
  >(null);
  const [isDeletingUserId, setIsDeletingUserId] = useState<number | null>(null);
  const [levelEditorUser, setLevelEditorUser] =
    useState<TrainingAccessUser | null>(null);
  const [openRestaurantFilterFor, setOpenRestaurantFilterFor] = useState<
    'approval' | 'level' | null
  >(null);
  const [
    selectedEmployeeRestaurantFilter,
    setSelectedEmployeeRestaurantFilter,
  ] = useState<number | 'ALL' | 'NONE'>('ALL');

  const [latestOrder, setLatestOrder] = useState<OrderSummary | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [topProducts, setTopProducts] = useState<TopOrderedProduct[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [topProductsError, setTopProductsError] = useState<string | null>(null);
  const [chartSuppliers, setChartSuppliers] = useState<SupplierItem[]>([]);
  const [selectedChartSupplierId, setSelectedChartSupplierId] = useState<
    number | null
  >(null);
  const [chartMonths, setChartMonths] = useState<string[]>([]);
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(
    null,
  );
  const [orderPreviewUrl, setOrderPreviewUrl] = useState<string | null>(null);
  const [orderPreviewLoading, setOrderPreviewLoading] = useState(false);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);
  const [whatsNewUploading, setWhatsNewUploading] = useState(false);
  const [whatsNewError, setWhatsNewError] = useState<string | null>(null);
  const [whatsNewLastUpload, setWhatsNewLastUpload] =
    useState<UploadedFileResponse | null>(null);
  const [whatsNewTitle, setWhatsNewTitle] = useState('');
  const [whatsNewMessage, setWhatsNewMessage] = useState('');
  const [whatsNewTagsInput, setWhatsNewTagsInput] = useState('');
  const [whatsNewLane, setWhatsNewLane] = useState<NewsLane>('NEWS');
  const [whatsNewVisibleLevels, setWhatsNewVisibleLevels] = useState<
    EmployeeLevel[]
  >([]);
  const [whatsNewPublishing, setWhatsNewPublishing] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsPostItem[]>([]);
  const [newsFeedLoading, setNewsFeedLoading] = useState(false);
  const [newsFeedError, setNewsFeedError] = useState<string | null>(null);
  const [newsFeedMonths, setNewsFeedMonths] = useState<string[]>([]);
  const [newsFeedTags, setNewsFeedTags] = useState<string[]>([]);
  const [selectedNewsMonth, setSelectedNewsMonth] = useState<string>('ALL');
  const [selectedNewsTag, setSelectedNewsTag] = useState<string>('ALL');
  const [deletingNewsId, setDeletingNewsId] = useState<number | null>(null);
  const [markingNewsReadId, setMarkingNewsReadId] = useState<number | null>(
    null,
  );
  const [expandedNewsTrackingId, setExpandedNewsTrackingId] = useState<
    number | null
  >(null);
  const [loadingNewsTrackingId, setLoadingNewsTrackingId] = useState<
    number | null
  >(null);
  const [newsTrackingByPostId, setNewsTrackingByPostId] = useState<
    Record<number, NewsReadTrackingResponse>
  >({});
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    destructive: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: text.adminTraining.confirmProbationCancel,
    destructive: true,
  });
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);
  const parsedWhatsNewTags = useMemo(
    () => parseNewsTagsInput(whatsNewTagsInput),
    [whatsNewTagsInput],
  );

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
          result.filter(
            (entry) => entry.role !== 'ADMIN' && entry.id !== user.id,
          ),
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

  useEffect(() => {
    let isActive = true;
    setNewsFeedLoading(true);
    setNewsFeedError(null);

    void fetchNewsFeed(accessToken, {
      limit: 24,
      month: selectedNewsMonth === 'ALL' ? undefined : selectedNewsMonth,
      tag: selectedNewsTag === 'ALL' ? undefined : selectedNewsTag,
    })
      .then((payload) => {
        if (isActive) {
          setNewsFeed(payload.items);
          setNewsFeedMonths(payload.availableMonths);
          setNewsFeedTags(payload.availableTags);

          if (
            selectedNewsMonth !== 'ALL' &&
            !payload.availableMonths.includes(selectedNewsMonth)
          ) {
            setSelectedNewsMonth('ALL');
          }

          if (
            selectedNewsTag !== 'ALL' &&
            !payload.availableTags.some(
              (tag) =>
                normalizeNewsTagKey(tag) ===
                normalizeNewsTagKey(selectedNewsTag),
            )
          ) {
            setSelectedNewsTag('ALL');
          }
        }
      })
      .catch(() => {
        if (isActive) {
          setNewsFeed([]);
          setNewsFeedMonths([]);
          setNewsFeedTags([]);
          setNewsFeedError(text.dashboard.newsLoadError);
        }
      })
      .finally(() => {
        if (isActive) {
          setNewsFeedLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    accessToken,
    selectedNewsMonth,
    selectedNewsTag,
    text.dashboard.newsLoadError,
  ]);

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

    return users.filter(
      (entry) => entry.restaurantId === selectedEmployeeRestaurantFilter,
    );
  }, [isAdmin, selectedEmployeeRestaurantFilter, users]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    if (
      typeof selectedEmployeeRestaurantFilter === 'number' &&
      !employeeRestaurantOptions.some(
        (restaurant) => restaurant.id === selectedEmployeeRestaurantFilter,
      )
    ) {
      setSelectedEmployeeRestaurantFilter('ALL');
    }
  }, [employeeRestaurantOptions, isAdmin, selectedEmployeeRestaurantFilter]);

  const accountApprovalUsers = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return usersFilteredByRestaurant
      .filter(
        (entry) =>
          !entry.isApproved &&
          entry.role === (isAdmin ? 'MANAGER' : 'EMPLOYEE'),
      )
      .filter((entry) => {
        if (!query) {
          return true;
        }

        const name = entry.name?.toLowerCase() ?? '';
        return (
          name.includes(query) || entry.email.toLowerCase().includes(query)
        );
      });
  }, [accountSearch, isAdmin, usersFilteredByRestaurant]);

  const deletionUsers = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return usersFilteredByRestaurant
      .filter((entry) => entry.role === 'EMPLOYEE')
      .filter((entry) => {
        if (!query) {
          return true;
        }

        const name = entry.name?.toLowerCase() ?? '';
        return (
          name.includes(query) || entry.email.toLowerCase().includes(query)
        );
      });
  }, [accountSearch, usersFilteredByRestaurant]);

  const levelUsers = useMemo(() => {
    const query = levelSearch.trim().toLowerCase();
    return usersFilteredByRestaurant
      .filter((entry) => entry.role === 'EMPLOYEE')
      .filter((entry) => {
        if (!query) {
          return true;
        }

        const name = entry.name?.toLowerCase() ?? '';
        return (
          name.includes(query) || entry.email.toLowerCase().includes(query)
        );
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
        <Text style={styles.quickSectionTitle}>
          {text.dashboard.quickRestaurantFilterTitle}
        </Text>
        <View style={styles.restaurantFilterSelectWrap}>
          <Pressable
            style={styles.restaurantFilterSelectTrigger}
            onPress={() =>
              setOpenRestaurantFilterFor((current) =>
                current === section ? null : section,
              )
            }
          >
            <Text style={styles.restaurantFilterSelectText}>
              {getSelectedRestaurantFilterLabel()}
            </Text>
            <Text style={styles.restaurantFilterSelectChevron}>
              {isOpen ? '▲' : '▼'}
            </Text>
          </Pressable>

          {isOpen ? (
            <View style={styles.restaurantFilterSelectList}>
              {options.map((option, index) => {
                const isActive =
                  selectedEmployeeRestaurantFilter === option.value;

                return (
                  <Pressable
                    key={`restaurant-filter-option-${option.key}`}
                    style={[
                      styles.restaurantFilterSelectItem,
                      isActive && styles.restaurantFilterSelectItemActive,
                      index === options.length - 1 &&
                        styles.restaurantFilterSelectItemLast,
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

  async function confirmAction(
    title: string,
    message: string,
    confirmLabel: string,
  ) {
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmDialog({
        visible: true,
        title,
        message,
        confirmLabel,
        cancelLabel: text.adminTraining.confirmProbationCancel,
        destructive: true,
      });
    });
  }

  function closeConfirmDialog(value: boolean) {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }
    setConfirmDialog((current) => ({ ...current, visible: false }));
  }

  async function handleApproveAccount(entry: TrainingAccessUser) {
    const confirmed = await confirmAction(
      isAdmin
        ? text.dashboard.quickApproveManagerTitle
        : text.dashboard.quickApproveTitle,
      entry.role === 'MANAGER'
        ? text.adminTraining.approveManagerAccountMessage
        : text.adminTraining.approveAccountMessage,
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

  async function handleUpdateEmployeeLevel(
    entry: TrainingAccessUser,
    level: EmployeeLevel,
  ) {
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
    setLevelBlockError(null);

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
      setLevelEditorUser((current) =>
        current?.id === entry.id ? null : current,
      );
    } catch {
      setLevelBlockError(text.dashboard.levelUpdateError);
    } finally {
      setIsUpdatingLevelUserId(null);
    }
  }

  async function handleUpdateEmployeeWorkplaceRole(
    entry: TrainingAccessUser,
    workplaceRole: WorkplaceRole,
  ) {
    if (entry.workplaceRole === workplaceRole) {
      return;
    }

    const workplaceLabel = text.dashboard.workplaceValues[workplaceRole];
    const confirmed = await confirmAction(
      text.dashboard.workplace,
      `${text.dashboard.workplace}: ${workplaceLabel} ?`,
      text.adminTraining.confirmProbationConfirm,
    );

    if (!confirmed) {
      return;
    }

    setIsUpdatingWorkplaceUserId(entry.id);
    setLevelBlockError(null);

    try {
      const updated = await updateUserWorkplaceRole(
        accessToken,
        entry.id,
        workplaceRole,
      );
      setUsers((current) =>
        current.map((userEntry) =>
          userEntry.id === updated.id
            ? {
                ...userEntry,
                workplaceRole: updated.workplaceRole,
              }
            : userEntry,
        ),
      );
    } catch {
      setLevelBlockError(text.dashboard.workplaceUpdateError);
    } finally {
      setIsUpdatingWorkplaceUserId(null);
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
      setUsers((current) =>
        current.filter((userEntry) => userEntry.id !== entry.id),
      );
    } finally {
      setIsDeletingUserId(null);
    }
  }

  async function handleWhatsNewUpload() {
    setWhatsNewError(null);

    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: PICKER_TYPES,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      return;
    }

    setWhatsNewUploading(true);
    try {
      const response = await uploadSingleFile(
        accessToken,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? undefined,
          file: (asset as { file?: File }).file,
        },
        {
          module: NEWS_ATTACHMENT_MODULE,
          section: NEWS_ATTACHMENT_SECTION,
        },
      );
      setWhatsNewLastUpload(response);
    } catch {
      setWhatsNewError(text.upload.error);
    } finally {
      setWhatsNewUploading(false);
    }
  }

  async function handlePublishWhatsNew() {
    const title = whatsNewTitle.trim();
    const message = whatsNewMessage.trim();
    const tags = parseNewsTagsInput(whatsNewTagsInput);

    if (!title || !message) {
      setWhatsNewError(text.dashboard.whatsNewValidationError);
      return;
    }

    setWhatsNewPublishing(true);
    setWhatsNewError(null);

    try {
      const createdPost = await createNewsPost(accessToken, {
        title: `${NEWS_LANE_MARKERS[whatsNewLane]} ${title}`,
        message,
        tags,
        visibleEmployeeLevels: whatsNewVisibleLevels,
        attachmentDocumentId: whatsNewLastUpload?.documentId,
      });

      const createdMonth = `${new Date(createdPost.createdAt).getUTCFullYear()}-${`${new Date(createdPost.createdAt).getUTCMonth() + 1}`.padStart(2, '0')}`;
      const matchesSelectedMonth =
        selectedNewsMonth === 'ALL' || selectedNewsMonth === createdMonth;
      const matchesSelectedTag =
        selectedNewsTag === 'ALL' ||
        createdPost.tags.some(
          (tag) =>
            normalizeNewsTagKey(tag) === normalizeNewsTagKey(selectedNewsTag),
        );

      setNewsFeed((current) =>
        matchesSelectedMonth && matchesSelectedTag
          ? [createdPost, ...current].slice(0, 24)
          : current,
      );
      setNewsFeedMonths((current) => {
        return current.includes(createdMonth)
          ? current
          : [createdMonth, ...current];
      });
      setNewsFeedTags((current) =>
        Array.from(new Set([...current, ...createdPost.tags])).sort(
          (left, right) => left.localeCompare(right),
        ),
      );
      setWhatsNewTitle('');
      setWhatsNewMessage('');
      setWhatsNewTagsInput('');
      setWhatsNewLane('NEWS');
      setWhatsNewVisibleLevels([]);
      setWhatsNewLastUpload(null);
    } catch {
      setWhatsNewError(text.dashboard.whatsNewPublishError);
    } finally {
      setWhatsNewPublishing(false);
    }
  }

  async function handleOpenNews(post: NewsPostItem) {
    if (post.attachment?.fileUrl) {
      void Linking.openURL(post.attachment.fileUrl);
    }
  }

  async function handleConfirmNewsRead(post: NewsPostItem) {
    if (post.isRead || markingNewsReadId === post.id) {
      return;
    }

    setMarkingNewsReadId(post.id);

    try {
      await markNewsAsRead(accessToken, post.id);
      setNewsFeed((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, isRead: true } : item,
        ),
      );
    } catch {
      setNewsFeedError(text.dashboard.newsReadConfirmError);
    } finally {
      setMarkingNewsReadId(null);
    }
  }

  async function handleToggleReadTracking(post: NewsPostItem) {
    if (!isAdmin) {
      return;
    }

    if (expandedNewsTrackingId === post.id) {
      setExpandedNewsTrackingId(null);
      return;
    }

    setExpandedNewsTrackingId(post.id);
    setNewsFeedError(null);

    if (newsTrackingByPostId[post.id]) {
      return;
    }

    setLoadingNewsTrackingId(post.id);
    try {
      const tracking = await fetchNewsReadTracking(accessToken, post.id);
      setNewsTrackingByPostId((current) => ({
        ...current,
        [post.id]: tracking,
      }));
    } catch {
      setNewsFeedError(text.dashboard.newsReadTrackingError);
    } finally {
      setLoadingNewsTrackingId(null);
    }
  }

  async function handleDeleteNews(post: NewsPostItem) {
    if (!isAdmin) {
      return;
    }

    const confirmed = await confirmAction(
      text.dashboard.newsDeleteTitle,
      text.dashboard.newsDeleteMessage,
      text.dashboard.newsDeleteConfirm,
    );
    if (!confirmed) {
      return;
    }

    setDeletingNewsId(post.id);
    setNewsFeedError(null);
    try {
      await deleteNewsPost(accessToken, post.id);
      setNewsFeed((current) => current.filter((item) => item.id !== post.id));
    } catch {
      setNewsFeedError(text.dashboard.newsDeleteError);
    } finally {
      setDeletingNewsId(null);
    }
  }

  function renderWhatsNewUploadCard() {
    const hasAttachment = Boolean(whatsNewLastUpload);

    return (
      <View style={[styles.quickBlock, styles.whatsNewHighlightBlock]}>
        <View style={styles.whatsNewHeader}>
          <View style={styles.whatsNewHeaderMain}>
            <View style={styles.whatsNewHeaderIconWrap}>
              <Ionicons name="megaphone-outline" size={18} color="#ffffff" />
            </View>
            <View style={styles.whatsNewHeaderTitleWrap}>
              <Text style={styles.panelTitleOnDark}>
                {text.dashboard.whatsNewTitle}
              </Text>
            </View>
          </View>
          <View style={styles.whatsNewStatusPill}>
            <Text style={styles.whatsNewStatusPillText}>
              {hasAttachment
                ? text.dashboard.whatsNewAttachmentReady
                : text.dashboard.whatsNewCta}
            </Text>
          </View>
        </View>

        <View style={styles.whatsNewIntroStrip}>
          <Text style={styles.whatsNewKicker}>
            {text.dashboard.whatsNewSubtitle}
          </Text>
        </View>

        <View style={styles.whatsNewFieldBlock}>
          <Text style={styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewTypeLabel}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.whatsNewTypeTabs}
          >
            {(
              [
                {
                  key: 'NEWS',
                  label: text.dashboard.whatsNewTypeNews,
                  icon: '📰',
                  activeBorderColor: 'rgba(171,30,36,0.45)',
                  activeBackgroundColor: 'rgba(171,30,36,0.12)',
                },
                {
                  key: 'CONGRATS',
                  label: text.dashboard.whatsNewTypeCongrats,
                  icon: '🎉',
                  activeBorderColor: 'rgba(198,90,110,0.45)',
                  activeBackgroundColor: 'rgba(198,90,110,0.12)',
                },
                {
                  key: 'CRITIQUE',
                  label: text.dashboard.whatsNewTypeCritique,
                  icon: '⚠️',
                  activeBorderColor: 'rgba(145,24,30,0.45)',
                  activeBackgroundColor: 'rgba(145,24,30,0.14)',
                },
              ] as const
            ).map((option) => {
              const isActive = whatsNewLane === option.key;
              return (
                <Pressable
                  key={`whats-new-lane-${option.key}`}
                  style={[
                    styles.whatsNewTypeChip,
                    isActive && styles.whatsNewTypeChipActive,
                    isActive && {
                      borderColor: option.activeBorderColor,
                      backgroundColor: option.activeBackgroundColor,
                    },
                  ]}
                  onPress={() => setWhatsNewLane(option.key)}
                >
                  <Text
                    style={[
                      styles.whatsNewTypeChipText,
                      isActive && styles.whatsNewTypeChipTextActive,
                    ]}
                  >
                    {`${option.icon} ${option.label}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.whatsNewFieldBlock}>
          <Text style={styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewTitlePlaceholder}
          </Text>
          <TextInput
            style={styles.whatsNewInput}
            value={whatsNewTitle}
            onChangeText={setWhatsNewTitle}
            placeholder={text.dashboard.whatsNewTitlePlaceholder}
            placeholderTextColor="#a98a8d"
          />
        </View>

        <View style={styles.whatsNewFieldBlock}>
          <Text style={styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewMessagePlaceholder}
          </Text>
          <TextInput
            style={[styles.whatsNewInput, styles.whatsNewMessageInput]}
            value={whatsNewMessage}
            onChangeText={setWhatsNewMessage}
            placeholder={text.dashboard.whatsNewMessagePlaceholder}
            placeholderTextColor="#a98a8d"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.whatsNewFieldBlock}>
          <Text style={styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewTagsLabel}
          </Text>
          <TextInput
            style={styles.whatsNewInput}
            value={whatsNewTagsInput}
            onChangeText={setWhatsNewTagsInput}
            placeholder={text.dashboard.whatsNewTagsPlaceholder}
            placeholderTextColor="#a98a8d"
          />
          <Text style={styles.panelSubtitleOnDark}>
            {text.dashboard.whatsNewTagsHint}
          </Text>
          {parsedWhatsNewTags.length > 0 ? (
            <View style={styles.newsTagRow}>
              {parsedWhatsNewTags.map((tag) => (
                <View
                  key={`whats-new-tag-${tag}`}
                  style={styles.newsIndexedTag}
                >
                  <Text style={styles.newsIndexedTagText}>
                    {formatNewsTag(tag)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.whatsNewFieldBlock}>
          <Text style={styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewVisibleLevelsLabel}
          </Text>
          <Text style={styles.panelSubtitleOnDark}>
            {text.dashboard.whatsNewVisibleLevelsHint}
          </Text>
          <View style={styles.whatsNewLevelsWrap}>
            <Pressable
              style={[
                styles.whatsNewLevelChip,
                whatsNewVisibleLevels.length === 0 &&
                  styles.whatsNewLevelChipActive,
              ]}
              onPress={() => setWhatsNewVisibleLevels([])}
            >
              <Text
                style={[
                  styles.whatsNewLevelChipText,
                  whatsNewVisibleLevels.length === 0 &&
                    styles.whatsNewLevelChipTextActive,
                ]}
              >
                {text.dashboard.newsVisibleLevelsAll}
              </Text>
            </Pressable>

            {EMPLOYEE_LEVELS.map((level) => {
              const isActive = whatsNewVisibleLevels.includes(level);
              return (
                <Pressable
                  key={`whats-new-visible-level-${level}`}
                  style={[
                    styles.whatsNewLevelChip,
                    isActive && styles.whatsNewLevelChipActive,
                  ]}
                  onPress={() =>
                    setWhatsNewVisibleLevels((current) =>
                      current.includes(level)
                        ? current.filter((entry) => entry !== level)
                        : [...current, level],
                    )
                  }
                >
                  <Text
                    style={[
                      styles.whatsNewLevelChipText,
                      isActive && styles.whatsNewLevelChipTextActive,
                    ]}
                  >
                    {text.dashboard.levels[level]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.whatsNewActionRow}>
          <Pressable
            style={[
              styles.whatsNewPublishButton,
              styles.whatsNewActionButton,
              whatsNewPublishing && styles.buttonDisabled,
            ]}
            disabled={whatsNewPublishing}
            onPress={() => {
              void handlePublishWhatsNew();
            }}
          >
            <Text style={styles.whatsNewPublishButtonText}>
              {whatsNewPublishing
                ? text.dashboard.whatsNewPublishing
                : text.dashboard.whatsNewCta}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.whatsNewSecondaryButton,
              styles.whatsNewActionButton,
              whatsNewUploading && styles.buttonDisabled,
            ]}
            disabled={whatsNewUploading}
            onPress={() => {
              void handleWhatsNewUpload();
            }}
          >
            <Text style={styles.whatsNewSecondaryButtonText}>
              {whatsNewUploading
                ? text.upload.uploading
                : text.dashboard.whatsNewAttachCta}
            </Text>
          </Pressable>
        </View>

        {whatsNewError ? (
          <Text style={styles.errorText}>{whatsNewError}</Text>
        ) : null}

        {whatsNewLastUpload ? (
          <View style={styles.whatsNewAttachmentCard}>
            <Text style={styles.panelSectionLabelOnDark}>
              {text.dashboard.whatsNewAttachmentReady}
            </Text>
            <Text style={styles.panelSubtitleOnDark}>
              {whatsNewLastUpload.originalName}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  function renderNewsFeedCard() {
    const unreadCount = newsFeed.filter((item) => !item.isRead).length;
    const laneConfigs: Array<{
      key: NewsLane;
      label: string;
      icon: string;
      color: string;
      badgeBorder: string;
      badgeBackground: string;
    }> = [
      {
        key: 'NEWS',
        label: text.dashboard.newsColumnNews,
        icon: '📰',
        color: '#c9545b',
        badgeBorder: 'rgba(201,84,91,0.56)',
        badgeBackground: 'rgba(201,84,91,0.14)',
      },
      {
        key: 'CONGRATS',
        label: text.dashboard.newsColumnCongrats,
        icon: '🎉',
        color: '#d77a95',
        badgeBorder: 'rgba(215,122,149,0.56)',
        badgeBackground: 'rgba(215,122,149,0.14)',
      },
      {
        key: 'CRITIQUE',
        label: text.dashboard.newsColumnCritique,
        icon: '⚠️',
        color: '#ab1e24',
        badgeBorder: 'rgba(171,30,36,0.56)',
        badgeBackground: 'rgba(171,30,36,0.16)',
      },
    ];

    const lanePosts = newsFeed
      .slice(0, 24)
      .reduce<Record<NewsLane, NewsPostItem[]>>(
        (accumulator, post) => {
          const lane = getNewsLaneFromTitle(post.title);
          accumulator[lane].push(post);
          return accumulator;
        },
        {
          NEWS: [],
          CONGRATS: [],
          CRITIQUE: [],
        },
      );

    return (
      <View style={[styles.quickBlock, styles.newsFeedHighlightBlock]}>
        <View style={styles.quickNewsHeader}>
          <View style={styles.newsFeedTitleRow}>
            <View style={styles.newsFeedIconWrap}>
              <Ionicons name="sparkles-outline" size={16} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.panelTitleOnDark}>
                {text.dashboard.newsFeedTitle}
              </Text>
              <Text style={styles.newsFeedKicker}>QUOI DE NEUF</Text>
            </View>
          </View>
          {unreadCount > 0 ? (
            <Text
              style={styles.quickUnreadBadge}
            >{`${unreadCount} ${text.dashboard.newsUnreadLabel}`}</Text>
          ) : null}
        </View>
        <View style={styles.newsFeedIntroStrip}>
          <Text style={styles.panelSubtitleOnDark}>
            {text.dashboard.newsFeedSubtitle}
          </Text>
        </View>

        <Text style={styles.panelSectionLabelOnDark}>
          {text.dashboard.newsMonthFilterLabel}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newsFilterTabs}
        >
          <Pressable
            style={[
              styles.newsFilterChip,
              selectedNewsMonth === 'ALL' && styles.newsFilterChipActive,
            ]}
            onPress={() => setSelectedNewsMonth('ALL')}
          >
            <Text
              style={[
                styles.newsFilterChipText,
                selectedNewsMonth === 'ALL' && styles.newsFilterChipTextActive,
              ]}
            >
              {text.dashboard.newsMonthFilterAll}
            </Text>
          </Pressable>

          {newsFeedMonths.map((month) => {
            const isActive = selectedNewsMonth === month;
            return (
              <Pressable
                key={`news-month-${month}`}
                style={[
                  styles.newsFilterChip,
                  isActive && styles.newsFilterChipActive,
                ]}
                onPress={() => setSelectedNewsMonth(month)}
              >
                <Text
                  style={[
                    styles.newsFilterChipText,
                    isActive && styles.newsFilterChipTextActive,
                  ]}
                >
                  {month}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.panelSectionLabelOnDark}>
          {text.dashboard.newsTagFilterLabel}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newsFilterTabs}
        >
          <Pressable
            style={[
              styles.newsFilterChip,
              selectedNewsTag === 'ALL' && styles.newsFilterChipActive,
            ]}
            onPress={() => setSelectedNewsTag('ALL')}
          >
            <Text
              style={[
                styles.newsFilterChipText,
                selectedNewsTag === 'ALL' && styles.newsFilterChipTextActive,
              ]}
            >
              {text.dashboard.newsTagFilterAll}
            </Text>
          </Pressable>

          {newsFeedTags.map((tag) => {
            const isActive =
              normalizeNewsTagKey(selectedNewsTag) === normalizeNewsTagKey(tag);
            return (
              <Pressable
                key={`news-tag-${tag}`}
                style={[
                  styles.newsFilterChip,
                  isActive && styles.newsFilterChipActive,
                ]}
                onPress={() => setSelectedNewsTag(tag)}
              >
                <Text
                  style={[
                    styles.newsFilterChipText,
                    isActive && styles.newsFilterChipTextActive,
                  ]}
                >
                  {formatNewsTag(tag)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {newsFeedLoading ? (
          <Text style={styles.panelSubtitleOnDark}>
            {text.adminTraining.loading}
          </Text>
        ) : null}
        {newsFeedError ? (
          <Text style={styles.errorText}>{newsFeedError}</Text>
        ) : null}

        {!newsFeedLoading && !newsFeedError && newsFeed.length === 0 ? (
          <Text style={styles.panelSubtitleOnDark}>
            {text.dashboard.newsFeedEmpty}
          </Text>
        ) : null}

        {!newsFeedLoading && !newsFeedError && newsFeed.length > 0 ? (
          <View style={styles.newsBoard}>
            {laneConfigs.map((laneConfig) => (
              <View
                key={`news-lane-${laneConfig.key}`}
                style={styles.newsLaneColumn}
              >
                <View style={styles.newsLaneHeader}>
                  <View style={styles.newsLaneTitleWrap}>
                    <View
                      style={[
                        styles.newsLaneDot,
                        { backgroundColor: laneConfig.color },
                      ]}
                    />
                    <Text style={styles.newsLaneTitle}>
                      {`${laneConfig.icon} ${laneConfig.label}`}
                    </Text>
                  </View>
                  <Text style={styles.newsLaneCount}>
                    {lanePosts[laneConfig.key].length}
                  </Text>
                </View>

                <View style={styles.newsLaneBody}>
                  {lanePosts[laneConfig.key].length === 0 ? (
                    <Text style={styles.panelSubtitleOnDark}>
                      {text.dashboard.newsFeedEmpty}
                    </Text>
                  ) : (
                    lanePosts[laneConfig.key].map((post) => (
                      <Pressable
                        key={`news-${laneConfig.key}-${post.id}`}
                        style={[
                          styles.newsPostCard,
                          !post.isRead && styles.newsPostCardUnread,
                        ]}
                        onPress={() => {
                          void handleOpenNews(post);
                        }}
                      >
                        <View style={styles.newsPostMetaRow}>
                          <Text style={styles.newsPostMetaText}>
                            {new Date(post.createdAt).toLocaleString()}
                          </Text>
                          <Text
                            style={[
                              styles.newsPostTag,
                              {
                                borderColor: laneConfig.badgeBorder,
                                backgroundColor: laneConfig.badgeBackground,
                              },
                            ]}
                          >
                            {laneConfig.label}
                          </Text>
                        </View>

                        <View style={styles.quickNewsRowHeader}>
                          <Text style={styles.newsPostTitle}>
                            {stripNewsLaneMarker(post.title)}
                          </Text>

                          {!isAdmin ? (
                            <Pressable
                              style={[
                                styles.iconActionButton,
                                post.isRead && styles.newsReadConfirmButtonDone,
                                markingNewsReadId === post.id &&
                                  styles.buttonDisabled,
                              ]}
                              accessibilityLabel={
                                text.dashboard.newsConfirmReadButton
                              }
                              disabled={
                                post.isRead || markingNewsReadId === post.id
                              }
                              onPress={(event) => {
                                event.stopPropagation?.();
                                void handleConfirmNewsRead(post);
                              }}
                            >
                              <Ionicons
                                name={
                                  post.isRead
                                    ? 'checkmark-done-outline'
                                    : markingNewsReadId === post.id
                                      ? 'hourglass-outline'
                                      : 'checkmark-outline'
                                }
                                size={18}
                                color={post.isRead ? '#2f7d32' : '#7f1b21'}
                              />
                            </Pressable>
                          ) : (
                            <Pressable
                              style={[
                                styles.iconActionButton,
                                expandedNewsTrackingId === post.id &&
                                  styles.newsTrackingActiveButton,
                                loadingNewsTrackingId === post.id &&
                                  styles.buttonDisabled,
                              ]}
                              accessibilityLabel={
                                text.dashboard.newsReadTrackingButton
                              }
                              disabled={loadingNewsTrackingId === post.id}
                              onPress={(event) => {
                                event.stopPropagation?.();
                                void handleToggleReadTracking(post);
                              }}
                            >
                              <Ionicons
                                name={
                                  loadingNewsTrackingId === post.id
                                    ? 'hourglass-outline'
                                    : 'people-outline'
                                }
                                size={18}
                                color="#7f1b21"
                              />
                            </Pressable>
                          )}
                        </View>

                        <View style={styles.newsTagRow}>
                          <View style={styles.newsAudiencePill}>
                            <Text style={styles.newsAudiencePillText}>
                              {getNewsAudienceLabel(post.audience, text)}
                            </Text>
                          </View>
                          {post.tags.map((tag) => (
                            <View
                              key={`news-post-tag-${post.id}-${tag}`}
                              style={styles.newsIndexedTag}
                            >
                              <Text style={styles.newsIndexedTagText}>
                                {formatNewsTag(tag)}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <Text style={styles.newsPostBodyText}>
                          {post.message}
                        </Text>
                        <Text style={styles.newsPostMetaText}>
                          {post.createdBy.name ?? post.createdBy.email}
                        </Text>
                        <Text style={styles.newsPostMetaText}>
                          {`${text.dashboard.newsVisibleLevelsLabel}: ${getVisibleLevelsSummary(post.visibleEmployeeLevels, text)}`}
                        </Text>

                        {!isAdmin ? (
                          <Text style={styles.panelSubtitleOnDark}>
                            {post.isRead
                              ? text.dashboard.newsReadConfirmed
                              : text.dashboard.newsReadPendingConfirm}
                          </Text>
                        ) : null}

                        {post.attachment ? (
                          <Text style={styles.quickNewsLink}>
                            {post.attachment.originalName}
                          </Text>
                        ) : null}

                        {isAdmin && expandedNewsTrackingId === post.id ? (
                          <View style={styles.newsTrackingCard}>
                            {newsTrackingByPostId[post.id] ? (
                              <>
                                <Text style={styles.panelSectionLabelOnDark}>
                                  {text.dashboard.newsReadTrackingTitle}
                                </Text>
                                <Text style={styles.panelSubtitleOnDark}>
                                  {`${text.dashboard.newsReadTrackingGlobal}: ${newsTrackingByPostId[post.id].readCount}/${newsTrackingByPostId[post.id].totalUsers}`}
                                </Text>

                                {newsTrackingByPostId[post.id].byRestaurant.map(
                                  (group) => (
                                    <View
                                      key={`news-tracking-restaurant-${post.id}-${group.restaurant?.id ?? 'none'}`}
                                      style={styles.newsTrackingRestaurantGroup}
                                    >
                                      <Text
                                        style={styles.panelSectionLabelOnDark}
                                      >
                                        {group.restaurant?.name ??
                                          text.dashboard
                                            .newsReadTrackingNoRestaurant}
                                      </Text>
                                      <Text style={styles.panelSubtitleOnDark}>
                                        {`${text.dashboard.newsReadTrackingUnread}: ${group.unreadCount} | ${text.dashboard.newsReadTrackingRead}: ${group.readCount}`}
                                      </Text>

                                      {group.unreadUsers.length === 0 ? (
                                        <Text
                                          style={styles.panelSubtitleOnDark}
                                        >
                                          {
                                            text.dashboard
                                              .newsReadTrackingAllRead
                                          }
                                        </Text>
                                      ) : (
                                        group.unreadUsers.map((unreadUser) => (
                                          <Text
                                            key={`news-tracking-user-${post.id}-${unreadUser.id}`}
                                            style={styles.panelSubtitleOnDark}
                                          >
                                            {`- ${unreadUser.name ?? unreadUser.email} (${text.dashboard.roleValues[unreadUser.role]} / ${text.dashboard.levels[unreadUser.employeeLevel]})`}
                                          </Text>
                                        ))
                                      )}
                                    </View>
                                  ),
                                )}
                              </>
                            ) : (
                              <Text style={styles.panelSubtitleOnDark}>
                                {text.adminTraining.loading}
                              </Text>
                            )}
                          </View>
                        ) : null}

                        {isAdmin ? (
                          <Pressable
                            style={[
                              styles.iconDeleteButton,
                              deletingNewsId === post.id &&
                                styles.buttonDisabled,
                            ]}
                            accessibilityLabel={text.dashboard.newsDeleteButton}
                            disabled={deletingNewsId === post.id}
                            onPress={(event) => {
                              event.stopPropagation?.();
                              void handleDeleteNews(post);
                            }}
                          >
                            <Ionicons
                              name={
                                deletingNewsId === post.id
                                  ? 'hourglass-outline'
                                  : 'trash-outline'
                              }
                              size={18}
                              color="#ab1e24"
                            />
                          </Pressable>
                        ) : null}
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  function renderManagerQuickBlocks() {
    return (
      <>
        <View style={styles.quickBlock}>
          <Text style={styles.quickBlockTitle}>
            {isAdmin
              ? text.dashboard.quickApproveManagerTitle
              : text.dashboard.quickApproveTitle}
          </Text>
          {renderAdminRestaurantFilter('approval')}
          <TextInput
            style={styles.quickSearchInput}
            placeholder={text.dashboard.quickSearchPlaceholder}
            placeholderTextColor="#a98a8d"
            value={accountSearch}
            onChangeText={setAccountSearch}
          />
          {usersLoading ? (
            <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
          ) : null}
          {usersError ? (
            <Text style={styles.errorText}>{usersError}</Text>
          ) : null}
          {!usersLoading &&
          !usersError &&
          accountApprovalUsers.length === 0 ? (
            <Text style={styles.subtitle}>
              {text.dashboard.quickNoPendingAccount}
            </Text>
          ) : null}
          {accountApprovalUsers.slice(0, 4).map((entry) => (
            <View key={`approve-${entry.id}`} style={styles.quickRowCard}>
              <View style={styles.quickLevelRow}>
                <View style={styles.quickLevelInfo}>
                  <Text style={styles.quickRowTitle}>
                    {entry.name ?? entry.email}
                  </Text>
                  <Text style={styles.subtitle}>{entry.email}</Text>
                </View>
                <Pressable
                  style={[
                    styles.iconActionButton,
                    styles.iconApproveButton,
                    isApprovingUserId === entry.id && styles.buttonDisabled,
                  ]}
                  accessibilityLabel={text.adminTraining.approveAccountButton}
                  disabled={isApprovingUserId === entry.id}
                  onPress={() => {
                    void handleApproveAccount(entry);
                  }}
                >
                  <Ionicons
                    name={
                      isApprovingUserId === entry.id
                        ? 'hourglass-outline'
                        : 'checkmark-outline'
                    }
                    size={20}
                    color={
                      isApprovingUserId === entry.id ? '#7f1b21' : '#2f7d32'
                    }
                  />
                </Pressable>
              </View>
            </View>
          ))}

          {!isAdmin ? (
            <>
              <View style={styles.quickSectionDivider}>
                <Text style={styles.quickSectionTitle}>
                  {text.dashboard.quickDeleteSectionTitle}
                </Text>
              </View>

              {deletionUsers.length === 0 ? (
                <Text style={styles.subtitle}>
                  {text.dashboard.quickNoEmployee}
                </Text>
              ) : (
                deletionUsers.slice(0, 4).map((entry) => (
                  <View key={`delete-${entry.id}`} style={styles.quickRowCard}>
                    <View style={styles.quickLevelRow}>
                      <View style={styles.quickLevelInfo}>
                        <Text style={styles.quickRowTitle}>
                          {entry.name ?? entry.email}
                        </Text>
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
                          name={
                            isDeletingUserId === entry.id
                              ? 'hourglass-outline'
                              : 'close-outline'
                          }
                          size={20}
                          color="#ab1e24"
                        />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : null}
        </View>

        {!isAdmin ? (
          <View style={styles.quickBlock}>
            <Text style={styles.quickBlockTitle}>
              {text.dashboard.quickLatestOrderTitle}
            </Text>
            {orderLoading ? (
              <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
            ) : null}
            {orderError ? (
              <Text style={styles.errorText}>{orderError}</Text>
            ) : null}
            {!orderLoading && !orderError && !latestOrder ? (
              <Text style={styles.subtitle}>{text.dashboard.quickNoOrder}</Text>
            ) : null}
            {latestOrder ? (
              <View style={styles.quickRowCard}>
                <View style={styles.quickMetaInlineRow}>
                  <Text
                    style={[styles.quickMetaHeaderText, styles.quickInlineCell]}
                  >
                    {text.orders.orderNumberLabel}
                  </Text>
                  <Text
                    style={[styles.quickMetaHeaderText, styles.quickInlineCell]}
                  >
                    {text.orders.deliveryDateLabel}
                  </Text>
                  <Text
                    style={[styles.quickMetaHeaderText, styles.quickInlineCell]}
                  >
                    {text.orders.supplierLabel}
                  </Text>
                  <Text
                    style={[styles.quickMetaHeaderText, styles.quickInlineCell]}
                  >
                    {text.orders.summaryItems}
                  </Text>
                  {Platform.OS === 'web' ? (
                    <View style={styles.quickEyeSpacer} />
                  ) : null}
                </View>

                <View style={styles.quickMetaInlineRow}>
                  <Text
                    style={[styles.quickMetaValueText, styles.quickInlineCell]}
                  >
                    {latestOrder.number}
                  </Text>
                  <Text
                    style={[styles.quickMetaValueText, styles.quickInlineCell]}
                  >
                    {latestOrder.deliveryDate}
                  </Text>
                  <Text
                    style={[styles.quickMetaValueText, styles.quickInlineCell]}
                  >
                    {latestOrder.supplierName}
                  </Text>
                  <Text
                    style={[styles.quickMetaValueText, styles.quickInlineCell]}
                  >
                    {latestOrder.totalItems}
                  </Text>

                  {Platform.OS === 'web' ? (
                    <Pressable
                      style={[
                        styles.eyePreviewButton,
                        (!orderPreviewUrl || orderPreviewLoading) &&
                          styles.buttonDisabled,
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
                    <Text style={styles.secondaryButtonText}>
                      {text.orders.downloadBonButton}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}
          </View>
        ) : null}
      </>
    );
  }

  function renderLevelQuickBlock() {
    return (
      <View style={styles.quickBlock}>
        <Text style={styles.quickBlockTitle}>
          {text.dashboard.quickLevelTitle}
        </Text>
        {renderAdminRestaurantFilter('level')}
        <TextInput
          style={styles.quickSearchInput}
          placeholder={text.dashboard.quickSearchPlaceholder}
          placeholderTextColor="#a98a8d"
          value={levelSearch}
          onChangeText={setLevelSearch}
        />
        {levelBlockError ? (
          <Text style={styles.errorText}>{levelBlockError}</Text>
        ) : null}
        {levelUsers.length === 0 ? (
          <Text style={styles.subtitle}>{text.dashboard.quickNoEmployee}</Text>
        ) : (
          levelUsers.slice(0, 6).map((entry) => (
            <View key={`level-${entry.id}`} style={styles.quickRowCard}>
              <View style={styles.quickLevelRow}>
                <View style={styles.quickLevelInfo}>
                  <Text style={styles.quickRowTitle}>
                    {entry.name ?? entry.email}
                  </Text>
                  <Text style={styles.subtitle}>{entry.email}</Text>
                  <Text style={styles.subtitle}>
                    {text.dashboard.employeeLevelLabel}:{' '}
                    {text.dashboard.levels[entry.employeeLevel]}
                  </Text>
                  <Text style={styles.subtitle}>
                    {text.dashboard.workplace}:{' '}
                    {text.dashboard.workplaceValues[entry.workplaceRole]}
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

              <View style={styles.quickWorkplaceRow}>
                {WORKPLACE_ROLES.map((workplaceRole) => {
                  const isActive = entry.workplaceRole === workplaceRole;
                  const isUpdating = isUpdatingWorkplaceUserId === entry.id;

                  return (
                    <Pressable
                      key={`workplace-${entry.id}-${workplaceRole}`}
                      style={[
                        styles.quickWorkplaceChip,
                        isActive && styles.quickWorkplaceChipActive,
                        isUpdating && styles.buttonDisabled,
                      ]}
                      disabled={isUpdating}
                      onPress={() => {
                        void handleUpdateEmployeeWorkplaceRole(
                          entry,
                          workplaceRole,
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.quickWorkplaceChipText,
                          isActive && styles.quickWorkplaceChipTextActive,
                        ]}
                      >
                        {text.dashboard.workplaceValues[workplaceRole]}
                      </Text>
                    </Pressable>
                  );
                })}
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
        <Text style={styles.quickBlockTitle}>
          {text.dashboard.topProductsTitle}
        </Text>
        <Text style={styles.subtitle}>
          {text.dashboard.topProductsSubtitle}
        </Text>

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
                  style={[
                    styles.chartSupplierChip,
                    isActive && styles.chartSupplierChipActive,
                  ]}
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
                  style={[
                    styles.chartSupplierChip,
                    isActive && styles.chartSupplierChipActive,
                  ]}
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

        {topProductsError ? (
          <Text style={styles.errorText}>{topProductsError}</Text>
        ) : null}

        {!topProductsLoading &&
        !topProductsError &&
        chartSuppliers.length > 0 &&
        topProducts.length === 0 ? (
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
                const ratio = Math.max(
                  0,
                  Math.min(1, product.totalQuantity / maxQuantity),
                );
                return {
                  product,
                  x: axisLeft + index * pointGap,
                  y: axisTop + (1 - ratio) * plotHeight,
                };
              });

              return (
                <View
                  style={[styles.lineChartCanvas, { width: axisRight + 24 }]}
                >
                  {yTicks.map((tick) => {
                    const y = axisTop + (1 - tick) * plotHeight;
                    const tickLabel = Math.round(maxQuantity * tick);

                    return (
                      <View
                        key={`tick-${tick}`}
                        style={[styles.lineChartGridRow, { top: y }]}
                      >
                        <Text style={styles.lineChartYLabel}>{tickLabel}</Text>
                        <View style={styles.lineChartGridLine} />
                      </View>
                    );
                  })}

                  <View
                    style={[
                      styles.lineChartAxisY,
                      { left: axisLeft, top: axisTop, height: plotHeight },
                    ]}
                  />
                  <View
                    style={[
                      styles.lineChartAxisX,
                      {
                        left: axisLeft,
                        top: axisBottom,
                        width: axisRight - axisLeft,
                      },
                    ]}
                  />

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
                      product.nameFr?.trim() ||
                      product.nameZh?.trim() ||
                      `${product.productId}`;

                    return (
                      <View
                        key={`point-${product.month}-${product.supplierId}-${product.productId}`}
                      >
                        <View
                          style={[
                            styles.lineChartPoint,
                            { left: x - 4, top: y - 4 },
                          ]}
                        />
                        <Text
                          style={[
                            styles.lineChartValue,
                            { left: x - 18, top: y - 24 },
                          ]}
                        >
                          {product.totalQuantity}
                        </Text>
                        <Text
                          style={[
                            styles.lineChartProductLabel,
                            { left: x - 40, top: axisBottom + 10 },
                          ]}
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
      <View style={styles.announcementTopStack}>
        {renderNewsFeedCard()}
        {isAdmin ? renderWhatsNewUploadCard() : null}
      </View>

      <View style={isSupervisor ? styles.managerDashboardLayout : undefined}>
        <View style={isSupervisor ? styles.managerLeftColumn : undefined}>
          {isAdmin ? (
            <>
              <AdminTrainingAccessPanel
                accessToken={accessToken}
                currentUser={user}
                text={text}
              />
            </>
          ) : null}

          {isManager ? renderTopProductsChart() : null}
        </View>

        {isSupervisor ? (
          <View style={styles.quickColumn}>
            {isManager ? renderLevelQuickBlock() : null}
            {isAdmin ? (
              <AdminRestaurantPanel accessToken={accessToken} text={text} />
            ) : null}
            {isAdmin ? (
              <AdminUploadPanel accessToken={accessToken} text={text} />
            ) : null}
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
                <Text style={styles.quickBlockTitle}>
                  {text.dashboard.quickLatestOrderTitle}
                </Text>
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
                  title={
                    latestOrder
                      ? `order-preview-${latestOrder.id}`
                      : 'order-preview'
                  }
                />
              ) : (
                <Text style={styles.subtitle}>
                  {text.dashboard.quickPreviewUnavailable}
                </Text>
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
              <Text style={styles.quickBlockTitle}>
                {text.dashboard.levelModalTitle}
              </Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setLevelEditorUser(null)}
              >
                <Text style={styles.secondaryButtonText}>
                  {text.dashboard.levelModalClose}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.levelListWrap}
              contentContainerStyle={styles.levelListContent}
            >
              {EMPLOYEE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.levelListItem,
                    levelEditorUser?.employeeLevel === level &&
                      styles.levelListItemActive,
                    isUpdatingLevelUserId === levelEditorUser?.id &&
                      styles.buttonDisabled,
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
                      levelEditorUser?.employeeLevel === level &&
                        styles.levelListItemTextActive,
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
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        cancelLabel={confirmDialog.cancelLabel}
        confirmLabel={confirmDialog.confirmLabel}
        destructive={confirmDialog.destructive}
        onCancel={() => closeConfirmDialog(false)}
        onConfirm={() => closeConfirmDialog(true)}
      />
    </View>
  );
}
