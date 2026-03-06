"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCard = SessionCard;
const react_1 = require("react");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const DocumentPicker = __importStar(require("expo-document-picker"));
const AdminRestaurantPanel_1 = require("../AdminRestaurantPanel");
const AdminTrainingAccessPanel_1 = require("../AdminTrainingAccessPanel");
const AdminUploadPanel_1 = require("../AdminUploadPanel");
const ConfirmDialog_1 = require("../ConfirmDialog");
const SessionCard_styles_1 = require("./SessionCard.styles");
const usersApi_1 = require("../../services/usersApi");
const ordersApi_1 = require("../../services/ordersApi");
const suppliersApi_1 = require("../../services/suppliersApi");
const uploadsApi_1 = require("../../services/uploadsApi");
const newsApi_1 = require("../../services/newsApi");
const EMPLOYEE_LEVELS = [
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
const WORKPLACE_ROLES = ['SALLE', 'CUISINE', 'BOTH'];
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
const NEWS_LANE_MARKERS = {
    NEWS: '[NEWS]',
    CONGRATS: '[CONGRATS]',
    CRITIQUE: '[CRITIQUE]',
};
function getNewsLaneFromTitle(title) {
    const normalizedTitle = title.trim().toUpperCase();
    if (normalizedTitle.startsWith(NEWS_LANE_MARKERS.CONGRATS)) {
        return 'CONGRATS';
    }
    if (normalizedTitle.startsWith(NEWS_LANE_MARKERS.CRITIQUE)) {
        return 'CRITIQUE';
    }
    return 'NEWS';
}
function stripNewsLaneMarker(title) {
    return title
        .replace(/^\s*\[(NEWS|CONGRATS|CRITIQUE)\]\s*/i, '')
        .trim();
}
function SessionCard({ user, accessToken, text, }) {
    const isManager = user.role === 'MANAGER';
    const isAdmin = user.role === 'ADMIN';
    const isSupervisor = isManager || isAdmin;
    const [users, setUsers] = (0, react_1.useState)([]);
    const [usersLoading, setUsersLoading] = (0, react_1.useState)(false);
    const [usersError, setUsersError] = (0, react_1.useState)(null);
    const [levelBlockError, setLevelBlockError] = (0, react_1.useState)(null);
    const [accountSearch, setAccountSearch] = (0, react_1.useState)('');
    const [levelSearch, setLevelSearch] = (0, react_1.useState)('');
    const [isApprovingUserId, setIsApprovingUserId] = (0, react_1.useState)(null);
    const [isUpdatingLevelUserId, setIsUpdatingLevelUserId] = (0, react_1.useState)(null);
    const [isUpdatingWorkplaceUserId, setIsUpdatingWorkplaceUserId] = (0, react_1.useState)(null);
    const [isDeletingUserId, setIsDeletingUserId] = (0, react_1.useState)(null);
    const [levelEditorUser, setLevelEditorUser] = (0, react_1.useState)(null);
    const [openRestaurantFilterFor, setOpenRestaurantFilterFor] = (0, react_1.useState)(null);
    const [selectedEmployeeRestaurantFilter, setSelectedEmployeeRestaurantFilter,] = (0, react_1.useState)('ALL');
    const [latestOrder, setLatestOrder] = (0, react_1.useState)(null);
    const [orderLoading, setOrderLoading] = (0, react_1.useState)(false);
    const [orderError, setOrderError] = (0, react_1.useState)(null);
    const [topProducts, setTopProducts] = (0, react_1.useState)([]);
    const [topProductsLoading, setTopProductsLoading] = (0, react_1.useState)(false);
    const [topProductsError, setTopProductsError] = (0, react_1.useState)(null);
    const [chartSuppliers, setChartSuppliers] = (0, react_1.useState)([]);
    const [selectedChartSupplierId, setSelectedChartSupplierId] = (0, react_1.useState)(null);
    const [chartMonths, setChartMonths] = (0, react_1.useState)([]);
    const [selectedChartMonth, setSelectedChartMonth] = (0, react_1.useState)(null);
    const [orderPreviewUrl, setOrderPreviewUrl] = (0, react_1.useState)(null);
    const [orderPreviewLoading, setOrderPreviewLoading] = (0, react_1.useState)(false);
    const [isOrderPreviewOpen, setIsOrderPreviewOpen] = (0, react_1.useState)(false);
    const [whatsNewUploading, setWhatsNewUploading] = (0, react_1.useState)(false);
    const [whatsNewError, setWhatsNewError] = (0, react_1.useState)(null);
    const [whatsNewLastUpload, setWhatsNewLastUpload] = (0, react_1.useState)(null);
    const [whatsNewTitle, setWhatsNewTitle] = (0, react_1.useState)('');
    const [whatsNewMessage, setWhatsNewMessage] = (0, react_1.useState)('');
    const [whatsNewLane, setWhatsNewLane] = (0, react_1.useState)('NEWS');
    const [whatsNewAudience, setWhatsNewAudience] = (0, react_1.useState)('ALL');
    const [whatsNewPublishing, setWhatsNewPublishing] = (0, react_1.useState)(false);
    const [newsFeed, setNewsFeed] = (0, react_1.useState)([]);
    const [newsFeedLoading, setNewsFeedLoading] = (0, react_1.useState)(false);
    const [newsFeedError, setNewsFeedError] = (0, react_1.useState)(null);
    const [newsFeedMonths, setNewsFeedMonths] = (0, react_1.useState)([]);
    const [selectedNewsMonth, setSelectedNewsMonth] = (0, react_1.useState)('ALL');
    const [deletingNewsId, setDeletingNewsId] = (0, react_1.useState)(null);
    const [markingNewsReadId, setMarkingNewsReadId] = (0, react_1.useState)(null);
    const [expandedNewsTrackingId, setExpandedNewsTrackingId] = (0, react_1.useState)(null);
    const [loadingNewsTrackingId, setLoadingNewsTrackingId] = (0, react_1.useState)(null);
    const [newsTrackingByPostId, setNewsTrackingByPostId] = (0, react_1.useState)({});
    const [confirmDialog, setConfirmDialog] = (0, react_1.useState)({
        visible: false,
        title: '',
        message: '',
        confirmLabel: '',
        cancelLabel: text.adminTraining.confirmProbationCancel,
        destructive: true,
    });
    const confirmResolverRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
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
        void (0, usersApi_1.fetchTrainingAccessUsers)(accessToken, isManager ? { restaurantId: managerRestaurantId } : undefined)
            .then((result) => {
            if (!isActive) {
                return;
            }
            setUsers(result.filter((entry) => entry.role !== 'ADMIN' && entry.id !== user.id));
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
    (0, react_1.useEffect)(() => {
        if (!isSupervisor) {
            return;
        }
        let isActive = true;
        setOrderLoading(true);
        setOrderError(null);
        void (0, ordersApi_1.fetchOrders)(accessToken)
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
    (0, react_1.useEffect)(() => {
        if (!isSupervisor) {
            return;
        }
        let isActive = true;
        void (0, suppliersApi_1.fetchSuppliers)(accessToken)
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
    (0, react_1.useEffect)(() => {
        if (!isSupervisor) {
            return;
        }
        if (!selectedChartSupplierId) {
            setChartMonths([]);
            setSelectedChartMonth(null);
            return;
        }
        let isActive = true;
        void (0, ordersApi_1.fetchTopOrderedProductMonths)(accessToken, selectedChartSupplierId)
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
    (0, react_1.useEffect)(() => {
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
        void (0, ordersApi_1.fetchTopOrderedProductsBySupplier)(accessToken, selectedChartSupplierId, selectedChartMonth)
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
    (0, react_1.useEffect)(() => {
        if (react_native_1.Platform.OS !== 'web') {
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
        void fetch((0, ordersApi_1.buildOrderBonUrl)(latestOrder.id), {
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
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setNewsFeedLoading(true);
        setNewsFeedError(null);
        void (0, newsApi_1.fetchNewsFeed)(accessToken, {
            limit: 24,
            month: selectedNewsMonth === 'ALL' ? undefined : selectedNewsMonth,
        })
            .then((payload) => {
            if (isActive) {
                setNewsFeed(payload.items);
                setNewsFeedMonths(payload.availableMonths);
                if (selectedNewsMonth !== 'ALL' &&
                    !payload.availableMonths.includes(selectedNewsMonth)) {
                    setSelectedNewsMonth('ALL');
                }
            }
        })
            .catch(() => {
            if (isActive) {
                setNewsFeed([]);
                setNewsFeedMonths([]);
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
    }, [accessToken, selectedNewsMonth, text.dashboard.newsLoadError]);
    const employeeRestaurantOptions = (0, react_1.useMemo)(() => {
        const restaurantsMap = new Map();
        for (const entry of users) {
            if (entry.restaurant?.id && entry.restaurant.name) {
                restaurantsMap.set(entry.restaurant.id, entry.restaurant.name);
            }
        }
        return Array.from(restaurantsMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((left, right) => left.name.localeCompare(right.name));
    }, [users]);
    const usersFilteredByRestaurant = (0, react_1.useMemo)(() => {
        if (!isAdmin || selectedEmployeeRestaurantFilter === 'ALL') {
            return users;
        }
        if (selectedEmployeeRestaurantFilter === 'NONE') {
            return users.filter((entry) => !entry.restaurantId);
        }
        return users.filter((entry) => entry.restaurantId === selectedEmployeeRestaurantFilter);
    }, [isAdmin, selectedEmployeeRestaurantFilter, users]);
    (0, react_1.useEffect)(() => {
        if (!isAdmin) {
            return;
        }
        if (typeof selectedEmployeeRestaurantFilter === 'number' &&
            !employeeRestaurantOptions.some((restaurant) => restaurant.id === selectedEmployeeRestaurantFilter)) {
            setSelectedEmployeeRestaurantFilter('ALL');
        }
    }, [employeeRestaurantOptions, isAdmin, selectedEmployeeRestaurantFilter]);
    const accountApprovalUsers = (0, react_1.useMemo)(() => {
        const query = accountSearch.trim().toLowerCase();
        return usersFilteredByRestaurant
            .filter((entry) => !entry.isApproved)
            .filter((entry) => {
            if (!query) {
                return true;
            }
            const name = entry.name?.toLowerCase() ?? '';
            return (name.includes(query) || entry.email.toLowerCase().includes(query));
        });
    }, [accountSearch, usersFilteredByRestaurant]);
    const deletionUsers = (0, react_1.useMemo)(() => {
        const query = accountSearch.trim().toLowerCase();
        return usersFilteredByRestaurant.filter((entry) => {
            if (!query) {
                return true;
            }
            const name = entry.name?.toLowerCase() ?? '';
            return name.includes(query) || entry.email.toLowerCase().includes(query);
        });
    }, [accountSearch, usersFilteredByRestaurant]);
    const levelUsers = (0, react_1.useMemo)(() => {
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
        return (employeeRestaurantOptions.find((restaurant) => restaurant.id === selectedEmployeeRestaurantFilter)?.name ?? text.dashboard.quickRestaurantFilterAll);
    }
    function renderAdminRestaurantFilter(section) {
        if (!isAdmin) {
            return null;
        }
        const isOpen = openRestaurantFilterFor === section;
        const options = [
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
        return (<react_native_1.View style={SessionCard_styles_1.styles.restaurantFilterBlock}>
        <react_native_1.Text style={SessionCard_styles_1.styles.quickSectionTitle}>
          {text.dashboard.quickRestaurantFilterTitle}
        </react_native_1.Text>
        <react_native_1.View style={SessionCard_styles_1.styles.restaurantFilterSelectWrap}>
          <react_native_1.Pressable style={SessionCard_styles_1.styles.restaurantFilterSelectTrigger} onPress={() => setOpenRestaurantFilterFor((current) => current === section ? null : section)}>
            <react_native_1.Text style={SessionCard_styles_1.styles.restaurantFilterSelectText}>
              {getSelectedRestaurantFilterLabel()}
            </react_native_1.Text>
            <react_native_1.Text style={SessionCard_styles_1.styles.restaurantFilterSelectChevron}>
              {isOpen ? '▲' : '▼'}
            </react_native_1.Text>
          </react_native_1.Pressable>

          {isOpen ? (<react_native_1.View style={SessionCard_styles_1.styles.restaurantFilterSelectList}>
              {options.map((option, index) => {
                    const isActive = selectedEmployeeRestaurantFilter === option.value;
                    return (<react_native_1.Pressable key={`restaurant-filter-option-${option.key}`} style={[
                            SessionCard_styles_1.styles.restaurantFilterSelectItem,
                            isActive && SessionCard_styles_1.styles.restaurantFilterSelectItemActive,
                            index === options.length - 1 &&
                                SessionCard_styles_1.styles.restaurantFilterSelectItemLast,
                        ]} onPress={() => {
                            setSelectedEmployeeRestaurantFilter(option.value);
                            setOpenRestaurantFilterFor(null);
                        }}>
                    <react_native_1.Text style={[
                            SessionCard_styles_1.styles.restaurantFilterSelectItemText,
                            isActive && SessionCard_styles_1.styles.restaurantFilterSelectItemTextActive,
                        ]}>
                      {option.label}
                    </react_native_1.Text>
                  </react_native_1.Pressable>);
                })}
            </react_native_1.View>) : null}
        </react_native_1.View>
      </react_native_1.View>);
    }
    async function confirmAction(title, message, confirmLabel) {
        return new Promise((resolve) => {
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
    function closeConfirmDialog(value) {
        if (confirmResolverRef.current) {
            confirmResolverRef.current(value);
            confirmResolverRef.current = null;
        }
        setConfirmDialog((current) => ({ ...current, visible: false }));
    }
    async function handleApproveAccount(entry) {
        const confirmed = await confirmAction(text.dashboard.quickApproveTitle, text.adminTraining.approveAccountMessage, text.adminTraining.approveAccountConfirm);
        if (!confirmed) {
            return;
        }
        setIsApprovingUserId(entry.id);
        try {
            const updated = await (0, usersApi_1.approveUserAccount)(accessToken, entry.id);
            setUsers((current) => current.map((userEntry) => userEntry.id === updated.id
                ? { ...userEntry, isApproved: updated.isApproved }
                : userEntry));
        }
        finally {
            setIsApprovingUserId(null);
        }
    }
    async function handleUpdateEmployeeLevel(entry, level) {
        const levelLabel = text.dashboard.levels[level];
        const confirmed = await confirmAction(text.dashboard.levelModalTitle, `${text.dashboard.levelModalTitle}: ${levelLabel} ?`, text.adminTraining.confirmProbationConfirm);
        if (!confirmed) {
            return;
        }
        setIsUpdatingLevelUserId(entry.id);
        setLevelBlockError(null);
        try {
            const updated = await (0, usersApi_1.updateUserLevel)(accessToken, entry.id, level);
            setUsers((current) => current.map((userEntry) => userEntry.id === updated.id
                ? {
                    ...userEntry,
                    role: updated.role,
                    employeeLevel: updated.employeeLevel,
                    isOnProbation: updated.isOnProbation,
                }
                : userEntry));
            setLevelEditorUser((current) => current?.id === entry.id ? null : current);
        }
        catch {
            setLevelBlockError(text.dashboard.levelUpdateError);
        }
        finally {
            setIsUpdatingLevelUserId(null);
        }
    }
    async function handleUpdateEmployeeWorkplaceRole(entry, workplaceRole) {
        if (entry.workplaceRole === workplaceRole) {
            return;
        }
        const workplaceLabel = text.dashboard.workplaceValues[workplaceRole];
        const confirmed = await confirmAction(text.dashboard.workplace, `${text.dashboard.workplace}: ${workplaceLabel} ?`, text.adminTraining.confirmProbationConfirm);
        if (!confirmed) {
            return;
        }
        setIsUpdatingWorkplaceUserId(entry.id);
        setLevelBlockError(null);
        try {
            const updated = await (0, usersApi_1.updateUserWorkplaceRole)(accessToken, entry.id, workplaceRole);
            setUsers((current) => current.map((userEntry) => userEntry.id === updated.id
                ? {
                    ...userEntry,
                    workplaceRole: updated.workplaceRole,
                }
                : userEntry));
        }
        catch {
            setLevelBlockError(text.dashboard.workplaceUpdateError);
        }
        finally {
            setIsUpdatingWorkplaceUserId(null);
        }
    }
    async function handleDeleteUser(entry) {
        const confirmed = await confirmAction(text.dashboard.quickDeleteTitle, text.dashboard.quickDeleteMessage, text.dashboard.quickDeleteConfirm);
        if (!confirmed) {
            return;
        }
        setIsDeletingUserId(entry.id);
        try {
            await (0, usersApi_1.deleteUserAccount)(accessToken, entry.id);
            setUsers((current) => current.filter((userEntry) => userEntry.id !== entry.id));
        }
        finally {
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
            const response = await (0, uploadsApi_1.uploadSingleFile)(accessToken, {
                uri: asset.uri,
                name: asset.name,
                mimeType: asset.mimeType ?? undefined,
                file: asset.file,
            }, {
                module: NEWS_ATTACHMENT_MODULE,
                section: NEWS_ATTACHMENT_SECTION,
            });
            setWhatsNewLastUpload(response);
        }
        catch {
            setWhatsNewError(text.upload.error);
        }
        finally {
            setWhatsNewUploading(false);
        }
    }
    async function handlePublishWhatsNew() {
        const title = whatsNewTitle.trim();
        const message = whatsNewMessage.trim();
        if (!title || !message) {
            setWhatsNewError(text.dashboard.whatsNewValidationError);
            return;
        }
        setWhatsNewPublishing(true);
        setWhatsNewError(null);
        try {
            const createdPost = await (0, newsApi_1.createNewsPost)(accessToken, {
                title: `${NEWS_LANE_MARKERS[whatsNewLane]} ${title}`,
                message,
                audience: whatsNewAudience,
                attachmentDocumentId: whatsNewLastUpload?.documentId,
            });
            setNewsFeed((current) => [createdPost, ...current]);
            setNewsFeedMonths((current) => {
                const createdDate = new Date(createdPost.createdAt);
                const month = `${createdDate.getUTCFullYear()}-${`${createdDate.getUTCMonth() + 1}`.padStart(2, '0')}`;
                return current.includes(month) ? current : [month, ...current];
            });
            setWhatsNewTitle('');
            setWhatsNewMessage('');
            setWhatsNewLane('NEWS');
            setWhatsNewAudience('ALL');
            setWhatsNewLastUpload(null);
        }
        catch {
            setWhatsNewError(text.dashboard.whatsNewPublishError);
        }
        finally {
            setWhatsNewPublishing(false);
        }
    }
    async function handleOpenNews(post) {
        if (post.attachment?.fileUrl) {
            void react_native_1.Linking.openURL(post.attachment.fileUrl);
        }
    }
    async function handleConfirmNewsRead(post) {
        if (post.isRead || markingNewsReadId === post.id) {
            return;
        }
        setMarkingNewsReadId(post.id);
        try {
            await (0, newsApi_1.markNewsAsRead)(accessToken, post.id);
            setNewsFeed((current) => current.map((item) => item.id === post.id ? { ...item, isRead: true } : item));
        }
        catch {
            setNewsFeedError(text.dashboard.newsReadConfirmError);
        }
        finally {
            setMarkingNewsReadId(null);
        }
    }
    async function handleToggleReadTracking(post) {
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
            const tracking = await (0, newsApi_1.fetchNewsReadTracking)(accessToken, post.id);
            setNewsTrackingByPostId((current) => ({
                ...current,
                [post.id]: tracking,
            }));
        }
        catch {
            setNewsFeedError(text.dashboard.newsReadTrackingError);
        }
        finally {
            setLoadingNewsTrackingId(null);
        }
    }
    async function handleDeleteNews(post) {
        if (!isAdmin) {
            return;
        }
        const confirmed = await confirmAction(text.dashboard.newsDeleteTitle, text.dashboard.newsDeleteMessage, text.dashboard.newsDeleteConfirm);
        if (!confirmed) {
            return;
        }
        setDeletingNewsId(post.id);
        setNewsFeedError(null);
        try {
            await (0, newsApi_1.deleteNewsPost)(accessToken, post.id);
            setNewsFeed((current) => current.filter((item) => item.id !== post.id));
        }
        catch {
            setNewsFeedError(text.dashboard.newsDeleteError);
        }
        finally {
            setDeletingNewsId(null);
        }
    }
    function renderWhatsNewUploadCard() {
        const hasAttachment = Boolean(whatsNewLastUpload);
        return (<react_native_1.View style={[SessionCard_styles_1.styles.quickBlock, SessionCard_styles_1.styles.whatsNewHighlightBlock]}>
        <react_native_1.View style={SessionCard_styles_1.styles.whatsNewHeader}>
          <react_native_1.View style={SessionCard_styles_1.styles.whatsNewHeaderMain}>
            <react_native_1.View style={SessionCard_styles_1.styles.whatsNewHeaderIconWrap}>
              <vector_icons_1.Ionicons name="megaphone-outline" size={18} color="#ffffff"/>
            </react_native_1.View>
            <react_native_1.View style={SessionCard_styles_1.styles.whatsNewHeaderTitleWrap}>
              <react_native_1.Text style={SessionCard_styles_1.styles.panelTitleOnDark}>
                {text.dashboard.whatsNewTitle}
              </react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
          <react_native_1.View style={SessionCard_styles_1.styles.whatsNewStatusPill}>
            <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewStatusPillText}>
              {hasAttachment
                ? text.dashboard.whatsNewAttachmentReady
                : text.dashboard.whatsNewCta}
            </react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.View style={SessionCard_styles_1.styles.whatsNewIntroStrip}>
          <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewKicker}>{text.dashboard.whatsNewSubtitle}</react_native_1.Text>
        </react_native_1.View>

        <react_native_1.View style={SessionCard_styles_1.styles.whatsNewFieldBlock}>
          <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewFieldLabel}>{text.dashboard.whatsNewTypeLabel}</react_native_1.Text>
          <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SessionCard_styles_1.styles.whatsNewTypeTabs}>
            {[
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
            ].map((option) => {
                const isActive = whatsNewLane === option.key;
                return (<react_native_1.Pressable key={`whats-new-lane-${option.key}`} style={[
                        SessionCard_styles_1.styles.whatsNewTypeChip,
                        isActive && SessionCard_styles_1.styles.whatsNewTypeChipActive,
                        isActive && {
                            borderColor: option.activeBorderColor,
                            backgroundColor: option.activeBackgroundColor,
                        },
                    ]} onPress={() => setWhatsNewLane(option.key)}>
                  <react_native_1.Text style={[
                        SessionCard_styles_1.styles.whatsNewTypeChipText,
                        isActive && SessionCard_styles_1.styles.whatsNewTypeChipTextActive,
                    ]}>
                    {`${option.icon} ${option.label}`}
                  </react_native_1.Text>
                </react_native_1.Pressable>);
            })}
          </react_native_1.ScrollView>
        </react_native_1.View>

        <react_native_1.View style={SessionCard_styles_1.styles.whatsNewFieldBlock}>
          <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewTitlePlaceholder}
          </react_native_1.Text>
          <react_native_1.TextInput style={SessionCard_styles_1.styles.whatsNewInput} value={whatsNewTitle} onChangeText={setWhatsNewTitle} placeholder={text.dashboard.whatsNewTitlePlaceholder} placeholderTextColor="#a98a8d"/>
        </react_native_1.View>

        <react_native_1.View style={SessionCard_styles_1.styles.whatsNewFieldBlock}>
          <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewMessagePlaceholder}
          </react_native_1.Text>
          <react_native_1.TextInput style={[SessionCard_styles_1.styles.whatsNewInput, SessionCard_styles_1.styles.whatsNewMessageInput]} value={whatsNewMessage} onChangeText={setWhatsNewMessage} placeholder={text.dashboard.whatsNewMessagePlaceholder} placeholderTextColor="#a98a8d" multiline textAlignVertical="top"/>
        </react_native_1.View>

        <react_native_1.View style={SessionCard_styles_1.styles.whatsNewFieldBlock}>
          <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewFieldLabel}>
            {text.dashboard.whatsNewAudienceLabel}
          </react_native_1.Text>
          <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SessionCard_styles_1.styles.whatsNewAudienceTabs}>
            {[
                { key: 'ALL', label: text.dashboard.whatsNewAudienceAll },
                {
                    key: 'MANAGERS',
                    label: text.dashboard.whatsNewAudienceManagers,
                },
                {
                    key: 'EMPLOYEES',
                    label: text.dashboard.whatsNewAudienceEmployees,
                },
            ].map((option) => {
                const isActive = whatsNewAudience === option.key;
                return (<react_native_1.Pressable key={`whats-new-audience-${option.key}`} style={[
                        SessionCard_styles_1.styles.whatsNewAudienceChip,
                        isActive && SessionCard_styles_1.styles.whatsNewAudienceChipActive,
                    ]} onPress={() => setWhatsNewAudience(option.key)}>
                  <react_native_1.Text style={[
                        SessionCard_styles_1.styles.whatsNewAudienceChipText,
                        isActive && SessionCard_styles_1.styles.whatsNewAudienceChipTextActive,
                    ]}>
                    {option.label}
                  </react_native_1.Text>
                </react_native_1.Pressable>);
            })}
          </react_native_1.ScrollView>
        </react_native_1.View>

        <react_native_1.View style={SessionCard_styles_1.styles.whatsNewActionRow}>
          <react_native_1.Pressable style={[
                SessionCard_styles_1.styles.whatsNewPublishButton,
                SessionCard_styles_1.styles.whatsNewActionButton,
                whatsNewPublishing && SessionCard_styles_1.styles.buttonDisabled,
            ]} disabled={whatsNewPublishing} onPress={() => {
                void handlePublishWhatsNew();
            }}>
            <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewPublishButtonText}>
              {whatsNewPublishing
                ? text.dashboard.whatsNewPublishing
                : text.dashboard.whatsNewCta}
            </react_native_1.Text>
          </react_native_1.Pressable>

          <react_native_1.Pressable style={[
                SessionCard_styles_1.styles.whatsNewSecondaryButton,
                SessionCard_styles_1.styles.whatsNewActionButton,
                whatsNewUploading && SessionCard_styles_1.styles.buttonDisabled,
            ]} disabled={whatsNewUploading} onPress={() => {
                void handleWhatsNewUpload();
            }}>
            <react_native_1.Text style={SessionCard_styles_1.styles.whatsNewSecondaryButtonText}>
              {whatsNewUploading
                ? text.upload.uploading
                : text.dashboard.whatsNewAttachCta}
            </react_native_1.Text>
          </react_native_1.Pressable>
        </react_native_1.View>

        {whatsNewError ? (<react_native_1.Text style={SessionCard_styles_1.styles.errorText}>{whatsNewError}</react_native_1.Text>) : null}

        {whatsNewLastUpload ? (<react_native_1.View style={SessionCard_styles_1.styles.whatsNewAttachmentCard}>
            <react_native_1.Text style={SessionCard_styles_1.styles.panelSectionLabelOnDark}>
              {text.dashboard.whatsNewAttachmentReady}
            </react_native_1.Text>
            <react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
              {whatsNewLastUpload.originalName}
            </react_native_1.Text>
          </react_native_1.View>) : null}
      </react_native_1.View>);
    }
    function renderNewsFeedCard() {
        const unreadCount = newsFeed.filter((item) => !item.isRead).length;
        const laneConfigs = [
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
        const lanePosts = newsFeed.slice(0, 24).reduce((accumulator, post) => {
            const lane = getNewsLaneFromTitle(post.title);
            accumulator[lane].push(post);
            return accumulator;
        }, {
            NEWS: [],
            CONGRATS: [],
            CRITIQUE: [],
        });
        return (<react_native_1.View style={[SessionCard_styles_1.styles.quickBlock, SessionCard_styles_1.styles.newsFeedHighlightBlock]}>
        <react_native_1.View style={SessionCard_styles_1.styles.quickNewsHeader}>
          <react_native_1.View style={SessionCard_styles_1.styles.newsFeedTitleRow}>
            <react_native_1.View style={SessionCard_styles_1.styles.newsFeedIconWrap}>
              <vector_icons_1.Ionicons name="sparkles-outline" size={16} color="#ffffff"/>
            </react_native_1.View>
            <react_native_1.View>
              <react_native_1.Text style={SessionCard_styles_1.styles.panelTitleOnDark}>
                {text.dashboard.newsFeedTitle}
              </react_native_1.Text>
              <react_native_1.Text style={SessionCard_styles_1.styles.newsFeedKicker}>QUOI DE NEUF</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
          {unreadCount > 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.quickUnreadBadge}>{`${unreadCount} ${text.dashboard.newsUnreadLabel}`}</react_native_1.Text>) : null}
        </react_native_1.View>
        <react_native_1.View style={SessionCard_styles_1.styles.newsFeedIntroStrip}>
          <react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>{text.dashboard.newsFeedSubtitle}</react_native_1.Text>
        </react_native_1.View>

        <react_native_1.Text style={SessionCard_styles_1.styles.panelSectionLabelOnDark}>
          {text.dashboard.newsMonthFilterLabel}
        </react_native_1.Text>
        <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SessionCard_styles_1.styles.newsFilterTabs}>
          <react_native_1.Pressable style={[
                SessionCard_styles_1.styles.newsFilterChip,
                selectedNewsMonth === 'ALL' && SessionCard_styles_1.styles.newsFilterChipActive,
            ]} onPress={() => setSelectedNewsMonth('ALL')}>
            <react_native_1.Text style={[
                SessionCard_styles_1.styles.newsFilterChipText,
                selectedNewsMonth === 'ALL' &&
                    SessionCard_styles_1.styles.newsFilterChipTextActive,
            ]}>
              {text.dashboard.newsMonthFilterAll}
            </react_native_1.Text>
          </react_native_1.Pressable>

          {newsFeedMonths.map((month) => {
                const isActive = selectedNewsMonth === month;
                return (<react_native_1.Pressable key={`news-month-${month}`} style={[
                        SessionCard_styles_1.styles.newsFilterChip,
                        isActive && SessionCard_styles_1.styles.newsFilterChipActive,
                    ]} onPress={() => setSelectedNewsMonth(month)}>
                <react_native_1.Text style={[
                        SessionCard_styles_1.styles.newsFilterChipText,
                        isActive && SessionCard_styles_1.styles.newsFilterChipTextActive,
                    ]}>
                  {month}
                </react_native_1.Text>
              </react_native_1.Pressable>);
            })}
        </react_native_1.ScrollView>

        {newsFeedLoading ? (<react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>{text.adminTraining.loading}</react_native_1.Text>) : null}
        {newsFeedError ? (<react_native_1.Text style={SessionCard_styles_1.styles.errorText}>{newsFeedError}</react_native_1.Text>) : null}

        {!newsFeedLoading && !newsFeedError && newsFeed.length === 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>{text.dashboard.newsFeedEmpty}</react_native_1.Text>) : null}

        {!newsFeedLoading && !newsFeedError && newsFeed.length > 0 ? (<react_native_1.View style={SessionCard_styles_1.styles.newsBoard}>
            {laneConfigs.map((laneConfig) => (<react_native_1.View key={`news-lane-${laneConfig.key}`} style={SessionCard_styles_1.styles.newsLaneColumn}>
                <react_native_1.View style={SessionCard_styles_1.styles.newsLaneHeader}>
                  <react_native_1.View style={SessionCard_styles_1.styles.newsLaneTitleWrap}>
                    <react_native_1.View style={[
                        SessionCard_styles_1.styles.newsLaneDot,
                        { backgroundColor: laneConfig.color },
                    ]}/>
                    <react_native_1.Text style={SessionCard_styles_1.styles.newsLaneTitle}>
                      {`${laneConfig.icon} ${laneConfig.label}`}
                    </react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.Text style={SessionCard_styles_1.styles.newsLaneCount}>
                    {lanePosts[laneConfig.key].length}
                  </react_native_1.Text>
                </react_native_1.View>

                <react_native_1.View style={SessionCard_styles_1.styles.newsLaneBody}>
                  {lanePosts[laneConfig.key].length === 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
                      {text.dashboard.newsFeedEmpty}
                    </react_native_1.Text>) : (lanePosts[laneConfig.key].map((post) => (<react_native_1.Pressable key={`news-${laneConfig.key}-${post.id}`} style={[
                            SessionCard_styles_1.styles.newsPostCard,
                            !post.isRead && SessionCard_styles_1.styles.newsPostCardUnread,
                        ]} onPress={() => {
                            void handleOpenNews(post);
                        }}>
                        <react_native_1.View style={SessionCard_styles_1.styles.newsPostMetaRow}>
                          <react_native_1.Text style={SessionCard_styles_1.styles.newsPostMetaText}>
                            {new Date(post.createdAt).toLocaleString()}
                          </react_native_1.Text>
                          <react_native_1.Text style={[
                            SessionCard_styles_1.styles.newsPostTag,
                            {
                                borderColor: laneConfig.badgeBorder,
                                backgroundColor: laneConfig.badgeBackground,
                            },
                        ]}>
                            {laneConfig.label}
                          </react_native_1.Text>
                        </react_native_1.View>

                        <react_native_1.View style={SessionCard_styles_1.styles.quickNewsRowHeader}>
                          <react_native_1.Text style={SessionCard_styles_1.styles.newsPostTitle}>
                            {stripNewsLaneMarker(post.title)}
                          </react_native_1.Text>

                          {!isAdmin ? (<react_native_1.Pressable style={[
                                SessionCard_styles_1.styles.iconActionButton,
                                post.isRead && SessionCard_styles_1.styles.newsReadConfirmButtonDone,
                                markingNewsReadId === post.id &&
                                    SessionCard_styles_1.styles.buttonDisabled,
                            ]} accessibilityLabel={text.dashboard.newsConfirmReadButton} disabled={post.isRead || markingNewsReadId === post.id} onPress={(event) => {
                                event.stopPropagation?.();
                                void handleConfirmNewsRead(post);
                            }}>
                              <vector_icons_1.Ionicons name={post.isRead
                                ? 'checkmark-done-outline'
                                : markingNewsReadId === post.id
                                    ? 'hourglass-outline'
                                    : 'checkmark-outline'} size={18} color={post.isRead ? '#2f7d32' : '#7f1b21'}/>
                            </react_native_1.Pressable>) : (<react_native_1.Pressable style={[
                                SessionCard_styles_1.styles.iconActionButton,
                                expandedNewsTrackingId === post.id &&
                                    SessionCard_styles_1.styles.newsTrackingActiveButton,
                                loadingNewsTrackingId === post.id &&
                                    SessionCard_styles_1.styles.buttonDisabled,
                            ]} accessibilityLabel={text.dashboard.newsReadTrackingButton} disabled={loadingNewsTrackingId === post.id} onPress={(event) => {
                                event.stopPropagation?.();
                                void handleToggleReadTracking(post);
                            }}>
                              <vector_icons_1.Ionicons name={loadingNewsTrackingId === post.id
                                ? 'hourglass-outline'
                                : 'people-outline'} size={18} color="#7f1b21"/>
                            </react_native_1.Pressable>)}
                        </react_native_1.View>

                        <react_native_1.Text style={SessionCard_styles_1.styles.newsPostBodyText}>{post.message}</react_native_1.Text>
                        <react_native_1.Text style={SessionCard_styles_1.styles.newsPostMetaText}>
                          {post.createdBy.name ?? post.createdBy.email}
                        </react_native_1.Text>

                        {!isAdmin ? (<react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
                            {post.isRead
                                ? text.dashboard.newsReadConfirmed
                                : text.dashboard.newsReadPendingConfirm}
                          </react_native_1.Text>) : null}

                        {post.attachment ? (<react_native_1.Text style={SessionCard_styles_1.styles.quickNewsLink}>
                            {post.attachment.originalName}
                          </react_native_1.Text>) : null}

                        {isAdmin && expandedNewsTrackingId === post.id ? (<react_native_1.View style={SessionCard_styles_1.styles.newsTrackingCard}>
                            {newsTrackingByPostId[post.id] ? (<>
                                <react_native_1.Text style={SessionCard_styles_1.styles.panelSectionLabelOnDark}>
                                  {text.dashboard.newsReadTrackingTitle}
                                </react_native_1.Text>
                                <react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
                                  {`${text.dashboard.newsReadTrackingGlobal}: ${newsTrackingByPostId[post.id].readCount}/${newsTrackingByPostId[post.id].totalUsers}`}
                                </react_native_1.Text>

                                {newsTrackingByPostId[post.id].byRestaurant.map((group) => (<react_native_1.View key={`news-tracking-restaurant-${post.id}-${group.restaurant?.id ?? 'none'}`} style={SessionCard_styles_1.styles.newsTrackingRestaurantGroup}>
                                      <react_native_1.Text style={SessionCard_styles_1.styles.panelSectionLabelOnDark}>
                                        {group.restaurant?.name ??
                                        text.dashboard.newsReadTrackingNoRestaurant}
                                      </react_native_1.Text>
                                      <react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
                                        {`${text.dashboard.newsReadTrackingUnread}: ${group.unreadCount} | ${text.dashboard.newsReadTrackingRead}: ${group.readCount}`}
                                      </react_native_1.Text>

                                      {group.unreadUsers.length === 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
                                          {text.dashboard.newsReadTrackingAllRead}
                                        </react_native_1.Text>) : (group.unreadUsers.map((unreadUser) => (<react_native_1.Text key={`news-tracking-user-${post.id}-${unreadUser.id}`} style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
                                            {`- ${unreadUser.name ?? unreadUser.email} (${unreadUser.role})`}
                                          </react_native_1.Text>)))}
                                    </react_native_1.View>))}
                              </>) : (<react_native_1.Text style={SessionCard_styles_1.styles.panelSubtitleOnDark}>
                                {text.adminTraining.loading}
                              </react_native_1.Text>)}
                          </react_native_1.View>) : null}

                        {isAdmin ? (<react_native_1.Pressable style={[
                                SessionCard_styles_1.styles.iconDeleteButton,
                                deletingNewsId === post.id && SessionCard_styles_1.styles.buttonDisabled,
                            ]} accessibilityLabel={text.dashboard.newsDeleteButton} disabled={deletingNewsId === post.id} onPress={(event) => {
                                event.stopPropagation?.();
                                void handleDeleteNews(post);
                            }}>
                            <vector_icons_1.Ionicons name={deletingNewsId === post.id
                                ? 'hourglass-outline'
                                : 'trash-outline'} size={18} color="#ab1e24"/>
                          </react_native_1.Pressable>) : null}
                      </react_native_1.Pressable>)))}
                </react_native_1.View>
              </react_native_1.View>))}
          </react_native_1.View>) : null}
      </react_native_1.View>);
    }
    function renderManagerQuickBlocks() {
        return (<>
        {!isAdmin ? (<react_native_1.View style={SessionCard_styles_1.styles.quickBlock}>
            <react_native_1.Text style={SessionCard_styles_1.styles.quickBlockTitle}>
              {text.dashboard.quickApproveTitle}
            </react_native_1.Text>
            {renderAdminRestaurantFilter('approval')}
            <react_native_1.TextInput style={SessionCard_styles_1.styles.quickSearchInput} placeholder={text.dashboard.quickSearchPlaceholder} placeholderTextColor="#a98a8d" value={accountSearch} onChangeText={setAccountSearch}/>
            {usersLoading ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{text.adminTraining.loading}</react_native_1.Text>) : null}
            {usersError ? (<react_native_1.Text style={SessionCard_styles_1.styles.errorText}>{usersError}</react_native_1.Text>) : null}
            {!usersLoading &&
                    !usersError &&
                    accountApprovalUsers.length === 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>
                {text.dashboard.quickNoPendingAccount}
              </react_native_1.Text>) : null}
            {accountApprovalUsers.slice(0, 4).map((entry) => (<react_native_1.View key={`approve-${entry.id}`} style={SessionCard_styles_1.styles.quickRowCard}>
                <react_native_1.Text style={SessionCard_styles_1.styles.quickRowTitle}>
                  {entry.name ?? entry.email}
                </react_native_1.Text>
                <react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{entry.email}</react_native_1.Text>
                <react_native_1.Pressable style={[
                        SessionCard_styles_1.styles.secondaryButton,
                        isApprovingUserId === entry.id && SessionCard_styles_1.styles.buttonDisabled,
                    ]} disabled={isApprovingUserId === entry.id} onPress={() => {
                        void handleApproveAccount(entry);
                    }}>
                  <react_native_1.Text style={SessionCard_styles_1.styles.secondaryButtonText}>
                    {isApprovingUserId === entry.id
                        ? text.adminTraining.approveAccountSaving
                        : text.adminTraining.approveAccountButton}
                  </react_native_1.Text>
                </react_native_1.Pressable>
              </react_native_1.View>))}

            <react_native_1.View style={SessionCard_styles_1.styles.quickSectionDivider}>
              <react_native_1.Text style={SessionCard_styles_1.styles.quickSectionTitle}>
                {text.dashboard.quickDeleteSectionTitle}
              </react_native_1.Text>
            </react_native_1.View>

            {deletionUsers.length === 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>
                {text.dashboard.quickNoEmployee}
              </react_native_1.Text>) : (deletionUsers.slice(0, 4).map((entry) => (<react_native_1.View key={`delete-${entry.id}`} style={SessionCard_styles_1.styles.quickRowCard}>
                  <react_native_1.View style={SessionCard_styles_1.styles.quickLevelRow}>
                    <react_native_1.View style={SessionCard_styles_1.styles.quickLevelInfo}>
                      <react_native_1.Text style={SessionCard_styles_1.styles.quickRowTitle}>
                        {entry.name ?? entry.email}
                      </react_native_1.Text>
                      <react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{entry.email}</react_native_1.Text>
                    </react_native_1.View>

                    <react_native_1.Pressable style={[
                        SessionCard_styles_1.styles.iconDeleteButton,
                        isDeletingUserId === entry.id && SessionCard_styles_1.styles.buttonDisabled,
                    ]} accessibilityLabel={text.dashboard.quickDeleteButton} disabled={isDeletingUserId === entry.id} onPress={() => {
                        void handleDeleteUser(entry);
                    }}>
                      <vector_icons_1.Ionicons name={isDeletingUserId === entry.id
                        ? 'hourglass-outline'
                        : 'trash-outline'} size={20} color="#ab1e24"/>
                    </react_native_1.Pressable>
                  </react_native_1.View>
                </react_native_1.View>)))}
          </react_native_1.View>) : null}

        {!isAdmin ? (<react_native_1.View style={SessionCard_styles_1.styles.quickBlock}>
            <react_native_1.Text style={SessionCard_styles_1.styles.quickBlockTitle}>
              {text.dashboard.quickLatestOrderTitle}
            </react_native_1.Text>
            {orderLoading ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{text.adminTraining.loading}</react_native_1.Text>) : null}
            {orderError ? (<react_native_1.Text style={SessionCard_styles_1.styles.errorText}>{orderError}</react_native_1.Text>) : null}
            {!orderLoading && !orderError && !latestOrder ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{text.dashboard.quickNoOrder}</react_native_1.Text>) : null}
            {latestOrder ? (<react_native_1.View style={SessionCard_styles_1.styles.quickRowCard}>
                <react_native_1.View style={SessionCard_styles_1.styles.quickMetaInlineRow}>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaHeaderText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {text.orders.orderNumberLabel}
                  </react_native_1.Text>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaHeaderText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {text.orders.deliveryDateLabel}
                  </react_native_1.Text>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaHeaderText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {text.orders.supplierLabel}
                  </react_native_1.Text>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaHeaderText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {text.orders.summaryItems}
                  </react_native_1.Text>
                  {react_native_1.Platform.OS === 'web' ? (<react_native_1.View style={SessionCard_styles_1.styles.quickEyeSpacer}/>) : null}
                </react_native_1.View>

                <react_native_1.View style={SessionCard_styles_1.styles.quickMetaInlineRow}>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaValueText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {latestOrder.number}
                  </react_native_1.Text>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaValueText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {latestOrder.deliveryDate}
                  </react_native_1.Text>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaValueText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {latestOrder.supplierName}
                  </react_native_1.Text>
                  <react_native_1.Text style={[SessionCard_styles_1.styles.quickMetaValueText, SessionCard_styles_1.styles.quickInlineCell]}>
                    {latestOrder.totalItems}
                  </react_native_1.Text>

                  {react_native_1.Platform.OS === 'web' ? (<react_native_1.Pressable style={[
                            SessionCard_styles_1.styles.eyePreviewButton,
                            (!orderPreviewUrl || orderPreviewLoading) &&
                                SessionCard_styles_1.styles.buttonDisabled,
                        ]} disabled={!orderPreviewUrl || orderPreviewLoading} onPress={() => setIsOrderPreviewOpen(true)}>
                      <vector_icons_1.Ionicons name="eye-outline" size={20} color="#7f1b21"/>
                    </react_native_1.Pressable>) : null}
                </react_native_1.View>

                {react_native_1.Platform.OS === 'web' ? null : (<react_native_1.Pressable style={SessionCard_styles_1.styles.secondaryButton} onPress={() => {
                            void react_native_1.Linking.openURL((0, ordersApi_1.buildOrderBonUrl)(latestOrder.id));
                        }}>
                    <react_native_1.Text style={SessionCard_styles_1.styles.secondaryButtonText}>
                      {text.orders.downloadBonButton}
                    </react_native_1.Text>
                  </react_native_1.Pressable>)}
              </react_native_1.View>) : null}
          </react_native_1.View>) : null}
      </>);
    }
    function renderLevelQuickBlock() {
        return (<react_native_1.View style={SessionCard_styles_1.styles.quickBlock}>
        <react_native_1.Text style={SessionCard_styles_1.styles.quickBlockTitle}>
          {text.dashboard.quickLevelTitle}
        </react_native_1.Text>
        {renderAdminRestaurantFilter('level')}
        <react_native_1.TextInput style={SessionCard_styles_1.styles.quickSearchInput} placeholder={text.dashboard.quickSearchPlaceholder} placeholderTextColor="#a98a8d" value={levelSearch} onChangeText={setLevelSearch}/>
        {levelBlockError ? (<react_native_1.Text style={SessionCard_styles_1.styles.errorText}>{levelBlockError}</react_native_1.Text>) : null}
        {levelUsers.length === 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{text.dashboard.quickNoEmployee}</react_native_1.Text>) : (levelUsers.slice(0, 6).map((entry) => (<react_native_1.View key={`level-${entry.id}`} style={SessionCard_styles_1.styles.quickRowCard}>
              <react_native_1.View style={SessionCard_styles_1.styles.quickLevelRow}>
                <react_native_1.View style={SessionCard_styles_1.styles.quickLevelInfo}>
                  <react_native_1.Text style={SessionCard_styles_1.styles.quickRowTitle}>
                    {entry.name ?? entry.email}
                  </react_native_1.Text>
                  <react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{entry.email}</react_native_1.Text>
                  <react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>
                    {text.dashboard.employeeLevelLabel}:{' '}
                    {text.dashboard.levels[entry.employeeLevel]}
                  </react_native_1.Text>
                  <react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>
                    {text.dashboard.workplace}:{' '}
                    {text.dashboard.workplaceValues[entry.workplaceRole]}
                  </react_native_1.Text>
                </react_native_1.View>

                <react_native_1.Pressable style={[
                    SessionCard_styles_1.styles.iconActionButton,
                    isUpdatingLevelUserId === entry.id && SessionCard_styles_1.styles.buttonDisabled,
                ]} accessibilityLabel={text.dashboard.levelModalTitle} disabled={isUpdatingLevelUserId === entry.id} onPress={() => {
                    setLevelEditorUser(entry);
                }}>
                  <vector_icons_1.Ionicons name={isUpdatingLevelUserId === entry.id
                    ? 'hourglass-outline'
                    : 'arrow-up-circle-outline'} size={20} color="#7f1b21"/>
                </react_native_1.Pressable>
              </react_native_1.View>

              <react_native_1.View style={SessionCard_styles_1.styles.quickWorkplaceRow}>
                {WORKPLACE_ROLES.map((workplaceRole) => {
                    const isActive = entry.workplaceRole === workplaceRole;
                    const isUpdating = isUpdatingWorkplaceUserId === entry.id;
                    return (<react_native_1.Pressable key={`workplace-${entry.id}-${workplaceRole}`} style={[
                            SessionCard_styles_1.styles.quickWorkplaceChip,
                            isActive && SessionCard_styles_1.styles.quickWorkplaceChipActive,
                            isUpdating && SessionCard_styles_1.styles.buttonDisabled,
                        ]} disabled={isUpdating} onPress={() => {
                            void handleUpdateEmployeeWorkplaceRole(entry, workplaceRole);
                        }}>
                      <react_native_1.Text style={[
                            SessionCard_styles_1.styles.quickWorkplaceChipText,
                            isActive && SessionCard_styles_1.styles.quickWorkplaceChipTextActive,
                        ]}>
                        {text.dashboard.workplaceValues[workplaceRole]}
                      </react_native_1.Text>
                    </react_native_1.Pressable>);
                })}
              </react_native_1.View>
            </react_native_1.View>)))}
      </react_native_1.View>);
    }
    function renderTopProductsChart() {
        return (<react_native_1.View style={SessionCard_styles_1.styles.quickBlock}>
        <react_native_1.Text style={SessionCard_styles_1.styles.quickBlockTitle}>
          {text.dashboard.topProductsTitle}
        </react_native_1.Text>
        <react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>
          {text.dashboard.topProductsSubtitle}
        </react_native_1.Text>

        {chartSuppliers.length > 0 ? (<react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SessionCard_styles_1.styles.chartSupplierTabs}>
            {chartSuppliers.map((supplier) => {
                    const isActive = supplier.id === selectedChartSupplierId;
                    return (<react_native_1.Pressable key={`chart-supplier-${supplier.id}`} style={[
                            SessionCard_styles_1.styles.chartSupplierChip,
                            isActive && SessionCard_styles_1.styles.chartSupplierChipActive,
                        ]} onPress={() => setSelectedChartSupplierId(supplier.id)}>
                  <react_native_1.Text style={[
                            SessionCard_styles_1.styles.chartSupplierChipText,
                            isActive && SessionCard_styles_1.styles.chartSupplierChipTextActive,
                        ]}>
                    {supplier.name}
                  </react_native_1.Text>
                </react_native_1.Pressable>);
                })}
          </react_native_1.ScrollView>) : (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{text.dashboard.topProductsEmpty}</react_native_1.Text>)}

        {chartMonths.length > 0 ? (<react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SessionCard_styles_1.styles.chartSupplierTabs}>
            {chartMonths.map((month) => {
                    const isActive = month === selectedChartMonth;
                    return (<react_native_1.Pressable key={`chart-month-${month}`} style={[
                            SessionCard_styles_1.styles.chartSupplierChip,
                            isActive && SessionCard_styles_1.styles.chartSupplierChipActive,
                        ]} onPress={() => setSelectedChartMonth(month)}>
                  <react_native_1.Text style={[
                            SessionCard_styles_1.styles.chartSupplierChipText,
                            isActive && SessionCard_styles_1.styles.chartSupplierChipTextActive,
                        ]}>
                    {month}
                  </react_native_1.Text>
                </react_native_1.Pressable>);
                })}
          </react_native_1.ScrollView>) : null}

        {topProductsLoading ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{text.adminTraining.loading}</react_native_1.Text>) : null}

        {topProductsError ? (<react_native_1.Text style={SessionCard_styles_1.styles.errorText}>{topProductsError}</react_native_1.Text>) : null}

        {!topProductsLoading &&
                !topProductsError &&
                chartSuppliers.length > 0 &&
                topProducts.length === 0 ? (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>{text.dashboard.topProductsEmpty}</react_native_1.Text>) : null}

        {topProducts.length > 0 ? (<react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} style={SessionCard_styles_1.styles.chartWrap} contentContainerStyle={SessionCard_styles_1.styles.chartScrollContent}>
            {(() => {
                    const maxQuantity = Math.max(...topProducts.map((product) => product.totalQuantity), 1);
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
                    return (<react_native_1.View style={[SessionCard_styles_1.styles.lineChartCanvas, { width: axisRight + 24 }]}>
                  {yTicks.map((tick) => {
                            const y = axisTop + (1 - tick) * plotHeight;
                            const tickLabel = Math.round(maxQuantity * tick);
                            return (<react_native_1.View key={`tick-${tick}`} style={[SessionCard_styles_1.styles.lineChartGridRow, { top: y }]}>
                        <react_native_1.Text style={SessionCard_styles_1.styles.lineChartYLabel}>{tickLabel}</react_native_1.Text>
                        <react_native_1.View style={SessionCard_styles_1.styles.lineChartGridLine}/>
                      </react_native_1.View>);
                        })}

                  <react_native_1.View style={[
                            SessionCard_styles_1.styles.lineChartAxisY,
                            { left: axisLeft, top: axisTop, height: plotHeight },
                        ]}/>
                  <react_native_1.View style={[
                            SessionCard_styles_1.styles.lineChartAxisX,
                            {
                                left: axisLeft,
                                top: axisBottom,
                                width: axisRight - axisLeft,
                            },
                        ]}/>

                  {points.slice(0, -1).map((point, index) => {
                            const nextPoint = points[index + 1];
                            const dx = nextPoint.x - point.x;
                            const dy = nextPoint.y - point.y;
                            const length = Math.sqrt(dx * dx + dy * dy);
                            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                            return (<react_native_1.View key={`segment-${point.product.month}-${point.product.productId}`} style={[
                                    SessionCard_styles_1.styles.lineChartSegment,
                                    {
                                        left: point.x + dx / 2 - length / 2,
                                        top: point.y + dy / 2 - 1,
                                        width: length,
                                        transform: [{ rotate: `${angle}deg` }],
                                    },
                                ]}/>);
                        })}

                  {points.map(({ product, x, y }) => {
                            const label = product.nameFr?.trim() ||
                                product.nameZh?.trim() ||
                                `${product.productId}`;
                            return (<react_native_1.View key={`point-${product.month}-${product.supplierId}-${product.productId}`}>
                        <react_native_1.View style={[
                                    SessionCard_styles_1.styles.lineChartPoint,
                                    { left: x - 4, top: y - 4 },
                                ]}/>
                        <react_native_1.Text style={[
                                    SessionCard_styles_1.styles.lineChartValue,
                                    { left: x - 18, top: y - 24 },
                                ]}>
                          {product.totalQuantity}
                        </react_native_1.Text>
                        <react_native_1.Text style={[
                                    SessionCard_styles_1.styles.lineChartProductLabel,
                                    { left: x - 40, top: axisBottom + 10 },
                                ]} numberOfLines={2}>
                          {label}
                        </react_native_1.Text>
                      </react_native_1.View>);
                        })}
                </react_native_1.View>);
                })()}
          </react_native_1.ScrollView>) : null}
      </react_native_1.View>);
    }
    return (<react_native_1.View style={SessionCard_styles_1.styles.stackCardWrap}>
      <react_native_1.View style={SessionCard_styles_1.styles.announcementTopStack}>
        {renderNewsFeedCard()}
        {isAdmin ? renderWhatsNewUploadCard() : null}
      </react_native_1.View>

      <react_native_1.View style={isSupervisor ? SessionCard_styles_1.styles.managerDashboardLayout : undefined}>
        <react_native_1.View style={isSupervisor ? SessionCard_styles_1.styles.managerLeftColumn : undefined}>
          {isAdmin ? renderLevelQuickBlock() : null}

          {isAdmin ? (<>
              <AdminTrainingAccessPanel_1.AdminTrainingAccessPanel accessToken={accessToken} currentUser={user} text={text}/>
            </>) : null}

          {isManager ? renderTopProductsChart() : null}
        </react_native_1.View>

        {isSupervisor ? (<react_native_1.View style={SessionCard_styles_1.styles.quickColumn}>
            {!isAdmin ? renderLevelQuickBlock() : null}
            {isAdmin ? (<AdminRestaurantPanel_1.AdminRestaurantPanel accessToken={accessToken} text={text}/>) : null}
            {isAdmin ? (<AdminUploadPanel_1.AdminUploadPanel accessToken={accessToken} text={text}/>) : null}
            {renderManagerQuickBlocks()}
          </react_native_1.View>) : null}
      </react_native_1.View>

      {react_native_1.Platform.OS === 'web' ? (<react_native_1.Modal visible={isOrderPreviewOpen} transparent animationType="fade" onRequestClose={() => setIsOrderPreviewOpen(false)}>
          <react_native_1.View style={SessionCard_styles_1.styles.previewModalBackdrop}>
            <react_native_1.View style={SessionCard_styles_1.styles.previewModalCard}>
              <react_native_1.View style={SessionCard_styles_1.styles.previewModalHeader}>
                <react_native_1.Text style={SessionCard_styles_1.styles.quickBlockTitle}>
                  {text.dashboard.quickLatestOrderTitle}
                </react_native_1.Text>
                <react_native_1.Pressable style={SessionCard_styles_1.styles.secondaryButton} onPress={() => setIsOrderPreviewOpen(false)}>
                  <react_native_1.Text style={SessionCard_styles_1.styles.secondaryButtonText}>
                    {text.dashboard.quickPreviewCloseButton}
                  </react_native_1.Text>
                </react_native_1.Pressable>
              </react_native_1.View>

              {orderPreviewUrl ? (<iframe src={orderPreviewUrl} style={SessionCard_styles_1.styles.orderPreviewFrame} title={latestOrder
                    ? `order-preview-${latestOrder.id}`
                    : 'order-preview'}/>) : (<react_native_1.Text style={SessionCard_styles_1.styles.subtitle}>
                  {text.dashboard.quickPreviewUnavailable}
                </react_native_1.Text>)}
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.Modal>) : null}

      <react_native_1.Modal visible={levelEditorUser !== null} transparent animationType="fade" onRequestClose={() => setLevelEditorUser(null)}>
        <react_native_1.View style={SessionCard_styles_1.styles.previewModalBackdrop}>
          <react_native_1.View style={SessionCard_styles_1.styles.levelModalCard}>
            <react_native_1.View style={SessionCard_styles_1.styles.previewModalHeader}>
              <react_native_1.Text style={SessionCard_styles_1.styles.quickBlockTitle}>
                {text.dashboard.levelModalTitle}
              </react_native_1.Text>
              <react_native_1.Pressable style={SessionCard_styles_1.styles.secondaryButton} onPress={() => setLevelEditorUser(null)}>
                <react_native_1.Text style={SessionCard_styles_1.styles.secondaryButtonText}>
                  {text.dashboard.levelModalClose}
                </react_native_1.Text>
              </react_native_1.Pressable>
            </react_native_1.View>

            <react_native_1.ScrollView style={SessionCard_styles_1.styles.levelListWrap} contentContainerStyle={SessionCard_styles_1.styles.levelListContent}>
              {EMPLOYEE_LEVELS.map((level) => (<react_native_1.Pressable key={level} style={[
                SessionCard_styles_1.styles.levelListItem,
                levelEditorUser?.employeeLevel === level &&
                    SessionCard_styles_1.styles.levelListItemActive,
                isUpdatingLevelUserId === levelEditorUser?.id &&
                    SessionCard_styles_1.styles.buttonDisabled,
            ]} disabled={isUpdatingLevelUserId === levelEditorUser?.id} onPress={() => {
                if (!levelEditorUser) {
                    return;
                }
                void handleUpdateEmployeeLevel(levelEditorUser, level);
            }}>
                  <react_native_1.Text style={[
                SessionCard_styles_1.styles.levelListItemText,
                levelEditorUser?.employeeLevel === level &&
                    SessionCard_styles_1.styles.levelListItemTextActive,
            ]}>
                    {text.dashboard.levels[level]}
                  </react_native_1.Text>
                </react_native_1.Pressable>))}
            </react_native_1.ScrollView>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      <ConfirmDialog_1.ConfirmDialog visible={confirmDialog.visible} title={confirmDialog.title} message={confirmDialog.message} cancelLabel={confirmDialog.cancelLabel} confirmLabel={confirmDialog.confirmLabel} destructive={confirmDialog.destructive} onCancel={() => closeConfirmDialog(false)} onConfirm={() => closeConfirmDialog(true)}/>
    </react_native_1.View>);
}
//# sourceMappingURL=SessionCard.js.map