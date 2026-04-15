import { useEffect, useMemo, useState } from 'react';
import type { AppText } from '../../locales/translations';
import {
  fetchOrderHistoryAnalytics,
  type OrderHistoryAnalytics,
  type OrderReturnSummary,
  type OrderSummary,
} from '../../services/ordersApi';
import {
  formatAverage,
  getPeriodLabel,
  type PeriodKey,
  type SortKey,
  type SupplierOrderGroup,
  toDateTime,
} from './orderHistory.shared';

type UseOrderHistoryParams = {
  accessToken: string;
  orders: OrderSummary[];
  orderReturns: OrderReturnSummary[];
  selectedRestaurantId: number | null;
  text: AppText;
};

export function useOrderHistory({
  accessToken,
  orders,
  orderReturns,
  selectedRestaurantId,
  text,
}: UseOrderHistoryParams) {
  const [selectedSupplierKey, setSelectedSupplierKey] = useState<string | null>(
    null,
  );
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  const [search, setSearch] = useState('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    {},
  );
  const [analytics, setAnalytics] = useState<OrderHistoryAnalytics | null>(
    null,
  );
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const groupedOrders = useMemo<SupplierOrderGroup[]>(() => {
    const supplierGroups = new Map<string, SupplierOrderGroup>();

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
      if (
        current &&
        groupedOrders.some((group) => group.supplierKey === current)
      ) {
        return current;
      }

      return groupedOrders[0].supplierKey;
    });
  }, [groupedOrders]);

  const selectedSupplierGroup =
    groupedOrders.find((group) => group.supplierKey === selectedSupplierKey) ??
    null;

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
      restaurantId: selectedRestaurantId ?? undefined,
      period,
    })
      .then((result) => {
        if (isActive) {
          setAnalytics(result);
        }
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
  }, [
    accessToken,
    period,
    selectedRestaurantId,
    selectedSupplierGroup,
    text.orders.analyticsLoadError,
  ]);

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

    return Array.from(map.entries()).sort(
      (left, right) => toDateTime(right[0]) - toDateTime(left[0]),
    );
  }, [filteredSortedOrders]);

  const returnsByOrderId = useMemo(() => {
    const map = new Map<number, OrderReturnSummary[]>();

    for (const orderReturn of orderReturns) {
      const existing = map.get(orderReturn.orderId) ?? [];
      existing.push(orderReturn);
      map.set(orderReturn.orderId, existing);
    }

    return map;
  }, [orderReturns]);

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
    () =>
      filteredSortedOrders.reduce((sum, order) => sum + order.totalItems, 0),
    [filteredSortedOrders],
  );

  const filteredTotalAmount = useMemo(
    () =>
      filteredSortedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [filteredSortedOrders],
  );

  const averageOrderItems =
    analytics?.current.avgOrderItems ??
    (filteredSortedOrders.length > 0
      ? filteredTotalItems / filteredSortedOrders.length
      : 0);

  const activePeriodLabel = getPeriodLabel(text, period);
  const averageOrderItemsLabel = formatAverage(averageOrderItems);

  function toggleDate(date: string) {
    setExpandedDates((current) => ({
      ...current,
      [date]: !current[date],
    }));
  }

  return {
    groupedOrders,
    selectedSupplierKey,
    selectedSupplierGroup,
    period,
    sortBy,
    search,
    expandedDates,
    analytics,
    analyticsLoading,
    analyticsError,
    filteredSortedOrders,
    ordersByDate,
    returnsByOrderId,
    comparisonMax,
    filteredTotalItems,
    filteredTotalAmount,
    averageOrderItemsLabel,
    activePeriodLabel,
    setSelectedSupplierKey,
    setPeriod,
    setSortBy,
    setSearch,
    toggleDate,
  };
}
