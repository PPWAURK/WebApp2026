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
exports.OrderHistoryPage = OrderHistoryPage;
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const ordersApi_1 = require("../../services/ordersApi");
const OrderHistoryPage_styles_1 = require("./OrderHistoryPage.styles");
const PERIODS = [
    { key: '7d', textKey: 'period7d' },
    { key: '30d', textKey: 'period30d' },
    { key: 'this_month', textKey: 'periodThisMonth' },
    { key: 'last_month', textKey: 'periodLastMonth' },
    { key: 'all', textKey: 'periodAll' },
];
const SORTS = [
    { key: 'date_desc', textKey: 'sortDateDesc' },
    { key: 'date_asc', textKey: 'sortDateAsc' },
    { key: 'amount_desc', textKey: 'sortAmountDesc' },
    { key: 'items_desc', textKey: 'sortItemsDesc' },
];
function toDateTime(value) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}
function monthLabel(value) {
    return value.slice(0, 7);
}
function OrderHistoryPage({ text, accessToken, orders, isLoading, deletingOrderId, onRefresh, onDownloadOrderBon, onDeleteOrder, }) {
    const [selectedSupplierKey, setSelectedSupplierKey] = (0, react_1.useState)(null);
    const [period, setPeriod] = (0, react_1.useState)('this_month');
    const [sortBy, setSortBy] = (0, react_1.useState)('date_desc');
    const [search, setSearch] = (0, react_1.useState)('');
    const [expandedDates, setExpandedDates] = (0, react_1.useState)({});
    const [analytics, setAnalytics] = (0, react_1.useState)(null);
    const [analyticsLoading, setAnalyticsLoading] = (0, react_1.useState)(false);
    const [analyticsError, setAnalyticsError] = (0, react_1.useState)(null);
    const groupedOrders = (0, react_1.useMemo)(() => {
        const supplierGroups = new Map();
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
        return Array.from(supplierGroups.values()).sort((left, right) => left.supplierName.localeCompare(right.supplierName));
    }, [orders]);
    (0, react_1.useEffect)(() => {
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
    const selectedSupplierGroup = groupedOrders.find((group) => group.supplierKey === selectedSupplierKey) ?? null;
    (0, react_1.useEffect)(() => {
        if (!selectedSupplierGroup) {
            setAnalytics(null);
            setAnalyticsError(null);
            setAnalyticsLoading(false);
            return;
        }
        let isActive = true;
        setAnalyticsLoading(true);
        setAnalyticsError(null);
        void (0, ordersApi_1.fetchOrderHistoryAnalytics)(accessToken, {
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
            setAnalyticsError(error instanceof Error && error.message.trim()
                ? error.message
                : text.orders.analyticsLoadError);
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
    const filteredSortedOrders = (0, react_1.useMemo)(() => {
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
    const ordersByDate = (0, react_1.useMemo)(() => {
        const map = new Map();
        for (const order of filteredSortedOrders) {
            const key = order.deliveryDate || 'N/A';
            const list = map.get(key) ?? [];
            list.push(order);
            map.set(key, list);
        }
        return Array.from(map.entries()).sort((left, right) => toDateTime(right[0]) - toDateTime(left[0]));
    }, [filteredSortedOrders]);
    (0, react_1.useEffect)(() => {
        if (ordersByDate.length === 0) {
            setExpandedDates({});
            return;
        }
        setExpandedDates((current) => {
            const next = {};
            for (const [date] of ordersByDate) {
                next[date] = current[date] ?? date === ordersByDate[0][0];
            }
            return next;
        });
    }, [ordersByDate]);
    const comparisonMax = Math.max(analytics?.current.totalItems ?? 0, analytics?.previous.totalItems ?? 0, 1);
    const pieTotal = (analytics?.current.totalItems ?? 0) + (analytics?.previous.totalItems ?? 0);
    const pieRatio = pieTotal > 0 ? (analytics?.current.totalItems ?? 0) / pieTotal : 0.5;
    const pieRadius = 20;
    const pieCircumference = 2 * Math.PI * pieRadius;
    const pieCurrentDash = pieCircumference * pieRatio;
    return (<react_native_1.View style={OrderHistoryPage_styles_1.styles.card}>
      <react_native_1.View style={OrderHistoryPage_styles_1.styles.headerRow}>
        <react_native_1.View style={OrderHistoryPage_styles_1.styles.headerTextWrap}>
          <react_native_1.Text style={OrderHistoryPage_styles_1.styles.title}>{text.orders.historyTitle}</react_native_1.Text>
          <react_native_1.Text style={OrderHistoryPage_styles_1.styles.subtitle}>{text.orders.historySubtitle}</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.Pressable style={OrderHistoryPage_styles_1.styles.refreshButton} onPress={onRefresh}>
          <react_native_1.Text style={OrderHistoryPage_styles_1.styles.refreshButtonText}>{text.orders.refreshHistoryButton}</react_native_1.Text>
        </react_native_1.Pressable>
      </react_native_1.View>

      {isLoading ? <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docEmpty}>{text.orders.loading}</react_native_1.Text> : null}
      {!isLoading && orders.length === 0 ? <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docEmpty}>{text.orders.historyEmpty}</react_native_1.Text> : null}

      {groupedOrders.length > 0 ? (<react_native_1.View style={OrderHistoryPage_styles_1.styles.filterSection}>
          <react_native_1.Text style={OrderHistoryPage_styles_1.styles.filterSectionTitle}>{text.orders.supplierTabsTitle}</react_native_1.Text>
          <react_native_1.View style={OrderHistoryPage_styles_1.styles.tabsRail}>
          <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} style={OrderHistoryPage_styles_1.styles.tabsScroll} contentContainerStyle={OrderHistoryPage_styles_1.styles.tabsWrap}>
            {groupedOrders.map((supplierGroup) => {
                const isActive = supplierGroup.supplierKey === selectedSupplierKey;
                return (<react_native_1.Pressable key={`tab-${supplierGroup.supplierKey}`} style={[OrderHistoryPage_styles_1.styles.tabChip, isActive && OrderHistoryPage_styles_1.styles.tabChipActive]} onPress={() => setSelectedSupplierKey(supplierGroup.supplierKey)}>
                  <react_native_1.Text style={[OrderHistoryPage_styles_1.styles.tabChipText, isActive && OrderHistoryPage_styles_1.styles.tabChipTextActive]} numberOfLines={1}>
                    {supplierGroup.supplierName}
                  </react_native_1.Text>
                </react_native_1.Pressable>);
            })}
          </react_native_1.ScrollView>
          </react_native_1.View>
        </react_native_1.View>) : null}

      <react_native_1.View style={OrderHistoryPage_styles_1.styles.filterSection}>
        <react_native_1.Text style={OrderHistoryPage_styles_1.styles.filterSectionTitle}>{text.orders.periodTabsTitle}</react_native_1.Text>
        <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={OrderHistoryPage_styles_1.styles.filtersRow}>
          {PERIODS.map((periodOption) => {
            const isActive = periodOption.key === period;
            return (<react_native_1.Pressable key={`period-${periodOption.key}`} style={[OrderHistoryPage_styles_1.styles.filterChip, isActive && OrderHistoryPage_styles_1.styles.filterChipActive]} onPress={() => setPeriod(periodOption.key)}>
                <react_native_1.Text style={[OrderHistoryPage_styles_1.styles.filterChipText, isActive && OrderHistoryPage_styles_1.styles.filterChipTextActive]}>
                  {text.orders[periodOption.textKey]}
                </react_native_1.Text>
              </react_native_1.Pressable>);
        })}
        </react_native_1.ScrollView>
      </react_native_1.View>

      <react_native_1.TextInput style={OrderHistoryPage_styles_1.styles.searchInput} placeholder={text.orders.searchHistoryPlaceholder} placeholderTextColor="#aa777b" value={search} onChangeText={setSearch}/>

      <react_native_1.View style={OrderHistoryPage_styles_1.styles.filterSection}>
        <react_native_1.Text style={OrderHistoryPage_styles_1.styles.filterSectionTitle}>{text.orders.sortTabsTitle}</react_native_1.Text>
        <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={OrderHistoryPage_styles_1.styles.filtersRow}>
          {SORTS.map((sortOption) => {
            const isActive = sortOption.key === sortBy;
            return (<react_native_1.Pressable key={`sort-${sortOption.key}`} style={[OrderHistoryPage_styles_1.styles.filterChip, isActive && OrderHistoryPage_styles_1.styles.filterChipActive]} onPress={() => setSortBy(sortOption.key)}>
                <react_native_1.Text style={[OrderHistoryPage_styles_1.styles.filterChipText, isActive && OrderHistoryPage_styles_1.styles.filterChipTextActive]}>
                  {text.orders[sortOption.textKey]}
                </react_native_1.Text>
              </react_native_1.Pressable>);
        })}
        </react_native_1.ScrollView>
      </react_native_1.View>

      {analyticsLoading ? <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docEmpty}>{text.orders.loading}</react_native_1.Text> : null}
      {analyticsError ? <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docEmpty}>{analyticsError}</react_native_1.Text> : null}

      {analytics ? (<>
          <react_native_1.View style={OrderHistoryPage_styles_1.styles.kpiGrid}>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.kpiCard}>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiLabel}>{text.orders.kpiUniqueProducts}</react_native_1.Text>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiValue}>{analytics.current.uniqueProducts}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.kpiCard}>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiLabel}>{text.orders.kpiTotalItems}</react_native_1.Text>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiValue}>{analytics.current.totalItems}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.kpiCard}>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiLabel}>{text.orders.kpiTotalAmount}</react_native_1.Text>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiValue}>{analytics.current.totalAmount.toFixed(2)}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.kpiCard}>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiLabel}>{text.orders.kpiDeltaVsPrevious}</react_native_1.Text>
              <react_native_1.View style={OrderHistoryPage_styles_1.styles.deltaPieRow}>
                <react_native_svg_1.default width={52} height={52} viewBox="0 0 52 52">
                  <react_native_svg_1.Circle cx="26" cy="26" r={pieRadius} stroke="#d8a4a7" strokeWidth="10" fill="none"/>
                  <react_native_svg_1.Circle cx="26" cy="26" r={pieRadius} stroke="#c83d45" strokeWidth="10" fill="none" strokeDasharray={`${pieCurrentDash} ${pieCircumference}`} strokeLinecap="round" transform="rotate(-90 26 26)"/>
                </react_native_svg_1.default>
                <react_native_1.View style={OrderHistoryPage_styles_1.styles.deltaPieLegend}>
                  <react_native_1.Text style={OrderHistoryPage_styles_1.styles.deltaLegendCurrent}>{text.orders.thisMonthLabel}</react_native_1.Text>
                  <react_native_1.Text style={OrderHistoryPage_styles_1.styles.deltaLegendPrevious}>{text.orders.lastMonthLabel}</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.kpiValue}>{analytics.delta.itemsRate ?? 0}%</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          <react_native_1.View style={OrderHistoryPage_styles_1.styles.comparisonCard}>
            <react_native_1.Text style={OrderHistoryPage_styles_1.styles.comparisonTitle}>{text.orders.monthCompareTitle}</react_native_1.Text>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.comparisonRow}>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.comparisonLabel}>{text.orders.thisMonthLabel}</react_native_1.Text>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.comparisonValue}>{analytics.current.totalItems}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.comparisonTrack}>
              <react_native_1.View style={[
                OrderHistoryPage_styles_1.styles.comparisonBarCurrent,
                { width: `${(analytics.current.totalItems / comparisonMax) * 100}%` },
            ]}/>
            </react_native_1.View>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.comparisonRow}>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.comparisonLabel}>{text.orders.lastMonthLabel}</react_native_1.Text>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.comparisonValue}>{analytics.previous.totalItems}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={OrderHistoryPage_styles_1.styles.comparisonTrack}>
              <react_native_1.View style={[
                OrderHistoryPage_styles_1.styles.comparisonBarPrevious,
                { width: `${(analytics.previous.totalItems / comparisonMax) * 100}%` },
            ]}/>
            </react_native_1.View>
            <react_native_1.Text style={OrderHistoryPage_styles_1.styles.comparisonDelta}>
              {text.orders.deltaLabel}: {analytics.delta.items >= 0 ? '+' : ''}
              {analytics.delta.items}
            </react_native_1.Text>
          </react_native_1.View>

          <react_native_1.View style={OrderHistoryPage_styles_1.styles.insightsCard}>
            <react_native_1.Text style={OrderHistoryPage_styles_1.styles.insightsTitle}>{text.orders.insightsTitle}</react_native_1.Text>
            <react_native_1.Text style={OrderHistoryPage_styles_1.styles.insightLine}>
              {text.orders.topProductLabel}:{' '}
              {analytics.topProducts[0]
                ? analytics.topProducts[0].nameFr || analytics.topProducts[0].nameZh
                : text.orders.historyEmpty}
            </react_native_1.Text>
            <react_native_1.Text style={OrderHistoryPage_styles_1.styles.insightLine}>
              {text.orders.busiestDayLabel}:{' '}
              {analytics.busiestDay
                ? `${analytics.busiestDay.date} (${analytics.busiestDay.totalItems})`
                : 'N/A'}
            </react_native_1.Text>
            <react_native_1.Text style={OrderHistoryPage_styles_1.styles.insightLine}>
              {text.orders.avgOrderItemsLabel}: {analytics.current.avgOrderItems}
            </react_native_1.Text>
          </react_native_1.View>
        </>) : null}

      <react_native_1.View style={OrderHistoryPage_styles_1.styles.listBlock}>
        {ordersByDate.map(([date, dateOrders]) => {
            const isOpen = expandedDates[date] ?? false;
            const totalItems = dateOrders.reduce((sum, order) => sum + order.totalItems, 0);
            return (<react_native_1.View key={`date-${date}`} style={OrderHistoryPage_styles_1.styles.dateGroup}>
              <react_native_1.Pressable style={OrderHistoryPage_styles_1.styles.dateHeaderButton} onPress={() => setExpandedDates((current) => ({
                    ...current,
                    [date]: !isOpen,
                }))}>
                <react_native_1.Text style={OrderHistoryPage_styles_1.styles.dateTitle}>{date}</react_native_1.Text>
                <react_native_1.Text style={OrderHistoryPage_styles_1.styles.dateSummary}>
                  {dateOrders.length} / {totalItems}
                </react_native_1.Text>
              </react_native_1.Pressable>

              {isOpen
                    ? dateOrders.map((order) => (<react_native_1.View key={order.id} style={OrderHistoryPage_styles_1.styles.docItem}>
                      <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docItemTitle}>{order.number}</react_native_1.Text>
                      <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docItemMeta}>
                        {text.orders.deliveryAddressLabel}: {order.deliveryAddress}
                      </react_native_1.Text>
                      <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docItemMeta}>
                        {text.orders.summaryItems}: {order.totalItems}
                      </react_native_1.Text>
                      <react_native_1.Text style={OrderHistoryPage_styles_1.styles.docItemMeta}>
                        {text.orders.summaryAmount}: {order.totalAmount.toFixed(2)}
                      </react_native_1.Text>
                      <react_native_1.View style={OrderHistoryPage_styles_1.styles.actionsRow}>
                        <react_native_1.Pressable style={[OrderHistoryPage_styles_1.styles.secondaryButton, OrderHistoryPage_styles_1.styles.actionButtonHalf]} onPress={() => onDownloadOrderBon(order)}>
                          <react_native_1.Text style={OrderHistoryPage_styles_1.styles.secondaryButtonText}>{text.orders.downloadBonButton}</react_native_1.Text>
                        </react_native_1.Pressable>
                        <react_native_1.Pressable style={[OrderHistoryPage_styles_1.styles.secondaryButton, OrderHistoryPage_styles_1.styles.actionButtonHalf]} onPress={() => onDeleteOrder(order)} disabled={deletingOrderId === order.id}>
                          <react_native_1.Text style={OrderHistoryPage_styles_1.styles.secondaryButtonText}>
                            {deletingOrderId === order.id
                            ? text.orders.deletingHistoryButton
                            : text.orders.deleteHistoryButton}
                          </react_native_1.Text>
                        </react_native_1.Pressable>
                      </react_native_1.View>
                    </react_native_1.View>))
                    : null}
            </react_native_1.View>);
        })}
      </react_native_1.View>

      {analytics?.monthlyTrend?.length ? (<react_native_1.View style={OrderHistoryPage_styles_1.styles.trendCard}>
          <react_native_1.Text style={OrderHistoryPage_styles_1.styles.trendTitle}>{text.orders.trendTitle}</react_native_1.Text>
          {analytics.monthlyTrend.map((entry) => (<react_native_1.View key={`trend-${entry.month}`} style={OrderHistoryPage_styles_1.styles.trendRow}>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.trendMonth}>{monthLabel(entry.month)}</react_native_1.Text>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.trendMeta}>{entry.totalItems}</react_native_1.Text>
              <react_native_1.Text style={OrderHistoryPage_styles_1.styles.trendMeta}>{entry.totalAmount.toFixed(0)}</react_native_1.Text>
            </react_native_1.View>))}
        </react_native_1.View>) : null}
    </react_native_1.View>);
}
//# sourceMappingURL=OrderHistoryPage.js.map