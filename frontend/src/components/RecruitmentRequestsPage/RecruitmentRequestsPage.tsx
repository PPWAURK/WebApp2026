import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { BREAKPOINT_TABLET } from '../../constants/breakpoints';
import type { AppText } from '../../locales/translations';
import {
  createRecruitmentRequest,
  fetchRecruitmentRequests,
  updateRecruitmentRequestStatus,
  type RecruitmentContractType,
  type RecruitmentRequestStatus,
  type RecruitmentRequestSummary,
} from '../../services/recruitmentRequestsApi';
import type { User } from '../../types/auth';
import { styles } from './RecruitmentRequestsPage.styles';

type RecruitmentRequestsPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
};

type StatusFilter = RecruitmentRequestStatus | 'ALL';

const RECRUITMENT_POSITION_OPTIONS = [
  'Cuisine',
  'Serveur',
  'Assistant Cuisine',
] as const;

type RecruitmentPosition = (typeof RECRUITMENT_POSITION_OPTIONS)[number];

type PositionNeed = {
  FULL_TIME: string;
  PART_TIME: string;
};

function createDefaultPositionNeeds(): Record<RecruitmentPosition, PositionNeed> {
  return {
    Cuisine: {
      FULL_TIME: '0',
      PART_TIME: '0',
    },
    Serveur: {
      FULL_TIME: '0',
      PART_TIME: '0',
    },
    'Assistant Cuisine': {
      FULL_TIME: '0',
      PART_TIME: '0',
    },
  };
}

function getDisplayName(
  user: Pick<RecruitmentRequestSummary['createdBy'], 'name' | 'email'>,
  fallbackName: string,
): string {
  const trimmedName = user.name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return user.email.split('@')[0]?.trim() || fallbackName;
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
}

function getRequestStatusText(
  text: AppText,
  status: RecruitmentRequestStatus,
): string {
  return status === 'PROCESSED'
    ? text.recruitmentRequests.statusProcessed
    : text.recruitmentRequests.statusPending;
}

function getContractTypeText(
  text: AppText,
  contractType: RecruitmentContractType,
): string {
  return contractType === 'PART_TIME'
    ? text.recruitmentRequests.contractPartTime
    : text.recruitmentRequests.contractFullTime;
}

export function RecruitmentRequestsPage({
  text,
  accessToken,
  currentUser,
}: RecruitmentRequestsPageProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= BREAKPOINT_TABLET;
  const copy = text.recruitmentRequests;
  const isAdmin = currentUser.role === 'ADMIN';
  const isRegionalManager = currentUser.role === 'REGIONAL_MANAGER';
  const [positionNeeds, setPositionNeeds] = useState<
    Record<RecruitmentPosition, PositionNeed>
  >(createDefaultPositionNeeds);
  const [notes, setNotes] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    currentUser.managedRestaurants[0]?.id ?? currentUser.restaurant?.id ?? null,
  );
  const [requests, setRequests] = useState<RecruitmentRequestSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    void loadRequests(statusFilter);
  }, [accessToken, isAdmin, statusFilter]);

  const availableRestaurants = useMemo(() => {
    if (isRegionalManager) {
      return currentUser.managedRestaurants;
    }

    return currentUser.restaurant ? [currentUser.restaurant] : [];
  }, [currentUser.managedRestaurants, currentUser.restaurant, isRegionalManager]);

  const selectedPositionRequests = useMemo(
    () =>
      RECRUITMENT_POSITION_OPTIONS.flatMap((positionName) =>
        (['FULL_TIME', 'PART_TIME'] as RecruitmentContractType[]).map(
          (contractType) => ({
            position: positionName,
            contractType,
            headcount: Number(positionNeeds[positionName][contractType]),
          }),
        ),
      ).filter(
        (entry) => Number.isInteger(entry.headcount) && entry.headcount > 0,
      ),
    [positionNeeds],
  );

  const canSubmit =
    selectedPositionRequests.length > 0 &&
    (!isRegionalManager || selectedRestaurantId !== null) &&
    !isSubmitting;

  async function loadRequests(filter: StatusFilter): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchRecruitmentRequests(
        accessToken,
        filter === 'ALL' ? undefined : filter,
      );
      setRequests(result);
    } catch (loadError) {
      setRequests([]);
      setError(
        loadError instanceof Error ? loadError.message : copy.loadError,
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      setError(copy.validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await Promise.all(
        selectedPositionRequests.map((entry) =>
          createRecruitmentRequest(accessToken, {
            restaurantId: isRegionalManager
              ? selectedRestaurantId ?? undefined
              : undefined,
            position: entry.position,
            contractType: entry.contractType,
            headcount: entry.headcount,
            notes,
          }),
        ),
      );

      setPositionNeeds(createDefaultPositionNeeds());
      setNotes('');
      setSuccess(copy.submitSuccess);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : copy.submitError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusUpdate(
    request: RecruitmentRequestSummary,
  ): Promise<void> {
    const nextStatus =
      request.status === 'PENDING' ? 'PROCESSED' : 'PENDING';

    setUpdatingRequestId(request.id);
    setError(null);

    try {
      const updated = await updateRecruitmentRequestStatus(
        accessToken,
        request.id,
        nextStatus,
      );
      setRequests((currentValue) =>
        currentValue
          .map((entry) => (entry.id === updated.id ? updated : entry))
          .filter(
            (entry) => statusFilter === 'ALL' || entry.status === statusFilter,
          ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : copy.updateError,
      );
    } finally {
      setUpdatingRequestId(null);
    }
  }

  function renderRestaurantSelector() {
    if (!isRegionalManager) {
      return null;
    }

    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{copy.restaurantLabel}</Text>
        <View style={styles.optionRow}>
          {availableRestaurants.map((restaurant) => {
            const isSelected = selectedRestaurantId === restaurant.id;

            return (
              <Pressable
                key={restaurant.id}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipActive,
                ]}
                disabled={isSubmitting}
                onPress={() => setSelectedRestaurantId(restaurant.id)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    isSelected && styles.optionChipTextActive,
                  ]}
                >
                  {restaurant.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function updatePositionHeadcount(
    positionName: RecruitmentPosition,
    contractType: RecruitmentContractType,
    nextValue: string,
  ): void {
    setPositionNeeds((currentValue) => ({
      ...currentValue,
      [positionName]: {
        ...currentValue[positionName],
        [contractType]: nextValue,
      },
    }));
  }

  function renderManagerForm() {
    return (
      <View style={[styles.grid, isWideLayout && styles.gridWide]}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.formTitle}</Text>
          <Text style={styles.cardSubtitle}>{copy.formSubtitle}</Text>

          {renderRestaurantSelector()}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{copy.positionLabel}</Text>
            <Text style={styles.fieldHint}>{copy.positionHeadcountHint}</Text>
            <View style={styles.positionNeedList}>
              {RECRUITMENT_POSITION_OPTIONS.map((value) => {
                return (
                  <View key={value} style={styles.positionNeedRow}>
                    <Text style={styles.positionNeedName}>{value}</Text>
                    <View style={styles.positionContractGrid}>
                      {(['FULL_TIME', 'PART_TIME'] as RecruitmentContractType[]).map(
                        (contractValue) => {
                          return (
                            <View
                              key={contractValue}
                              style={styles.positionContractField}
                            >
                              <Text style={styles.positionContractLabel}>
                                {getContractTypeText(text, contractValue)}
                              </Text>
                              <TextInput
                                value={positionNeeds[value][contractValue]}
                                onChangeText={(nextValue) =>
                                  updatePositionHeadcount(
                                    value,
                                    contractValue,
                                    nextValue,
                                  )
                                }
                                editable={!isSubmitting}
                                keyboardType="number-pad"
                                placeholder={copy.headcountPlaceholder}
                                style={[styles.input, styles.positionNeedInput]}
                              />
                            </View>
                          );
                        },
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{copy.notesLabel}</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              editable={!isSubmitting}
              placeholder={copy.notesPlaceholder}
              multiline
              style={[styles.input, styles.multilineInput]}
            />
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
            ]}
            disabled={!canSubmit}
            onPress={() => {
              void handleSubmit();
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? copy.submitting : copy.submitButton}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderAdminRequestCard(request: RecruitmentRequestSummary) {
    const isProcessed = request.status === 'PROCESSED';
    const creatorName = getDisplayName(
      request.createdBy,
      text.dashboard.fallbackName,
    );
    const nextActionLabel = isProcessed
      ? copy.markPendingButton
      : copy.markProcessedButton;

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestTitleWrap}>
            <Text style={styles.requestTitle}>{request.position}</Text>
            <Text style={styles.requestMeta}>
              {request.restaurant.name} · {creatorName} ·{' '}
              {formatDateTime(request.createdAt)}
            </Text>
          </View>
          <View style={[styles.badge, isProcessed && styles.badgeProcessed]}>
            <Text
              style={[
                styles.badgeText,
                isProcessed && styles.badgeProcessedText,
              ]}
            >
              {getRequestStatusText(text, request.status)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailText}>
            {copy.contractTypeLabel}: {getContractTypeText(text, request.contractType)}
          </Text>
          <Text style={styles.detailText}>
            {copy.headcountLabel}: {request.headcount}
          </Text>
        </View>

        <View style={styles.notesBox}>
          <Text style={styles.notesText}>
            {request.notes.trim() || copy.noNotes}
          </Text>
        </View>

        {request.processedBy && request.processedAt ? (
          <Text style={styles.requestMeta}>
            {copy.processedByLabel}:{' '}
            {getDisplayName(request.processedBy, text.dashboard.fallbackName)} ·{' '}
            {formatDateTime(request.processedAt)}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.secondaryButton,
            updatingRequestId === request.id && styles.primaryButtonDisabled,
          ]}
          disabled={updatingRequestId === request.id}
          onPress={() => {
            void handleStatusUpdate(request);
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {updatingRequestId === request.id ? copy.updating : nextActionLabel}
          </Text>
        </Pressable>
      </View>
    );
  }

  function renderAdminList() {
    const filters: Array<{ label: string; value: StatusFilter }> = [
      { label: copy.filterAll, value: 'ALL' },
      { label: copy.statusPending, value: 'PENDING' },
      { label: copy.statusProcessed, value: 'PROCESSED' },
    ];

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{copy.adminTitle}</Text>
        <Text style={styles.cardSubtitle}>{copy.adminSubtitle}</Text>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const isSelected = statusFilter === filter.value;

            return (
              <Pressable
                key={filter.value}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipActive,
                ]}
                disabled={isLoading}
                onPress={() => setStatusFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    isSelected && styles.optionChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.requestList}>
          {isLoading ? (
            <Text style={styles.emptyText}>{copy.loading}</Text>
          ) : requests.length === 0 ? (
            <Text style={styles.emptyText}>{copy.empty}</Text>
          ) : (
            requests.map(renderAdminRequestCard)
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>
          {isAdmin ? copy.adminPageSubtitle : copy.managerPageSubtitle}
        </Text>
        {error ? <Text style={styles.statusText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}
      </View>

      {isAdmin ? renderAdminList() : renderManagerForm()}
    </ScrollView>
  );
}
