import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { fetchRestaurants } from '../../services/restaurantsApi';
import {
  approveUserAccount,
  assignUserRestaurant,
  deleteUserAccount,
  fetchTrainingAccessUsers,
  rejectUserAccount,
  updateUserLevel,
  updateUserWorkplaceRole,
  type TrainingAccessUser,
} from '../../services/usersApi';
import type { AppText } from '../../locales/translations';
import type {
  EmployeeLevel,
  Restaurant,
  User,
  WorkplaceRole,
} from '../../types/auth';
import {
  getUserScopedRestaurantIds,
  isManagerLikeRole,
} from '../../utils/roleAccess';
import type {
  ConfirmAction,
  RestaurantFilterSection,
  RestaurantFilterValue,
  RestaurantOption,
} from './SessionCard.types';

type UseSessionCardSupervisorStateArgs = {
  accessToken: string;
  confirmAction: ConfirmAction;
  currentUser: User;
  isAdmin: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  text: AppText;
};

export type SessionCardSupervisorState = {
  accountApprovalUsers: TrainingAccessUser[];
  approvalSearch: string;
  approvedManagerUsers: TrainingAccessUser[];
  availableTransferRestaurants: Restaurant[];
  closeLevelEditor: () => void;
  deleteSearch: string;
  deletionUsers: TrainingAccessUser[];
  employeeRestaurantOptions: RestaurantOption[];
  emailVerificationUsers: TrainingAccessUser[];
  handleApproveAccount: (entry: TrainingAccessUser) => Promise<void>;
  handleDeleteUser: (entry: TrainingAccessUser) => Promise<void>;
  handleRejectAccount: (entry: TrainingAccessUser) => Promise<void>;
  handleTransferUser: () => Promise<void>;
  handleUpdateEmployeeLevel: (
    entry: TrainingAccessUser,
    level: EmployeeLevel,
  ) => Promise<void>;
  handleUpdateEmployeeWorkplaceRole: (
    entry: TrainingAccessUser,
    workplaceRole: WorkplaceRole,
  ) => Promise<void>;
  isApprovingUserId: number | null;
  isDeletingUserId: number | null;
  isRejectingUserId: number | null;
  isTransferringUserId: number | null;
  isUpdatingLevelUserId: number | null;
  isUpdatingWorkplaceUserId: number | null;
  levelBlockError: string | null;
  levelEditorUser: TrainingAccessUser | null;
  levelSearch: string;
  levelUsers: TrainingAccessUser[];
  openLevelEditor: (entry: TrainingAccessUser) => void;
  openRestaurantFilterFor: RestaurantFilterSection | null;
  selectRestaurantFilter: (value: RestaurantFilterValue) => void;
  selectedEmployeeRestaurantFilter: RestaurantFilterValue;
  selectedRestaurantFilterLabel: string;
  selectedTransferRestaurant: Restaurant | null;
  selectedTransferRestaurantId: number | null;
  selectedTransferUser: TrainingAccessUser | null;
  selectedTransferUserId: number | null;
  setApprovalSearch: Dispatch<SetStateAction<string>>;
  setDeleteSearch: Dispatch<SetStateAction<string>>;
  setLevelSearch: Dispatch<SetStateAction<string>>;
  setTransferSearch: Dispatch<SetStateAction<string>>;
  selectTransferRestaurant: (restaurantId: number) => void;
  selectTransferUser: (userId: number) => void;
  toggleRestaurantFilter: (section: RestaurantFilterSection) => void;
  transferBlockError: string | null;
  transferSearch: string;
  users: TrainingAccessUser[];
  usersError: string | null;
  usersLoading: boolean;
  visibleTransferUsers: TrainingAccessUser[];
  restaurants: Restaurant[];
};

function matchesUserQuery(entry: TrainingAccessUser, query: string) {
  if (!query) {
    return true;
  }

  const name = entry.name?.toLowerCase() ?? '';
  return name.includes(query) || entry.email.toLowerCase().includes(query);
}

function getUserDisplayName(entry: Pick<TrainingAccessUser, 'name' | 'email'>) {
  return (entry.name ?? entry.email).trim();
}

export function useSessionCardSupervisorState({
  accessToken,
  confirmAction,
  currentUser,
  isAdmin,
  isManager,
  isSupervisor,
  text,
}: UseSessionCardSupervisorStateArgs): SessionCardSupervisorState {
  const scopedRestaurantIds = useMemo(
    () => getUserScopedRestaurantIds(currentUser),
    [currentUser.managedRestaurants, currentUser.restaurant, currentUser.role],
  );
  const isRegionalManager = currentUser.role === 'REGIONAL_MANAGER';
  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [levelBlockError, setLevelBlockError] = useState<string | null>(null);
  const [transferBlockError, setTransferBlockError] = useState<string | null>(
    null,
  );
  const [approvalSearch, setApprovalSearch] = useState('');
  const [deleteSearch, setDeleteSearch] = useState('');
  const [levelSearch, setLevelSearch] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [isApprovingUserId, setIsApprovingUserId] = useState<number | null>(
    null,
  );
  const [isRejectingUserId, setIsRejectingUserId] = useState<number | null>(
    null,
  );
  const [isUpdatingLevelUserId, setIsUpdatingLevelUserId] = useState<
    number | null
  >(null);
  const [isUpdatingWorkplaceUserId, setIsUpdatingWorkplaceUserId] = useState<
    number | null
  >(null);
  const [isDeletingUserId, setIsDeletingUserId] = useState<number | null>(null);
  const [isTransferringUserId, setIsTransferringUserId] = useState<
    number | null
  >(null);
  const [levelEditorUser, setLevelEditorUser] =
    useState<TrainingAccessUser | null>(null);
  const [selectedTransferUserId, setSelectedTransferUserId] = useState<
    number | null
  >(null);
  const [selectedTransferRestaurantId, setSelectedTransferRestaurantId] =
    useState<number | null>(null);
  const [openRestaurantFilterFor, setOpenRestaurantFilterFor] = useState<
    RestaurantFilterSection | null
  >(null);
  const [
    selectedEmployeeRestaurantFilter,
    setSelectedEmployeeRestaurantFilter,
  ] = useState<RestaurantFilterValue>('ALL');

  useEffect(() => {
    if (!isManager && !isAdmin) {
      setRestaurants([]);
      return;
    }

    let isActive = true;
    setTransferBlockError(null);

    void fetchRestaurants()
      .then((result) => {
        if (!isActive) {
          return;
        }

        setRestaurants(result);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setRestaurants([]);
        setTransferBlockError(text.api.loadRestaurantsError);
      });

    return () => {
      isActive = false;
    };
  }, [isAdmin, isManager, text.api.loadRestaurantsError]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    if (isManager && scopedRestaurantIds.length === 0) {
      setUsers([]);
      setUsersError(text.dashboard.managerRestaurantMissing);
      setUsersLoading(false);
      return;
    }

    let isActive = true;
    setUsersLoading(true);
    setUsersError(null);

    void fetchTrainingAccessUsers(accessToken)
      .then((result) => {
        if (!isActive) {
          return;
        }

        setUsers(
          result.filter(
            (entry) => entry.role !== 'ADMIN' && entry.id !== currentUser.id,
          ),
        );
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setUsersError(text.dashboard.quickLoadUsersError);
        setUsers([]);
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
    currentUser.id,
    isManager,
    isSupervisor,
    scopedRestaurantIds,
    text.dashboard.managerRestaurantMissing,
    text.dashboard.quickLoadUsersError,
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
    const query = approvalSearch.trim().toLowerCase();

    return usersFilteredByRestaurant
      .filter(
        (entry) =>
          entry.isEmailVerified &&
          !entry.isApproved &&
          (isAdmin ? entry.role !== 'EMPLOYEE' : entry.role === 'EMPLOYEE'),
      )
      .filter((entry) => matchesUserQuery(entry, query));
  }, [approvalSearch, isAdmin, usersFilteredByRestaurant]);

  const emailVerificationUsers = useMemo(() => {
    const query = approvalSearch.trim().toLowerCase();

    return usersFilteredByRestaurant
      .filter(
        (entry) =>
          !entry.isEmailVerified &&
          !entry.isApproved &&
          (isAdmin ? entry.role !== 'EMPLOYEE' : entry.role === 'EMPLOYEE'),
      )
      .filter((entry) => matchesUserQuery(entry, query));
  }, [approvalSearch, isAdmin, usersFilteredByRestaurant]);

  const approvedManagerUsers = useMemo(
    () =>
      usersFilteredByRestaurant.filter(
        (entry) => isManagerLikeRole(entry.role) && entry.isApproved,
      ),
    [usersFilteredByRestaurant],
  );

  const deletionUsers = useMemo(() => {
    const query = deleteSearch.trim().toLowerCase();

    return usersFilteredByRestaurant
      .filter((entry) => entry.role === 'EMPLOYEE')
      .filter((entry) => matchesUserQuery(entry, query));
  }, [deleteSearch, usersFilteredByRestaurant]);

  const managerTransferUsers = useMemo(
    () => users.filter((entry) => entry.role === 'EMPLOYEE'),
    [users],
  );

  const visibleTransferUsers = useMemo(() => {
    const query = transferSearch.trim().toLowerCase();

    return managerTransferUsers.filter((entry) => matchesUserQuery(entry, query));
  }, [managerTransferUsers, transferSearch]);

  const selectedTransferUser = useMemo(
    () =>
      managerTransferUsers.find((entry) => entry.id === selectedTransferUserId) ??
      null,
    [managerTransferUsers, selectedTransferUserId],
  );

  const availableTransferRestaurants = useMemo(
    () => {
      const scopeIds = new Set(scopedRestaurantIds);

      return restaurants.filter((restaurant) => {
        if (restaurant.id === selectedTransferUser?.restaurantId) {
          return false;
        }

        if (isRegionalManager) {
          return scopeIds.has(restaurant.id);
        }

        return true;
      });
    },
    [
      isRegionalManager,
      restaurants,
      scopedRestaurantIds,
      selectedTransferUser?.restaurantId,
    ],
  );

  const selectedTransferRestaurant = useMemo(
    () =>
      restaurants.find(
        (restaurant) => restaurant.id === selectedTransferRestaurantId,
      ) ?? null,
    [restaurants, selectedTransferRestaurantId],
  );

  useEffect(() => {
    if (!isManager) {
      return;
    }

    if (
      selectedTransferUserId &&
      visibleTransferUsers.some((entry) => entry.id === selectedTransferUserId)
    ) {
      return;
    }

    setSelectedTransferUserId(visibleTransferUsers[0]?.id ?? null);
  }, [isManager, selectedTransferUserId, visibleTransferUsers]);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    if (
      selectedTransferRestaurantId &&
      availableTransferRestaurants.some(
        (restaurant) => restaurant.id === selectedTransferRestaurantId,
      )
    ) {
      return;
    }

    setSelectedTransferRestaurantId(availableTransferRestaurants[0]?.id ?? null);
  }, [availableTransferRestaurants, isManager, selectedTransferRestaurantId]);

  const levelUsers = useMemo(() => {
    const query = levelSearch.trim().toLowerCase();

    return usersFilteredByRestaurant
      .filter((entry) => entry.role === 'EMPLOYEE')
      .filter((entry) => matchesUserQuery(entry, query));
  }, [levelSearch, usersFilteredByRestaurant]);

  const selectedRestaurantFilterLabel = useMemo(() => {
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
  }, [
    employeeRestaurantOptions,
    selectedEmployeeRestaurantFilter,
    text.dashboard.quickRestaurantFilterAll,
    text.dashboard.quickRestaurantFilterUnassigned,
  ]);

  function toggleRestaurantFilter(section: RestaurantFilterSection) {
    setOpenRestaurantFilterFor((current) =>
      current === section ? null : section,
    );
  }

  function selectRestaurantFilter(value: RestaurantFilterValue) {
    setSelectedEmployeeRestaurantFilter(value);
    setOpenRestaurantFilterFor(null);
  }

  function selectTransferUser(userId: number) {
    setSelectedTransferUserId(userId);
  }

  function selectTransferRestaurant(restaurantId: number) {
    setSelectedTransferRestaurantId(restaurantId);
  }

  function openLevelEditor(entry: TrainingAccessUser) {
    setLevelEditorUser(entry);
  }

  function closeLevelEditor() {
    setLevelEditorUser(null);
  }

  async function handleApproveAccount(entry: TrainingAccessUser) {
    const confirmed = await confirmAction(
      isAdmin
        ? text.dashboard.quickApproveManagerTitle
        : text.dashboard.quickApproveTitle,
      isManagerLikeRole(entry.role)
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

  async function handleRejectAccount(entry: TrainingAccessUser) {
    const confirmed = await confirmAction(
      isManagerLikeRole(entry.role)
        ? text.adminTraining.rejectManagerAccountTitle
        : text.adminTraining.rejectAccountTitle,
      isManagerLikeRole(entry.role)
        ? text.adminTraining.rejectManagerAccountMessage
        : text.adminTraining.rejectAccountMessage,
      text.adminTraining.rejectAccountConfirm,
    );
    if (!confirmed) {
      return;
    }

    setIsRejectingUserId(entry.id);
    setUsersError(null);

    try {
      await rejectUserAccount(accessToken, entry.id);
      setUsers((current) =>
        current.filter((userEntry) => userEntry.id !== entry.id),
      );
    } catch {
      setUsersError(text.adminTraining.rejectAccountError);
    } finally {
      setIsRejectingUserId(null);
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
      setLevelEditorUser((current) => (current?.id === entry.id ? null : current));
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

  async function handleTransferUser() {
    if (
      !selectedTransferUser ||
      !selectedTransferRestaurantId ||
      !selectedTransferRestaurant
    ) {
      return;
    }

    const confirmed = await confirmAction(
      text.adminRestaurant.transferConfirmTitle,
      text.adminRestaurant.transferConfirmMessage
        .replace('{name}', getUserDisplayName(selectedTransferUser))
        .replace(
          '{from}',
          selectedTransferUser.restaurant?.name ?? text.adminRestaurant.unassignedLabel,
        )
        .replace('{to}', selectedTransferRestaurant.name),
      text.adminRestaurant.transferButton,
    );

    if (!confirmed) {
      return;
    }

    setIsTransferringUserId(selectedTransferUser.id);
    setTransferBlockError(null);

    try {
      const updated = await assignUserRestaurant(
        accessToken,
        selectedTransferUser.id,
        selectedTransferRestaurantId,
      );

      setUsers((current) =>
        current.filter((userEntry) => userEntry.id !== updated.id),
      );
      setTransferSearch('');
    } catch (transferError) {
      if (transferError instanceof Error && transferError.message.trim()) {
        setTransferBlockError(transferError.message);
      } else {
        setTransferBlockError(text.api.assignRestaurantError);
      }
    } finally {
      setIsTransferringUserId(null);
    }
  }

  return {
    accountApprovalUsers,
    approvalSearch,
    approvedManagerUsers,
    availableTransferRestaurants,
    closeLevelEditor,
    deleteSearch,
    deletionUsers,
    employeeRestaurantOptions,
    emailVerificationUsers,
    handleApproveAccount,
    handleDeleteUser,
    handleRejectAccount,
    handleTransferUser,
    handleUpdateEmployeeLevel,
    handleUpdateEmployeeWorkplaceRole,
    isApprovingUserId,
    isDeletingUserId,
    isRejectingUserId,
    isTransferringUserId,
    isUpdatingLevelUserId,
    isUpdatingWorkplaceUserId,
    levelBlockError,
    levelEditorUser,
    levelSearch,
    levelUsers,
    openLevelEditor,
    openRestaurantFilterFor,
    selectRestaurantFilter,
    selectedEmployeeRestaurantFilter,
    selectedRestaurantFilterLabel,
    selectedTransferRestaurant,
    selectedTransferRestaurantId,
    selectedTransferUser,
    selectedTransferUserId,
    setApprovalSearch,
    setDeleteSearch,
    setLevelSearch,
    setTransferSearch,
    selectTransferRestaurant,
    selectTransferUser,
    toggleRestaurantFilter,
    transferBlockError,
    transferSearch,
    users,
    usersError,
    usersLoading,
    visibleTransferUsers,
    restaurants,
  };
}
