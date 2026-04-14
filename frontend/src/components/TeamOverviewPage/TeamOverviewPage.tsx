import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import { fetchRestaurants } from '../../services/restaurantsApi';
import {
  fetchTrainingAccessUsers,
  type TrainingAccessUser,
} from '../../services/usersApi';
import type {
  EmployeeLevel,
  Restaurant,
  User,
  WorkplaceRole,
} from '../../types/auth';
import {
  getUserScopedRestaurants,
  isManagerLikeRole,
} from '../../utils/roleAccess';
import { styles } from './TeamOverviewPage.styles';

type TeamOverviewPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
};

type StoreSummary = {
  key: string;
  id: number | null;
  name: string;
  address: string;
  total: number;
  memberCount: number;
  managementCount: number;
  probationCount: number;
  workplaceCounts: Record<WorkplaceRole, number>;
  roster: TrainingAccessUser[];
};

const LEVEL_ORDER: EmployeeLevel[] = [
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

const WORKPLACE_ORDER: WorkplaceRole[] = ['SALLE', 'CUISINE', 'BOTH'];

function createEmptyWorkplaceCounts(): Record<WorkplaceRole, number> {
  return {
    SALLE: 0,
    CUISINE: 0,
    BOTH: 0,
  };
}

function getDisplayName(
  user: Pick<TrainingAccessUser, 'name' | 'email'>,
  fallbackName: string,
) {
  const trimmedName = user.name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const emailPrefix = user.email.split('@')[0]?.trim();
  if (emailPrefix) {
    return emailPrefix;
  }

  return fallbackName;
}

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
}

function getRolePriority(role: TrainingAccessUser['role']) {
  if (role === 'ADMIN') {
    return 0;
  }

  if (role === 'REGIONAL_MANAGER') {
    return 1;
  }

  if (role === 'MANAGER') {
    return 2;
  }

  return 3;
}

export function TeamOverviewPage({
  text,
  accessToken,
  currentUser,
}: TeamOverviewPageProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1280;
  const isMediumLayout = width >= 860;
  const isCompactLayout = width < 720;
  const rosterColumnCount = width >= 1100 ? 2 : 1;
  const rosterRowsPerColumn = 5;
  const rosterItemsPerPage = rosterColumnCount * rosterRowsPerColumn;
  const rosterColumnWidth = rosterColumnCount === 2 ? '48.8%' : '100%';
  const scopedUserRestaurants = getUserScopedRestaurants(currentUser);
  const scopedRestaurantIds = scopedUserRestaurants.map(
    (restaurant) => restaurant.id,
  );
  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRosterKey, setSelectedRosterKey] = useState<string | null>(
    null,
  );
  const [selectedRosterPage, setSelectedRosterPage] = useState(1);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    void Promise.allSettled([
      fetchTrainingAccessUsers(accessToken),
      fetchRestaurants(),
    ])
      .then(([usersResult, restaurantsResult]) => {
        if (!isActive) {
          return;
        }

        if (usersResult.status !== 'fulfilled') {
          setError(text.teamOverview.loadError);
          return;
        }

        setUsers(usersResult.value);

        if (restaurantsResult.status === 'fulfilled') {
          setRestaurants(restaurantsResult.value);
        } else {
          const nextRestaurants = usersResult.value
            .map((entry) => entry.restaurant)
            .filter(
              (
                restaurant,
              ): restaurant is NonNullable<TrainingAccessUser['restaurant']> =>
                restaurant !== null,
            )
            .map((restaurant) => ({
              id: restaurant.id,
              name: restaurant.name,
              address: text.profile.noAddress,
            }));

          setRestaurants(nextRestaurants);
        }
      })
      .catch(() => {
        if (isActive) {
          setError(text.teamOverview.loadError);
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
  }, [accessToken, text.profile.noAddress, text.teamOverview.loadError]);

  const approvedUsers = useMemo(
    () => users.filter((entry) => entry.isApproved),
    [users],
  );

  const scopedUsers = useMemo(() => {
    if (!isManagerLikeRole(currentUser.role)) {
      return approvedUsers;
    }

    if (scopedRestaurantIds.length === 0) {
      return [];
    }

    return approvedUsers.filter(
      (entry) =>
        entry.restaurant?.id !== undefined &&
        scopedRestaurantIds.includes(entry.restaurant.id),
    );
  }, [approvedUsers, currentUser.role, scopedRestaurantIds]);

  const restaurantDirectory = useMemo(() => {
    const next = new Map<number, Restaurant>();

    for (const restaurant of restaurants) {
      next.set(restaurant.id, restaurant);
    }

    for (const restaurant of scopedUserRestaurants) {
      next.set(restaurant.id, restaurant);
    }

    return next;
  }, [restaurants, scopedUserRestaurants]);

  const scopedRestaurants = useMemo(() => {
    if (isManagerLikeRole(currentUser.role)) {
      if (scopedRestaurantIds.length === 0) {
        return [];
      }

      return scopedRestaurantIds
        .map((restaurantId) => restaurantDirectory.get(restaurantId) ?? null)
        .filter((restaurant): restaurant is Restaurant => restaurant !== null)
        .sort((left, right) => left.name.localeCompare(right.name));
    }

    return Array.from(restaurantDirectory.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [currentUser.role, restaurantDirectory, scopedRestaurantIds]);

  const storeSummaries = useMemo(() => {
    const next = new Map<string, StoreSummary>();

    for (const restaurant of scopedRestaurants) {
      next.set(`restaurant-${restaurant.id}`, {
        key: `restaurant-${restaurant.id}`,
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        total: 0,
        memberCount: 0,
        managementCount: 0,
        probationCount: 0,
        workplaceCounts: createEmptyWorkplaceCounts(),
        roster: [],
      });
    }

    for (const entry of scopedUsers) {
      const key = entry.restaurant?.id
        ? `restaurant-${entry.restaurant.id}`
        : 'unassigned';
      const restaurantRecord = entry.restaurant?.id
        ? restaurantDirectory.get(entry.restaurant.id)
        : null;

      if (!next.has(key)) {
        next.set(key, {
          key,
          id: entry.restaurant?.id ?? null,
          name:
            restaurantRecord?.name ??
            entry.restaurant?.name ??
            text.teamOverview.unassignedRestaurant,
          address: restaurantRecord?.address ?? text.profile.noAddress,
          total: 0,
          memberCount: 0,
          managementCount: 0,
          probationCount: 0,
          workplaceCounts: createEmptyWorkplaceCounts(),
          roster: [],
        });
      }

      const summary = next.get(key);
      if (!summary) {
        continue;
      }

      summary.total += 1;
      summary.workplaceCounts[entry.workplaceRole] += 1;
      summary.roster.push(entry);

      if (entry.role === 'ADMIN' || isManagerLikeRole(entry.role)) {
        summary.managementCount += 1;
      } else {
        summary.memberCount += 1;
      }

      if (entry.isOnProbation) {
        summary.probationCount += 1;
      }
    }

    return Array.from(next.values())
      .map((summary) => ({
        ...summary,
        roster: [...summary.roster].sort((left, right) => {
          const roleOrder =
            getRolePriority(left.role) - getRolePriority(right.role);
          if (roleOrder !== 0) {
            return roleOrder;
          }

          return getDisplayName(
            left,
            text.dashboard.fallbackName,
          ).localeCompare(getDisplayName(right, text.dashboard.fallbackName));
        }),
      }))
      .sort((left, right) => {
        if (
          left.id !== null &&
          right.id !== null &&
          left.total !== right.total
        ) {
          return right.total - left.total;
        }

        if (left.id === null && right.id !== null) {
          return 1;
        }

        if (left.id !== null && right.id === null) {
          return -1;
        }

        return left.name.localeCompare(right.name);
      });
  }, [
    scopedRestaurants,
    restaurantDirectory,
    scopedUsers,
    text.dashboard.fallbackName,
    text.profile.noAddress,
    text.teamOverview.unassignedRestaurant,
  ]);

  const restaurantCount = scopedRestaurants.length;
  const teamCount = scopedUsers.length;
  const managementCount = scopedUsers.filter(
    (entry) => entry.role === 'ADMIN' || isManagerLikeRole(entry.role),
  ).length;
  const probationCount = scopedUsers.filter(
    (entry) => entry.isOnProbation,
  ).length;

  const levelDistribution = useMemo(
    () =>
      LEVEL_ORDER.map((level) => ({
        level,
        count: scopedUsers.filter((entry) => entry.employeeLevel === level)
          .length,
      })).filter((entry) => entry.count > 0),
    [scopedUsers],
  );

  const workplaceDistribution = useMemo(
    () =>
      WORKPLACE_ORDER.map((workplaceRole) => ({
        workplaceRole,
        count: scopedUsers.filter(
          (entry) => entry.workplaceRole === workplaceRole,
        ).length,
      })),
    [scopedUsers],
  );

  const scopeValue =
    currentUser.role === 'ADMIN'
      ? text.teamOverview.scopeAllValue
      : scopedRestaurants.map((restaurant) => restaurant.name).join(' · ') ||
        text.profile.noRestaurant;
  const emptyMessage =
    isManagerLikeRole(currentUser.role) && scopedRestaurants.length === 0
      ? text.dashboard.managerRestaurantMissing
      : text.teamOverview.empty;
  const sectionCardWidth = !isMediumLayout
    ? '100%'
    : isWideLayout
      ? '48.5%'
      : '100%';
  const storeCardWidth = !isMediumLayout
    ? '100%'
    : isWideLayout
      ? '32%'
      : '48.5%';
  const metricCardWidth = isCompactLayout
    ? '100%'
    : isMediumLayout
      ? '24%'
      : '48.5%';
  const maxLevelCount = Math.max(
    ...levelDistribution.map((entry) => entry.count),
    1,
  );
  const selectedRosterSummary = useMemo(
    () =>
      storeSummaries.find((summary) => summary.key === selectedRosterKey) ??
      storeSummaries[0] ??
      null,
    [selectedRosterKey, storeSummaries],
  );
  const rosterPageCount = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(
          (selectedRosterSummary?.roster.length ?? 0) / rosterItemsPerPage,
        ),
      ),
    [rosterItemsPerPage, selectedRosterSummary?.roster.length],
  );
  const paginatedRoster = useMemo(() => {
    if (!selectedRosterSummary) {
      return [];
    }

    const startIndex = (selectedRosterPage - 1) * rosterItemsPerPage;
    return selectedRosterSummary.roster.slice(
      startIndex,
      startIndex + rosterItemsPerPage,
    );
  }, [rosterItemsPerPage, selectedRosterPage, selectedRosterSummary]);
  const paginatedRosterColumns = useMemo(
    () =>
      Array.from({ length: rosterColumnCount }, (_, columnIndex) =>
        paginatedRoster.slice(
          columnIndex * rosterRowsPerColumn,
          (columnIndex + 1) * rosterRowsPerColumn,
        ),
      ).filter((column) => column.length > 0),
    [paginatedRoster, rosterColumnCount],
  );

  useEffect(() => {
    if (storeSummaries.length === 0) {
      if (selectedRosterKey !== null) {
        setSelectedRosterKey(null);
      }
      return;
    }

    if (
      selectedRosterKey &&
      storeSummaries.some((summary) => summary.key === selectedRosterKey)
    ) {
      return;
    }

    const preferredSummary =
      storeSummaries.find((summary) => summary.total > 0) ?? storeSummaries[0];

    setSelectedRosterKey(preferredSummary.key);
  }, [selectedRosterKey, storeSummaries]);

  useEffect(() => {
    setSelectedRosterPage(1);
  }, [rosterItemsPerPage, selectedRosterKey]);

  useEffect(() => {
    if (selectedRosterPage > rosterPageCount) {
      setSelectedRosterPage(rosterPageCount);
    }
  }, [rosterPageCount, selectedRosterPage]);

  if (isLoading) {
    return (
      <View style={styles.feedbackState}>
        <ActivityIndicator size="large" color="#ab1e24" />
        <Text style={styles.feedbackText}>{text.teamOverview.loading}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.feedbackState}>
        <Ionicons name="alert-circle-outline" size={24} color="#ab1e24" />
        <Text style={styles.feedbackText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroBadge}>{text.teamOverview.title}</Text>
          <Text style={styles.heroTitle}>{text.teamOverview.title}</Text>
          <Text style={styles.heroSubtitle}>{text.teamOverview.subtitle}</Text>
        </View>

        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>
            {currentUser.role !== 'ADMIN'
              ? text.teamOverview.scopeCurrentRestaurant
              : text.teamOverview.scopeAllRestaurants}
          </Text>
          <Text style={styles.scopeValue}>{scopeValue}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        {[
          {
            icon: 'storefront-outline' as const,
            label: text.teamOverview.metricRestaurants,
            value: restaurantCount,
          },
          {
            icon: 'people-outline' as const,
            label: text.teamOverview.metricPeople,
            value: teamCount,
          },
          {
            icon: 'shield-checkmark-outline' as const,
            label: text.teamOverview.metricManagers,
            value: managementCount,
          },
          {
            icon: 'hourglass-outline' as const,
            label: text.teamOverview.metricProbation,
            value: probationCount,
          },
        ].map((item) => (
          <View
            key={item.label}
            style={[styles.metricCard, { width: metricCardWidth }]}
          >
            <View style={styles.metricIconWrap}>
              <Ionicons name={item.icon} size={18} color="#ab1e24" />
            </View>
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text style={styles.metricLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {teamCount === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={24} color="#ab1e24" />
          <Text style={styles.emptyTitle}>{text.teamOverview.title}</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {text.teamOverview.restaurantSectionTitle}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {text.teamOverview.restaurantSectionSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.storeGrid}>
              {storeSummaries.map((summary) => {
                const managerNames = summary.roster
                  .filter(
                    (entry) =>
                      entry.role === 'ADMIN' || isManagerLikeRole(entry.role),
                  )
                  .map((entry) =>
                    getDisplayName(entry, text.dashboard.fallbackName),
                  );

                return (
                  <View
                    key={summary.key}
                    style={[styles.storeCard, { width: storeCardWidth }]}
                  >
                    <View style={styles.storeHeader}>
                      <View style={styles.storeTextWrap}>
                        <Text style={styles.storeName}>{summary.name}</Text>
                        <Text style={styles.storeAddress}>
                          {summary.address}
                        </Text>
                      </View>
                      <View style={styles.storeCountBadge}>
                        <Text style={styles.storeCountLabel}>
                          {text.teamOverview.totalLabel}
                        </Text>
                        <Text style={styles.storeCountValue}>
                          {summary.total}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.storeStatRow}>
                      <View style={styles.storeStatChip}>
                        <Text style={styles.storeStatLabel}>
                          {text.teamOverview.membersLabel}
                        </Text>
                        <Text style={styles.storeStatValue}>
                          {summary.memberCount}
                        </Text>
                      </View>
                      <View style={styles.storeStatChip}>
                        <Text style={styles.storeStatLabel}>
                          {text.teamOverview.managersLabel}
                        </Text>
                        <Text style={styles.storeStatValue}>
                          {summary.managementCount}
                        </Text>
                      </View>
                      <View style={styles.storeStatChip}>
                        <Text style={styles.storeStatLabel}>
                          {text.teamOverview.probationLabel}
                        </Text>
                        <Text style={styles.storeStatValue}>
                          {summary.probationCount}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.workplaceChipRow}>
                      {WORKPLACE_ORDER.map((workplaceRole) => (
                        <View key={workplaceRole} style={styles.workplaceChip}>
                          <Text style={styles.workplaceChipLabel}>
                            {text.dashboard.workplaceValues[workplaceRole]}
                          </Text>
                          <Text style={styles.workplaceChipValue}>
                            {summary.workplaceCounts[workplaceRole]}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.managerBlock}>
                      <Text style={styles.managerLabel}>
                        {text.teamOverview.managerLineLabel}
                      </Text>
                      <Text style={styles.managerValue}>
                        {managerNames.length > 0
                          ? managerNames.join(' · ')
                          : text.teamOverview.noManagerAssigned}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.insightGrid}>
            <View style={[styles.sectionCard, { width: sectionCardWidth }]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {text.teamOverview.levelSectionTitle}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {text.teamOverview.levelSectionSubtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.distributionList}>
                {levelDistribution.map((entry) => {
                  const percentage =
                    teamCount > 0
                      ? Math.round((entry.count / teamCount) * 100)
                      : 0;
                  const barWidth = Math.max(
                    10,
                    Math.round((entry.count / maxLevelCount) * 100),
                  );

                  return (
                    <View key={entry.level} style={styles.distributionRow}>
                      <View style={styles.distributionTextWrap}>
                        <Text style={styles.distributionLabel}>
                          {text.dashboard.levels[entry.level]}
                        </Text>
                        <Text style={styles.distributionValue}>
                          {entry.count} · {percentage}%
                        </Text>
                      </View>
                      <View style={styles.distributionTrack}>
                        <View
                          style={[
                            styles.distributionFill,
                            { width: `${barWidth}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.sectionCard, { width: sectionCardWidth }]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {text.teamOverview.workplaceSectionTitle}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {text.teamOverview.workplaceSectionSubtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.workplaceSummaryGrid}>
                {workplaceDistribution.map((entry) => (
                  <View
                    key={entry.workplaceRole}
                    style={styles.workplaceSummaryCard}
                  >
                    <Text style={styles.workplaceSummaryValue}>
                      {entry.count}
                    </Text>
                    <Text style={styles.workplaceSummaryLabel}>
                      {text.dashboard.workplaceValues[entry.workplaceRole]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {text.teamOverview.rosterSectionTitle}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {text.teamOverview.rosterSectionSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.rosterFilterBlock}>
              <Text style={styles.rosterFilterLabel}>
                {text.teamOverview.rosterFilterLabel}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rosterFilterRow}
              >
                {storeSummaries.map((summary) => {
                  const isActive = selectedRosterSummary?.key === summary.key;

                  return (
                    <Pressable
                      key={`${summary.key}-filter`}
                      style={[
                        styles.rosterFilterButton,
                        isActive && styles.rosterFilterButtonActive,
                      ]}
                      onPress={() => setSelectedRosterKey(summary.key)}
                    >
                      <Text
                        style={[
                          styles.rosterFilterButtonText,
                          isActive && styles.rosterFilterButtonTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {summary.name}
                      </Text>
                      <View
                        style={[
                          styles.rosterFilterCount,
                          isActive && styles.rosterFilterCountActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rosterFilterCountText,
                            isActive && styles.rosterFilterCountTextActive,
                          ]}
                        >
                          {summary.total}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {selectedRosterSummary ? (
              <View style={styles.rosterSectionCard}>
                <View style={styles.rosterSectionHeader}>
                  <View style={styles.rosterSectionHeading}>
                    <Text style={styles.rosterStoreName}>
                      {selectedRosterSummary.name}
                    </Text>
                    <Text style={styles.rosterStoreAddress}>
                      {selectedRosterSummary.address}
                    </Text>
                  </View>
                  <View style={styles.rosterHeaderStats}>
                    <View style={styles.rosterHeaderBadge}>
                      <Text style={styles.rosterHeaderBadgeValue}>
                        {selectedRosterSummary.memberCount}
                      </Text>
                      <Text style={styles.rosterHeaderBadgeLabel}>
                        {text.teamOverview.membersLabel}
                      </Text>
                    </View>
                    <View style={styles.rosterHeaderBadge}>
                      <Text style={styles.rosterHeaderBadgeValue}>
                        {selectedRosterSummary.managementCount}
                      </Text>
                      <Text style={styles.rosterHeaderBadgeLabel}>
                        {text.teamOverview.managersLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedRosterSummary.roster.length > 0 ? (
                  <View style={styles.rosterPaginationBar}>
                    <Text style={styles.rosterPaginationText}>
                      {`${text.teamOverview.paginationPage} ${selectedRosterPage}/${rosterPageCount}`}
                    </Text>
                    {rosterPageCount > 1 ? (
                      <View style={styles.rosterPaginationControls}>
                        <Pressable
                          style={[
                            styles.rosterPaginationButton,
                            selectedRosterPage === 1 &&
                              styles.rosterPaginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setSelectedRosterPage((currentPage) =>
                              Math.max(1, currentPage - 1),
                            )
                          }
                          disabled={selectedRosterPage === 1}
                        >
                          <Ionicons
                            name="chevron-back-outline"
                            size={14}
                            color={
                              selectedRosterPage === 1 ? '#c9acab' : '#ab1e24'
                            }
                          />
                          <Text
                            style={[
                              styles.rosterPaginationButtonText,
                              selectedRosterPage === 1 &&
                                styles.rosterPaginationButtonTextDisabled,
                            ]}
                          >
                            {text.teamOverview.paginationPrev}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.rosterPaginationButton,
                            selectedRosterPage === rosterPageCount &&
                              styles.rosterPaginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setSelectedRosterPage((currentPage) =>
                              Math.min(rosterPageCount, currentPage + 1),
                            )
                          }
                          disabled={selectedRosterPage === rosterPageCount}
                        >
                          <Text
                            style={[
                              styles.rosterPaginationButtonText,
                              selectedRosterPage === rosterPageCount &&
                                styles.rosterPaginationButtonTextDisabled,
                            ]}
                          >
                            {text.teamOverview.paginationNext}
                          </Text>
                          <Ionicons
                            name="chevron-forward-outline"
                            size={14}
                            color={
                              selectedRosterPage === rosterPageCount
                                ? '#c9acab'
                                : '#ab1e24'
                            }
                          />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {selectedRosterSummary.roster.length === 0 ? (
                  <View style={styles.rosterEmptyState}>
                    <Text style={styles.rosterEmptyText}>
                      {text.teamOverview.emptyStore}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.rosterColumnsWrap}>
                    {paginatedRosterColumns.map(
                      (columnEntries, columnIndex) => (
                        <View
                          key={`roster-column-${columnIndex + 1}`}
                          style={[
                            styles.rosterColumn,
                            { width: rosterColumnWidth },
                          ]}
                        >
                          {columnEntries.map((entry, index) => {
                            const displayName = getDisplayName(
                              entry,
                              text.dashboard.fallbackName,
                            );
                            const rosterOrder =
                              (selectedRosterPage - 1) * rosterItemsPerPage +
                              columnIndex * rosterRowsPerColumn +
                              index +
                              1;

                            return (
                              <View
                                key={entry.id}
                                style={styles.rosterCompactCard}
                              >
                                <View style={styles.rosterCardHeader}>
                                  <View style={styles.avatarWrap}>
                                    {entry.profilePhoto ? (
                                      <Image
                                        source={{ uri: entry.profilePhoto }}
                                        style={styles.avatarImage}
                                      />
                                    ) : (
                                      <Text style={styles.avatarText}>
                                        {getInitial(displayName)}
                                      </Text>
                                    )}
                                  </View>
                                  <View style={styles.rosterBody}>
                                    <Text
                                      style={styles.rosterName}
                                      numberOfLines={1}
                                    >
                                      {displayName}
                                    </Text>
                                    <Text
                                      style={styles.rosterEmail}
                                      numberOfLines={1}
                                    >
                                      {entry.email}
                                    </Text>
                                  </View>
                                  <View style={styles.rosterOrderBadge}>
                                    <Text style={styles.rosterOrderBadgeText}>
                                      {rosterOrder}
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.rosterInfoPanel}>
                                  <View style={styles.rosterInfoGrid}>
                                    <View style={styles.rosterInfoItem}>
                                      <Text style={styles.rosterInfoLabel}>
                                        {text.dashboard.role}
                                      </Text>
                                      <Text
                                        style={styles.rosterInfoValue}
                                        numberOfLines={1}
                                      >
                                        {text.dashboard.roleValues[entry.role]}
                                      </Text>
                                    </View>
                                    <View style={styles.rosterInfoItem}>
                                      <Text style={styles.rosterInfoLabel}>
                                        {text.dashboard.workplace}
                                      </Text>
                                      <Text
                                        style={styles.rosterInfoValue}
                                        numberOfLines={1}
                                      >
                                        {
                                          text.dashboard.workplaceValues[
                                            entry.workplaceRole
                                          ]
                                        }
                                      </Text>
                                    </View>
                                    <View
                                      style={[
                                        styles.rosterInfoItem,
                                        styles.rosterInfoItemWide,
                                      ]}
                                    >
                                      <Text style={styles.rosterInfoLabel}>
                                        {text.dashboard.employeeLevelLabel}
                                      </Text>
                                      <Text
                                        style={styles.rosterInfoValue}
                                        numberOfLines={1}
                                      >
                                        {
                                          text.dashboard.levels[
                                            entry.employeeLevel
                                          ]
                                        }
                                      </Text>
                                    </View>
                                  </View>
                                  {entry.isOnProbation ? (
                                    <View style={styles.rosterStatusBadge}>
                                      <Text
                                        style={styles.rosterStatusBadgeText}
                                      >
                                        {text.dashboard.probation}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ),
                    )}
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
}
