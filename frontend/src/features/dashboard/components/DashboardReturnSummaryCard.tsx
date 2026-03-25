import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../../../locales/translations';
import type { OrderReturnSummary } from '../../../services/ordersApi';
import { styles } from '../../../components/SessionCard/SessionCard.styles';

type DashboardReturnSummaryCardProps = {
  isCompactLayout: boolean;
  onOpenReturnPhotos: (entry: OrderReturnSummary) => void;
  recentReturns: OrderReturnSummary[];
  returnsError: string | null;
  returnsLoading: boolean;
  text: AppText;
};

function formatReturnDate(value: string) {
  return value.slice(0, 10);
}

function buildProductsLabel(entry: OrderReturnSummary) {
  const label = entry.items
    .map((item) => {
      const label = item.nameFr.trim() || item.nameZh.trim() || '-';
      return `${label} x${item.quantity}`;
    })
    .join(' / ');

  return label || '-';
}

function hasReturnPhotos(entry: OrderReturnSummary) {
  return entry.items.some((item) => item.photos.length > 0);
}

export function DashboardReturnSummaryCard({
  isCompactLayout,
  onOpenReturnPhotos,
  recentReturns,
  returnsError,
  returnsLoading,
  text,
}: DashboardReturnSummaryCardProps) {
  const totalReturnedItems = recentReturns.reduce(
    (sum, entry) => sum + entry.totalItems,
    0,
  );
  const latestReturn = recentReturns[0] ?? null;

  return (
    <View style={[styles.quickBlock, styles.returnsSummaryPanel]}>
      <View style={styles.topProductsHeader}>
        <View style={styles.topProductsHeaderMain}>
          <Text style={styles.quickBlockTitle}>
            {text.dashboard.returnSummaryTitle}
          </Text>
          <Text style={styles.topProductsSubtitle}>
            {text.dashboard.returnSummarySubtitle}
          </Text>
        </View>

        {recentReturns.length > 0 ? (
          <View style={styles.topProductsMetricRail}>
            <View style={styles.topProductsMetricCard}>
              <Text style={styles.topProductsMetricValue}>
                {recentReturns.length}
              </Text>
              <Text style={styles.topProductsMetricLabel}>
                {text.dashboard.returnSummaryMetricRequests}
              </Text>
            </View>
            <View style={styles.topProductsMetricCard}>
              <Text style={styles.topProductsMetricValue}>
                {totalReturnedItems}
              </Text>
              <Text style={styles.topProductsMetricLabel}>
                {text.dashboard.returnSummaryMetricItems}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {returnsLoading ? (
        <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
      ) : null}

      {returnsError ? (
        <Text style={styles.errorText}>{returnsError}</Text>
      ) : null}

      {!returnsLoading && !returnsError && recentReturns.length === 0 ? (
        <Text style={styles.subtitle}>{text.dashboard.returnSummaryEmpty}</Text>
      ) : null}

      {latestReturn ? (
        <View style={styles.returnsSummaryList}>
          <View
            key={`dashboard-return-${latestReturn.id}`}
            style={styles.returnsSummaryCard}
          >
            <View
              style={[
                styles.returnsSummaryTopRow,
                isCompactLayout && styles.returnsSummaryTopRowCompact,
              ]}
            >
              <View style={styles.returnsSummaryCopy}>
                <Text style={styles.returnsSummaryOrderNumber} numberOfLines={1}>
                  {latestReturn.orderNumber}
                </Text>
                <Text style={styles.returnsSummaryMeta} numberOfLines={1}>
                  {latestReturn.supplierName} •{' '}
                  {formatReturnDate(latestReturn.createdAt)}
                </Text>
              </View>
              <View
                style={[
                  styles.returnsSummaryCountPill,
                  isCompactLayout && styles.returnsSummaryCountPillCompact,
                ]}
              >
                <Text style={styles.returnsSummaryCountText}>
                  {latestReturn.totalItems}
                </Text>
              </View>
            </View>

            <View style={styles.returnsSummaryField}>
              <Text style={styles.returnsSummaryFieldLabel}>
                {text.dashboard.returnSummaryReasonLabel}
              </Text>
              <Text style={styles.returnsSummaryFieldValue}>
                {latestReturn.reason}
              </Text>
            </View>

            <View style={styles.returnsSummaryField}>
              <Text style={styles.returnsSummaryFieldLabel}>
                {text.dashboard.returnSummaryProductsLabel}
              </Text>
              <Text style={styles.returnsSummaryFieldValue}>
                {buildProductsLabel(latestReturn)}
              </Text>
            </View>

            {latestReturn.notes ? (
              <View style={styles.returnsSummaryField}>
                <Text style={styles.returnsSummaryFieldLabel}>
                  {text.dashboard.returnSummaryNotesLabel}
                </Text>
                <Text style={styles.returnsSummaryFieldValue}>
                  {latestReturn.notes}
                </Text>
              </View>
            ) : null}

            {hasReturnPhotos(latestReturn) ? (
              <View style={styles.returnsSummaryActionRow}>
                <Pressable
                  style={styles.returnsSummaryActionButton}
                  onPress={() => onOpenReturnPhotos(latestReturn)}
                >
                  <Ionicons name="images-outline" size={15} color="#7f1b21" />
                  <Text style={styles.returnsSummaryActionButtonText}>
                    {text.dashboard.returnSummaryViewPhotosButton}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
