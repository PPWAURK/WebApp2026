import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { OrderHistoryAnalytics as OrderHistoryAnalyticsData } from '../../services/ordersApi';
import {
  formatAverage,
  formatAmount,
  monthLabel,
  type SupplierOrderGroup,
} from './orderHistory.shared';
import { styles } from './OrderHistoryPage.styles';

type OrderHistoryAnalyticsProps = {
  text: AppText;
  analytics: OrderHistoryAnalyticsData | null;
  analyticsError: string | null;
  analyticsLoading: boolean;
  activePeriodLabel: string;
  averageOrderItemsLabel: string;
  comparisonMax: number;
  filteredSortedOrdersCount: number;
  filteredTotalAmount: number;
  filteredTotalItems: number;
  isWideLayout: boolean;
  ordersByDateCount: number;
  selectedSupplierGroup: SupplierOrderGroup | null;
  onRefresh: () => void;
};

function getComparisonBarWidth(value: number, max: number): `${number}%` {
  if (value <= 0 || max <= 0) {
    return '0%';
  }

  return `${(value / max) * 100}%`;
}

export function OrderHistoryAnalytics({
  text,
  analytics,
  analyticsError,
  analyticsLoading,
  activePeriodLabel,
  averageOrderItemsLabel,
  comparisonMax,
  filteredSortedOrdersCount,
  filteredTotalAmount,
  filteredTotalItems,
  isWideLayout,
  ordersByDateCount,
  selectedSupplierGroup,
  onRefresh,
}: OrderHistoryAnalyticsProps) {
  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>{text.orders.historyTitle}</Text>
            <Text style={styles.subtitle}>{text.orders.historySubtitle}</Text>
          </View>
          <View style={styles.heroHeaderActions}>
            {selectedSupplierGroup ? (
              <View style={styles.heroBadge}>
                <Ionicons
                  name="storefront-outline"
                  size={14}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.heroBadgeText} numberOfLines={1}>
                  {selectedSupplierGroup.supplierName}
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.heroActionButton} onPress={onRefresh}>
              <Ionicons
                name="refresh-outline"
                size={16}
                color={COLORS.brandPrimary}
              />
              <Text style={styles.heroActionButtonText}>
                {text.orders.refreshHistoryButton}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.metaPill}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.brandPrimary}
            />
            <Text style={styles.metaPillText}>{activePeriodLabel}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons
              name="albums-outline"
              size={14}
              color={COLORS.brandPrimary}
            />
            <Text style={styles.metaPillText}>{filteredSortedOrdersCount}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons
              name="layers-outline"
              size={14}
              color={COLORS.brandPrimary}
            />
            <Text style={styles.metaPillText}>{ordersByDateCount}</Text>
          </View>
        </View>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>
              {text.orders.kpiUniqueProducts}
            </Text>
            <Text style={styles.heroStatValue}>
              {analytics?.current.uniqueProducts ?? 0}
            </Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>
              {text.orders.kpiTotalItems}
            </Text>
            <Text style={styles.heroStatValue}>
              {analytics?.current.totalItems ?? filteredTotalItems}
            </Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>
              {text.orders.kpiTotalAmount}
            </Text>
            <Text style={styles.heroStatValue}>
              {formatAmount(
                analytics?.current.totalAmount ?? filteredTotalAmount,
              )}
            </Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>
              {text.orders.avgOrderItemsLabel}
            </Text>
            <Text style={styles.heroStatValue}>{averageOrderItemsLabel}</Text>
          </View>
        </View>
      </View>

      {analyticsLoading ? (
        <View style={styles.statusCard}>
          <Ionicons
            name="analytics-outline"
            size={18}
            color={COLORS.brandPrimary}
          />
          <Text style={styles.statusText}>{text.orders.loading}</Text>
        </View>
      ) : null}

      {analyticsError ? (
        <View style={styles.statusCard}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={COLORS.brandPrimary}
          />
          <Text style={styles.statusText}>{analyticsError}</Text>
        </View>
      ) : null}

      {analytics ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionEyebrow}>
                  {text.orders.periodTabsTitle}
                </Text>
                <Text style={styles.sectionTitle}>{activePeriodLabel}</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedSupplierGroup?.supplierName ??
                    text.orders.supplierTabsTitle}
                </Text>
              </View>
              <View style={styles.sectionCountPill}>
                <Text style={styles.sectionCountText}>
                  {analytics.current.orders}
                </Text>
              </View>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>
                  {text.orders.kpiUniqueProducts}
                </Text>
                <Text style={styles.kpiValue}>
                  {analytics.current.uniqueProducts}
                </Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{text.orders.kpiTotalItems}</Text>
                <Text style={styles.kpiValue}>
                  {analytics.current.totalItems}
                </Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>
                  {text.orders.kpiTotalAmount}
                </Text>
                <Text style={styles.kpiValue}>
                  {formatAmount(analytics.current.totalAmount)}
                </Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>
                  {text.orders.kpiDeltaVsPrevious}
                </Text>
                <Text style={styles.kpiValue}>
                  {analytics.delta.itemsRate !== null
                    ? `${analytics.delta.itemsRate >= 0 ? '+' : ''}${analytics.delta.itemsRate}%`
                    : '0%'}
                </Text>
                <View style={styles.kpiMetaRow}>
                  <Text style={styles.kpiMetaText}>
                    {text.orders.thisMonthLabel}: {analytics.current.totalItems}
                  </Text>
                  <Text style={styles.kpiMetaText}>
                    {text.orders.lastMonthLabel}:{' '}
                    {analytics.previous.totalItems}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.analyticsGrid,
              isWideLayout && styles.analyticsGridWide,
            ]}
          >
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>
                {text.orders.monthCompareTitle}
              </Text>
              <View style={styles.comparisonBlock}>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>
                    {text.orders.thisMonthLabel}
                  </Text>
                  <Text style={styles.comparisonValue}>
                    {analytics.current.totalItems}
                  </Text>
                </View>
                {analytics.current.totalItems > 0 ? (
                  <View style={styles.comparisonTrack}>
                    <View
                      style={[
                        styles.comparisonBarCurrent,
                        {
                          width: getComparisonBarWidth(
                            analytics.current.totalItems,
                            comparisonMax,
                          ),
                        },
                      ]}
                    />
                  </View>
                ) : (
                  <View style={styles.comparisonTrackEmpty} />
                )}
              </View>

              <View style={styles.comparisonBlock}>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>
                    {text.orders.lastMonthLabel}
                  </Text>
                  <Text style={styles.comparisonValue}>
                    {analytics.previous.totalItems}
                  </Text>
                </View>
                {analytics.previous.totalItems > 0 ? (
                  <View style={styles.comparisonTrack}>
                    <View
                      style={[
                        styles.comparisonBarPrevious,
                        {
                          width: getComparisonBarWidth(
                            analytics.previous.totalItems,
                            comparisonMax,
                          ),
                        },
                      ]}
                    />
                  </View>
                ) : (
                  <View style={styles.comparisonTrackEmpty} />
                )}
              </View>

              <Text style={styles.comparisonDelta}>
                {text.orders.deltaLabel}:{' '}
                {analytics.delta.items >= 0 ? '+' : ''}
                {analytics.delta.items}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>
                {text.orders.insightsTitle}
              </Text>
              <View style={styles.insightRow}>
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.insightText}>
                  {text.orders.topProductLabel}:{' '}
                  {analytics.topProducts[0]
                    ? analytics.topProducts[0].nameFr ||
                      analytics.topProducts[0].nameZh
                    : text.orders.historyEmpty}
                </Text>
              </View>
              <View style={styles.insightRow}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={16}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.insightText}>
                  {text.orders.busiestDayLabel}:{' '}
                  {analytics.busiestDay
                    ? `${analytics.busiestDay.date} (${analytics.busiestDay.totalItems})`
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.insightRow}>
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.insightText}>
                  {text.orders.avgOrderItemsLabel}:{' '}
                  {formatAverage(analytics.current.avgOrderItems)}
                </Text>
              </View>
            </View>

            {analytics.monthlyTrend.length ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>
                  {text.orders.trendTitle}
                </Text>
                {analytics.monthlyTrend.map((entry) => (
                  <View key={`trend-${entry.month}`} style={styles.trendRow}>
                    <Text style={styles.trendMonth}>
                      {monthLabel(entry.month)}
                    </Text>
                    <View style={styles.trendValues}>
                      <Text style={styles.trendMetric}>{entry.totalItems}</Text>
                      <Text style={styles.trendMetric}>
                        {entry.totalAmount.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </>
  );
}
