import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import {
  fetchOrderHistoryAnalytics,
  type OrderHistoryAnalytics,
  type OrderSummary,
} from '../../services/ordersApi';
import { styles } from './OrderHistoryPage.styles';

type OrderHistoryPageProps = {
  text: AppText;
  accessToken: string;
  orders: OrderSummary[];
  isLoading: boolean;
  deletingOrderId: number | null;
  onRefresh: () => void;
  onDownloadOrderBon: (order: { id: number; bonUrl: string; number?: string }) => void;
  onDeleteOrder: (order: OrderSummary) => void;
};

type PeriodKey = '7d' | '30d' | 'this_month' | 'last_month' | 'all';
type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'items_desc';

const PERIODS: Array<{ key: PeriodKey; textKey: keyof AppText['orders'] }> = [
  { key: '7d', textKey: 'period7d' },
  { key: '30d', textKey: 'period30d' },
  { key: 'this_month', textKey: 'periodThisMonth' },
  { key: 'last_month', textKey: 'periodLastMonth' },
  { key: 'all', textKey: 'periodAll' },
];

const SORTS: Array<{ key: SortKey; textKey: keyof AppText['orders'] }> = [
  { key: 'date_desc', textKey: 'sortDateDesc' },
  { key: 'date_asc', textKey: 'sortDateAsc' },
  { key: 'amount_desc', textKey: 'sortAmountDesc' },
  { key: 'items_desc', textKey: 'sortItemsDesc' },
];

function toDateTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function monthLabel(value: string) {
  return value.slice(0, 7);
}

function formatAmount(value: number) {
  return value.toFixed(2);
}

function formatAverage(value: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const rounded = Number(value.toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function getPeriodLabel(text: AppText, period: PeriodKey) {
  const option = PERIODS.find((entry) => entry.key === period);
  return option ? text.orders[option.textKey] : text.orders.periodAll;
}

export function OrderHistoryPage({
  text,
  accessToken,
  orders,
  isLoading,
  deletingOrderId,
  onRefresh,
  onDownloadOrderBon,
  onDeleteOrder,
}: OrderHistoryPageProps) {
  const { width } = useWindowDimensions();
  const isMediumScreen = width >= 820;
  const isWideLayout = width >= 1180;

  const [selectedSupplierKey, setSelectedSupplierKey] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  const [search, setSearch] = useState('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [analytics, setAnalytics] = useState<OrderHistoryAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const groupedOrders = useMemo(() => {
    const supplierGroups = new Map<
      string,
      {
        supplierKey: string;
        supplierId: number;
        supplierName: string;
        orders: OrderSummary[];
      }
    >();

    for (const order of orders) {
      const supplierKey = `${order.supplierId}:${order.supplierName || 'unknown'}`;
      const supplier = supplierGroups.get(supplierKey) ?? {
        supplierKey,
        supplierId: order.supplierId,
        supplierName: order.supplierName || `#${order.supplierId}`,
        orders: [],
      };

      supplier.orders.push(order);
      supplierGroups.set(supplierKey, supplier);
    }

    return Array.from(supplierGroups.values()).sort((left, right) =>
      left.supplierName.localeCompare(right.supplierName),
    );
  }, [orders]);

  useEffect(() => {
    if (groupedOrders.length === 0) {
      setSelectedSupplierKey(null);
      return;
    }

    setSelectedSupplierKey((current) => {
      if (current && groupedOrders.some((group) => group.supplierKey === current)) {
        return current;
      }

      return groupedOrders[0].supplierKey;
    });
  }, [groupedOrders]);

  const selectedSupplierGroup =
    groupedOrders.find((group) => group.supplierKey === selectedSupplierKey) ?? null;

  useEffect(() => {
    if (!selectedSupplierGroup) {
      setAnalytics(null);
      setAnalyticsError(null);
      setAnalyticsLoading(false);
      return;
    }

    let isActive = true;
    setAnalyticsLoading(true);
    setAnalyticsError(null);

    void fetchOrderHistoryAnalytics(accessToken, {
      supplierId: selectedSupplierGroup.supplierId,
      period,
    })
      .then((result) => {
        if (!isActive) {
          return;
        }
        setAnalytics(result);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setAnalytics(null);
        setAnalyticsError(
          error instanceof Error && error.message.trim()
            ? error.message
            : text.orders.analyticsLoadError,
        );
      })
      .finally(() => {
        if (isActive) {
          setAnalyticsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, period, selectedSupplierGroup, text.orders.analyticsLoadError]);

  const filteredSortedOrders = useMemo(() => {
    if (!selectedSupplierGroup) {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();
    const scoped = selectedSupplierGroup.orders.filter((order) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${order.number} ${order.deliveryAddress}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    return [...scoped].sort((left, right) => {
      if (sortBy === 'date_asc') {
        return toDateTime(left.deliveryDate) - toDateTime(right.deliveryDate);
      }

      if (sortBy === 'amount_desc') {
        return right.totalAmount - left.totalAmount;
      }

      if (sortBy === 'items_desc') {
        return right.totalItems - left.totalItems;
      }

      return toDateTime(right.deliveryDate) - toDateTime(left.deliveryDate);
    });
  }, [search, selectedSupplierGroup, sortBy]);

  const ordersByDate = useMemo(() => {
    const map = new Map<string, OrderSummary[]>();
    for (const order of filteredSortedOrders) {
      const key = order.deliveryDate || 'N/A';
      const list = map.get(key) ?? [];
      list.push(order);
      map.set(key, list);
    }

    return Array.from(map.entries()).sort((left, right) =>
      toDateTime(right[0]) - toDateTime(left[0]),
    );
  }, [filteredSortedOrders]);

  useEffect(() => {
    if (ordersByDate.length === 0) {
      setExpandedDates({});
      return;
    }

    setExpandedDates((current) => {
      const next: Record<string, boolean> = {};
      for (const [date] of ordersByDate) {
        next[date] = current[date] ?? date === ordersByDate[0][0];
      }
      return next;
    });
  }, [ordersByDate]);

  const comparisonMax = Math.max(
    analytics?.current.totalItems ?? 0,
    analytics?.previous.totalItems ?? 0,
    1,
  );

  const filteredTotalItems = useMemo(
    () => filteredSortedOrders.reduce((sum, order) => sum + order.totalItems, 0),
    [filteredSortedOrders],
  );

  const filteredTotalAmount = useMemo(
    () => filteredSortedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [filteredSortedOrders],
  );

  const averageOrderItems =
    analytics?.current.avgOrderItems ??
    (filteredSortedOrders.length > 0 ? filteredTotalItems / filteredSortedOrders.length : 0);

  const activePeriodLabel = getPeriodLabel(text, period);

  return (
    <View style={styles.pageRoot}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{text.orders.historyTitle}</Text>
              <Text style={styles.subtitle}>{text.orders.historySubtitle}</Text>
            </View>
            <View style={styles.heroHeaderActions}>
              {selectedSupplierGroup ? (
                <View style={styles.heroBadge}>
                  <Ionicons name="storefront-outline" size={14} color="#ab1e24" />
                  <Text style={styles.heroBadgeText} numberOfLines={1}>
                    {selectedSupplierGroup.supplierName}
                  </Text>
                </View>
              ) : null}
              <Pressable style={styles.heroActionButton} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={16} color="#ab1e24" />
                <Text style={styles.heroActionButtonText}>{text.orders.refreshHistoryButton}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="calendar-outline" size={14} color="#ab1e24" />
              <Text style={styles.metaPillText}>{activePeriodLabel}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="albums-outline" size={14} color="#ab1e24" />
              <Text style={styles.metaPillText}>{filteredSortedOrders.length}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="layers-outline" size={14} color="#ab1e24" />
              <Text style={styles.metaPillText}>{ordersByDate.length}</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{text.orders.kpiUniqueProducts}</Text>
              <Text style={styles.heroStatValue}>{analytics?.current.uniqueProducts ?? 0}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{text.orders.kpiTotalItems}</Text>
              <Text style={styles.heroStatValue}>{analytics?.current.totalItems ?? filteredTotalItems}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{text.orders.kpiTotalAmount}</Text>
              <Text style={styles.heroStatValue}>
                {formatAmount(analytics?.current.totalAmount ?? filteredTotalAmount)}
              </Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{text.orders.avgOrderItemsLabel}</Text>
              <Text style={styles.heroStatValue}>{formatAverage(averageOrderItems)}</Text>
            </View>
          </View>
        </View>

        {groupedOrders.length > 0 ? (
          <View style={styles.toolbarCard}>
            <View style={styles.toolSection}>
              <Text style={styles.toolSectionTitle}>{text.orders.supplierTabsTitle}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRail}
              >
                {groupedOrders.map((supplierGroup) => {
                  const isActive = supplierGroup.supplierKey === selectedSupplierKey;

                  return (
                    <Pressable
                      key={`supplier-${supplierGroup.supplierKey}`}
                      style={[styles.supplierChip, isActive && styles.supplierChipActive]}
                      onPress={() => setSelectedSupplierKey(supplierGroup.supplierKey)}
                    >
                      <Text
                        style={[styles.supplierChipText, isActive && styles.supplierChipTextActive]}
                        numberOfLines={1}
                      >
                        {supplierGroup.supplierName}
                      </Text>
                      <View
                        style={[
                          styles.supplierChipCount,
                          isActive && styles.supplierChipCountActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.supplierChipCountText,
                            isActive && styles.supplierChipCountTextActive,
                          ]}
                        >
                          {supplierGroup.orders.length}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.toolbarGrid, isMediumScreen && styles.toolbarGridWide]}>
              <View style={[styles.toolSection, styles.searchSection]}>
                <View style={styles.searchShell}>
                  <Ionicons name="search-outline" size={18} color="#8d5a5f" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={text.orders.searchHistoryPlaceholder}
                    placeholderTextColor="#aa777b"
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
              </View>

              <View style={[styles.toolSection, styles.toolSectionWide]}>
                <Text style={styles.toolSectionTitle}>{text.orders.periodTabsTitle}</Text>
                <View style={styles.filterWrap}>
                  {PERIODS.map((periodOption) => {
                    const isActive = periodOption.key === period;
                    return (
                      <Pressable
                        key={`period-${periodOption.key}`}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() => setPeriod(periodOption.key)}
                      >
                        <Text
                          style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                        >
                          {text.orders[periodOption.textKey]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.toolSection, styles.toolSectionWide]}>
                <Text style={styles.toolSectionTitle}>{text.orders.sortTabsTitle}</Text>
                <View style={styles.filterWrap}>
                  {SORTS.map((sortOption) => {
                    const isActive = sortOption.key === sortBy;
                    return (
                      <Pressable
                        key={`sort-${sortOption.key}`}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() => setSortBy(sortOption.key)}
                      >
                        <Text
                          style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                        >
                          {text.orders[sortOption.textKey]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {analyticsLoading ? (
          <View style={styles.statusCard}>
            <Ionicons name="analytics-outline" size={18} color="#ab1e24" />
            <Text style={styles.statusText}>{text.orders.loading}</Text>
          </View>
        ) : null}

        {analyticsError ? (
          <View style={styles.statusCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#ab1e24" />
            <Text style={styles.statusText}>{analyticsError}</Text>
          </View>
        ) : null}

        {analytics ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionEyebrow}>{text.orders.periodTabsTitle}</Text>
                  <Text style={styles.sectionTitle}>{activePeriodLabel}</Text>
                  <Text style={styles.sectionSubtitle}>
                    {selectedSupplierGroup?.supplierName ?? text.orders.supplierTabsTitle}
                  </Text>
                </View>
                <View style={styles.sectionCountPill}>
                  <Text style={styles.sectionCountText}>{analytics.current.orders}</Text>
                </View>
              </View>

              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{text.orders.kpiUniqueProducts}</Text>
                  <Text style={styles.kpiValue}>{analytics.current.uniqueProducts}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{text.orders.kpiTotalItems}</Text>
                  <Text style={styles.kpiValue}>{analytics.current.totalItems}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{text.orders.kpiTotalAmount}</Text>
                  <Text style={styles.kpiValue}>{formatAmount(analytics.current.totalAmount)}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{text.orders.kpiDeltaVsPrevious}</Text>
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
                      {text.orders.lastMonthLabel}: {analytics.previous.totalItems}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.analyticsGrid, isWideLayout && styles.analyticsGridWide]}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>{text.orders.monthCompareTitle}</Text>

                <View style={styles.comparisonBlock}>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>{text.orders.thisMonthLabel}</Text>
                    <Text style={styles.comparisonValue}>{analytics.current.totalItems}</Text>
                  </View>
                  <View style={styles.comparisonTrack}>
                    <View
                      style={[
                        styles.comparisonBarCurrent,
                        { width: `${(analytics.current.totalItems / comparisonMax) * 100}%` },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.comparisonBlock}>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>{text.orders.lastMonthLabel}</Text>
                    <Text style={styles.comparisonValue}>{analytics.previous.totalItems}</Text>
                  </View>
                  <View style={styles.comparisonTrack}>
                    <View
                      style={[
                        styles.comparisonBarPrevious,
                        { width: `${(analytics.previous.totalItems / comparisonMax) * 100}%` },
                      ]}
                    />
                  </View>
                </View>

                <Text style={styles.comparisonDelta}>
                  {text.orders.deltaLabel}: {analytics.delta.items >= 0 ? '+' : ''}
                  {analytics.delta.items}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>{text.orders.insightsTitle}</Text>
                <View style={styles.insightRow}>
                  <Ionicons name="pricetag-outline" size={16} color="#ab1e24" />
                  <Text style={styles.insightText}>
                    {text.orders.topProductLabel}:{' '}
                    {analytics.topProducts[0]
                      ? analytics.topProducts[0].nameFr || analytics.topProducts[0].nameZh
                      : text.orders.historyEmpty}
                  </Text>
                </View>
                <View style={styles.insightRow}>
                  <Ionicons name="calendar-clear-outline" size={16} color="#ab1e24" />
                  <Text style={styles.insightText}>
                    {text.orders.busiestDayLabel}:{' '}
                    {analytics.busiestDay
                      ? `${analytics.busiestDay.date} (${analytics.busiestDay.totalItems})`
                      : 'N/A'}
                  </Text>
                </View>
                <View style={styles.insightRow}>
                  <Ionicons name="cube-outline" size={16} color="#ab1e24" />
                  <Text style={styles.insightText}>
                    {text.orders.avgOrderItemsLabel}: {formatAverage(analytics.current.avgOrderItems)}
                  </Text>
                </View>
              </View>

              {analytics.monthlyTrend.length ? (
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>{text.orders.trendTitle}</Text>
                  {analytics.monthlyTrend.map((entry) => (
                    <View key={`trend-${entry.month}`} style={styles.trendRow}>
                      <Text style={styles.trendMonth}>{monthLabel(entry.month)}</Text>
                      <View style={styles.trendValues}>
                        <Text style={styles.trendMetric}>{entry.totalItems}</Text>
                        <Text style={styles.trendMetric}>{entry.totalAmount.toFixed(0)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        <View style={styles.historyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>{text.orders.historyTitle}</Text>
              <Text style={styles.sectionTitle}>
                {selectedSupplierGroup?.supplierName ?? text.orders.supplierTabsTitle}
              </Text>
              <Text style={styles.sectionSubtitle}>{text.orders.historySubtitle}</Text>
            </View>
            <View style={styles.sectionCountPill}>
              <Text style={styles.sectionCountText}>{filteredSortedOrders.length}</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={20} color="#ab1e24" />
              <Text style={styles.emptyStateText}>{text.orders.loading}</Text>
            </View>
          ) : null}

          {!isLoading && orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={20} color="#ab1e24" />
              <Text style={styles.emptyStateText}>{text.orders.historyEmpty}</Text>
            </View>
          ) : null}

          {!isLoading && orders.length > 0 && filteredSortedOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={20} color="#ab1e24" />
              <Text style={styles.emptyStateText}>{text.orders.historyEmpty}</Text>
            </View>
          ) : null}

          {!isLoading && filteredSortedOrders.length > 0 ? (
            <View style={styles.listBlock}>
              {ordersByDate.map(([date, dateOrders]) => {
                const isOpen = expandedDates[date] ?? false;
                const totalItems = dateOrders.reduce((sum, order) => sum + order.totalItems, 0);
                const totalAmount = dateOrders.reduce((sum, order) => sum + order.totalAmount, 0);

                return (
                  <View
                    key={`date-${date}`}
                    style={[styles.dateSection, isOpen && styles.dateSectionOpen]}
                  >
                    <Pressable
                      style={styles.dateHeaderButton}
                      onPress={() =>
                        setExpandedDates((current) => ({
                          ...current,
                          [date]: !isOpen,
                        }))
                      }
                    >
                      <View style={styles.dateHeaderMain}>
                        <View style={styles.dateIconWrap}>
                          <Ionicons name="calendar-outline" size={16} color="#ab1e24" />
                        </View>
                        <View style={styles.dateInfo}>
                          <Text style={styles.dateTitle}>{date}</Text>
                          <View style={styles.dateMetaRow}>
                            <View style={styles.dateMetaPill}>
                              <Ionicons name="receipt-outline" size={13} color="#ab1e24" />
                              <Text style={styles.dateMetaText}>{dateOrders.length}</Text>
                            </View>
                            <View style={styles.dateMetaPill}>
                              <Ionicons name="cube-outline" size={13} color="#ab1e24" />
                              <Text style={styles.dateMetaText}>{totalItems}</Text>
                            </View>
                            <View style={styles.dateMetaPill}>
                              <Ionicons name="cash-outline" size={13} color="#ab1e24" />
                              <Text style={styles.dateMetaText}>{formatAmount(totalAmount)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <Ionicons
                        name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                        size={18}
                        color="#8d5a5f"
                      />
                    </Pressable>

                    {isOpen ? (
                      <View style={styles.ordersGrid}>
                        {dateOrders.map((order) => (
                          <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderCardHeader}>
                              <View style={styles.orderCardCopy}>
                                <Text style={styles.orderNumber}>{order.number}</Text>
                                <Text style={styles.orderAddress} numberOfLines={2}>
                                  {order.deliveryAddress}
                                </Text>
                              </View>
                              <View style={styles.orderAmountPill}>
                                <Text style={styles.orderAmountLabel}>{text.orders.summaryAmount}</Text>
                                <Text style={styles.orderAmountValue}>
                                  {formatAmount(order.totalAmount)}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.orderMetaGrid}>
                              <View style={styles.orderMetaItem}>
                                <Text style={styles.orderMetaLabel}>
                                  {text.orders.deliveryAddressLabel}
                                </Text>
                                <Text style={styles.orderMetaValue} numberOfLines={2}>
                                  {order.deliveryAddress}
                                </Text>
                              </View>
                              <View style={styles.orderMetaItemSmall}>
                                <Text style={styles.orderMetaLabel}>{text.orders.summaryItems}</Text>
                                <Text style={styles.orderMetaValue}>{order.totalItems}</Text>
                              </View>
                              <View style={styles.orderMetaItemSmall}>
                                <Text style={styles.orderMetaLabel}>
                                  {text.orders.deliveryDateLabel}
                                </Text>
                                <Text style={styles.orderMetaValue}>{order.deliveryDate}</Text>
                              </View>
                            </View>

                            <View style={styles.orderActionsRow}>
                              <Pressable
                                style={styles.primaryButton}
                                onPress={() => onDownloadOrderBon(order)}
                              >
                                <Ionicons name="download-outline" size={16} color="#ffffff" />
                                <Text style={styles.primaryButtonText}>
                                  {text.orders.downloadBonButton}
                                </Text>
                              </Pressable>

                              <Pressable
                                style={[
                                  styles.secondaryButton,
                                  deletingOrderId === order.id && styles.disabledButton,
                                ]}
                                onPress={() => onDeleteOrder(order)}
                                disabled={deletingOrderId === order.id}
                              >
                                <Ionicons name="trash-outline" size={16} color="#ab1e24" />
                                <Text style={styles.secondaryButtonText}>
                                  {deletingOrderId === order.id
                                    ? text.orders.deletingHistoryButton
                                    : text.orders.deleteHistoryButton}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
