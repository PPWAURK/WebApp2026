import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{text.orders.historyTitle}</Text>
          <Text style={styles.subtitle}>{text.orders.historySubtitle}</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>{text.orders.refreshHistoryButton}</Text>
        </Pressable>
      </View>

      {isLoading ? <Text style={styles.docEmpty}>{text.orders.loading}</Text> : null}
      {!isLoading && orders.length === 0 ? <Text style={styles.docEmpty}>{text.orders.historyEmpty}</Text> : null}

      {groupedOrders.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsWrap}>
          {groupedOrders.map((supplierGroup) => {
            const isActive = supplierGroup.supplierKey === selectedSupplierKey;
            return (
              <Pressable
                key={`tab-${supplierGroup.supplierKey}`}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setSelectedSupplierKey(supplierGroup.supplierKey)}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {supplierGroup.supplierName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {PERIODS.map((periodOption) => {
          const isActive = periodOption.key === period;
          return (
            <Pressable
              key={`period-${periodOption.key}`}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setPeriod(periodOption.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {text.orders[periodOption.textKey]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <TextInput
        style={styles.searchInput}
        placeholder={text.orders.searchHistoryPlaceholder}
        placeholderTextColor="#aa777b"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {SORTS.map((sortOption) => {
          const isActive = sortOption.key === sortBy;
          return (
            <Pressable
              key={`sort-${sortOption.key}`}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSortBy(sortOption.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {text.orders[sortOption.textKey]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {analyticsLoading ? <Text style={styles.docEmpty}>{text.orders.loading}</Text> : null}
      {analyticsError ? <Text style={styles.docEmpty}>{analyticsError}</Text> : null}

      {analytics ? (
        <>
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
              <Text style={styles.kpiValue}>{analytics.current.totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{text.orders.kpiDeltaVsPrevious}</Text>
              <Text style={styles.kpiValue}>{analytics.delta.itemsRate ?? 0}%</Text>
            </View>
          </View>

          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>{text.orders.monthCompareTitle}</Text>
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
            <Text style={styles.comparisonDelta}>
              {text.orders.deltaLabel}: {analytics.delta.items >= 0 ? '+' : ''}
              {analytics.delta.items}
            </Text>
          </View>

          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>{text.orders.insightsTitle}</Text>
            <Text style={styles.insightLine}>
              {text.orders.topProductLabel}:{' '}
              {analytics.topProducts[0]
                ? analytics.topProducts[0].nameFr || analytics.topProducts[0].nameZh
                : text.orders.historyEmpty}
            </Text>
            <Text style={styles.insightLine}>
              {text.orders.busiestDayLabel}:{' '}
              {analytics.busiestDay
                ? `${analytics.busiestDay.date} (${analytics.busiestDay.totalItems})`
                : 'N/A'}
            </Text>
            <Text style={styles.insightLine}>
              {text.orders.avgOrderItemsLabel}: {analytics.current.avgOrderItems}
            </Text>
          </View>
        </>
      ) : null}

      <View style={styles.listBlock}>
        {ordersByDate.map(([date, dateOrders]) => {
          const isOpen = expandedDates[date] ?? false;
          const totalItems = dateOrders.reduce((sum, order) => sum + order.totalItems, 0);

          return (
            <View key={`date-${date}`} style={styles.dateGroup}>
              <Pressable
                style={styles.dateHeaderButton}
                onPress={() =>
                  setExpandedDates((current) => ({
                    ...current,
                    [date]: !isOpen,
                  }))
                }
              >
                <Text style={styles.dateTitle}>{date}</Text>
                <Text style={styles.dateSummary}>
                  {dateOrders.length} / {totalItems}
                </Text>
              </Pressable>

              {isOpen
                ? dateOrders.map((order) => (
                    <View key={order.id} style={styles.docItem}>
                      <Text style={styles.docItemTitle}>{order.number}</Text>
                      <Text style={styles.docItemMeta}>
                        {text.orders.deliveryAddressLabel}: {order.deliveryAddress}
                      </Text>
                      <Text style={styles.docItemMeta}>
                        {text.orders.summaryItems}: {order.totalItems}
                      </Text>
                      <Text style={styles.docItemMeta}>
                        {text.orders.summaryAmount}: {order.totalAmount.toFixed(2)}
                      </Text>
                      <View style={styles.actionsRow}>
                        <Pressable
                          style={[styles.secondaryButton, styles.actionButtonHalf]}
                          onPress={() => onDownloadOrderBon(order)}
                        >
                          <Text style={styles.secondaryButtonText}>{text.orders.downloadBonButton}</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.secondaryButton, styles.actionButtonHalf]}
                          onPress={() => onDeleteOrder(order)}
                          disabled={deletingOrderId === order.id}
                        >
                          <Text style={styles.secondaryButtonText}>
                            {deletingOrderId === order.id
                              ? text.orders.deletingHistoryButton
                              : text.orders.deleteHistoryButton}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                : null}
            </View>
          );
        })}
      </View>

      {analytics?.monthlyTrend?.length ? (
        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>{text.orders.trendTitle}</Text>
          {analytics.monthlyTrend.map((entry) => (
            <View key={`trend-${entry.month}`} style={styles.trendRow}>
              <Text style={styles.trendMonth}>{monthLabel(entry.month)}</Text>
              <Text style={styles.trendMeta}>{entry.totalItems}</Text>
              <Text style={styles.trendMeta}>{entry.totalAmount.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
