import { Text, View } from 'react-native';
import type { AppText } from '../../../locales/translations';
import type { OrderReturnSummary } from '../../../services/ordersApi';
import { styles } from '../../../components/SessionCard/SessionCard.styles';

type DashboardReturnSummaryCardProps = {
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

export function DashboardReturnSummaryCard({
  recentReturns,
  returnsError,
  returnsLoading,
  text,
}: DashboardReturnSummaryCardProps) {
  const totalReturnedItems = recentReturns.reduce(
    (sum, entry) => sum + entry.totalItems,
    0,
  );
  const visibleReturns = recentReturns.slice(0, 4);

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

      {visibleReturns.length > 0 ? (
        <View style={styles.returnsSummaryList}>
          {visibleReturns.map((entry) => (
            <View
              key={`dashboard-return-${entry.id}`}
              style={styles.returnsSummaryCard}
            >
              <View style={styles.returnsSummaryTopRow}>
                <View style={styles.returnsSummaryCopy}>
                  <Text style={styles.returnsSummaryOrderNumber}>
                    {entry.orderNumber}
                  </Text>
                  <Text style={styles.returnsSummaryMeta}>
                    {entry.supplierName} • {formatReturnDate(entry.createdAt)}
                  </Text>
                </View>
                <View style={styles.returnsSummaryCountPill}>
                  <Text style={styles.returnsSummaryCountText}>
                    {entry.totalItems}
                  </Text>
                </View>
              </View>

              <View style={styles.returnsSummaryField}>
                <Text style={styles.returnsSummaryFieldLabel}>
                  {text.dashboard.returnSummaryReasonLabel}
                </Text>
                <Text style={styles.returnsSummaryFieldValue}>
                  {entry.reason}
                </Text>
              </View>

              <View style={styles.returnsSummaryField}>
                <Text style={styles.returnsSummaryFieldLabel}>
                  {text.dashboard.returnSummaryProductsLabel}
                </Text>
                <Text style={styles.returnsSummaryFieldValue}>
                  {buildProductsLabel(entry)}
                </Text>
              </View>

              {entry.notes ? (
                <View style={styles.returnsSummaryField}>
                  <Text style={styles.returnsSummaryFieldLabel}>
                    {text.dashboard.returnSummaryNotesLabel}
                  </Text>
                  <Text style={styles.returnsSummaryFieldValue}>
                    {entry.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
