import { Pressable, ScrollView, Text, View } from 'react-native';
import type { AppText } from '../../../locales/translations';
import type { TopOrderedProduct } from '../../../services/ordersApi';
import type { SupplierItem } from '../../../services/suppliersApi';
import { styles } from '../../../components/SessionCard/SessionCard.styles';

type DashboardTopProductsChartProps = {
  chartMonths: string[];
  chartSuppliers: SupplierItem[];
  isWideLayout: boolean;
  onSelectMonth: (month: string) => void;
  onSelectSupplier: (supplierId: number) => void;
  selectedChartMonth: string | null;
  selectedChartSupplierId: number | null;
  text: AppText;
  topProducts: TopOrderedProduct[];
  topProductsError: string | null;
  topProductsLoading: boolean;
};

export function DashboardTopProductsChart({
  chartMonths,
  chartSuppliers,
  isWideLayout,
  onSelectMonth,
  onSelectSupplier,
  selectedChartMonth,
  selectedChartSupplierId,
  text,
  topProducts,
  topProductsError,
  topProductsLoading,
}: DashboardTopProductsChartProps) {
  const totalQuantity = topProducts.reduce(
    (sum, product) => sum + product.totalQuantity,
    0,
  );
  const totalOrders = topProducts.reduce(
    (sum, product) => sum + product.orderCount,
    0,
  );
  const leader = topProducts[0] ?? null;
  const maxQuantity = Math.max(
    ...topProducts.map((product) => product.totalQuantity),
    1,
  );

  return (
    <View style={[styles.quickBlock, styles.topProductsPanel]}>
      <View
        style={[
          styles.topProductsHeader,
          isWideLayout && styles.topProductsHeaderWide,
        ]}
      >
        <View style={styles.topProductsHeaderMain}>
          <Text style={styles.quickBlockTitle}>
            {text.dashboard.topProductsTitle}
          </Text>
          <Text style={styles.topProductsSubtitle}>
            {text.dashboard.topProductsSubtitle}
          </Text>
        </View>

        {topProducts.length > 0 ? (
          <View style={styles.topProductsMetricRail}>
            <View style={styles.topProductsMetricCard}>
              <Text style={styles.topProductsMetricValue}>
                {topProducts.length}
              </Text>
              <Text style={styles.topProductsMetricLabel}>
                {text.dashboard.topProductsMetricProducts}
              </Text>
            </View>
            <View style={styles.topProductsMetricCard}>
              <Text style={styles.topProductsMetricValue}>{totalQuantity}</Text>
              <Text style={styles.topProductsMetricLabel}>
                {text.dashboard.topProductsMetricQuantity}
              </Text>
            </View>
            <View style={styles.topProductsMetricCard}>
              <Text style={styles.topProductsMetricValue}>{totalOrders}</Text>
              <Text style={styles.topProductsMetricLabel}>
                {text.dashboard.topProductsMetricOrders}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.topProductsFilterStack}>
        <View style={styles.topProductsFilterBlock}>
          <Text style={styles.topProductsFilterLabel}>
            {text.orders.supplierLabel}
          </Text>

          {chartSuppliers.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartSupplierTabs}
            >
              {chartSuppliers.map((supplier) => {
                const isActive = supplier.id === selectedChartSupplierId;
                return (
                  <Pressable
                    key={`chart-supplier-${supplier.id}`}
                    style={[
                      styles.chartSupplierChip,
                      isActive && styles.chartSupplierChipActive,
                    ]}
                    onPress={() => onSelectSupplier(supplier.id)}
                  >
                    <Text
                      style={[
                        styles.chartSupplierChipText,
                        isActive && styles.chartSupplierChipTextActive,
                      ]}
                    >
                      {supplier.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.subtitle}>{text.dashboard.topProductsEmpty}</Text>
          )}
        </View>

        {chartMonths.length > 0 ? (
          <View style={styles.topProductsFilterBlock}>
            <Text style={styles.topProductsFilterLabel}>
              {text.dashboard.topProductsMonthLabel}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartSupplierTabs}
            >
              {chartMonths.map((month) => {
                const isActive = month === selectedChartMonth;
                return (
                  <Pressable
                    key={`chart-month-${month}`}
                    style={[
                      styles.chartSupplierChip,
                      isActive && styles.chartSupplierChipActive,
                    ]}
                    onPress={() => onSelectMonth(month)}
                  >
                    <Text
                      style={[
                        styles.chartSupplierChipText,
                        isActive && styles.chartSupplierChipTextActive,
                      ]}
                    >
                      {month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {topProductsLoading ? (
        <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
      ) : null}

      {topProductsError ? (
        <Text style={styles.errorText}>{topProductsError}</Text>
      ) : null}

      {!topProductsLoading &&
      !topProductsError &&
      chartSuppliers.length > 0 &&
      topProducts.length === 0 ? (
        <Text style={styles.subtitle}>{text.dashboard.topProductsEmpty}</Text>
      ) : null}

      {topProducts.length > 0 ? (
        <View
          style={[
            styles.topProductsBoard,
            isWideLayout && styles.topProductsBoardWide,
          ]}
        >
          {leader ? (
            <View
              style={[
                styles.topProductsLeadCard,
                isWideLayout && styles.topProductsLeadCardWide,
              ]}
            >
              <Text style={styles.topProductsLeadLabel}>
                {text.dashboard.topProductsLeadLabel}
              </Text>
              <Text style={styles.topProductsLeadName} numberOfLines={2}>
                {leader.nameFr?.trim() ||
                  leader.nameZh?.trim() ||
                  `${leader.productId}`}
              </Text>
              <View style={styles.topProductsLeadStats}>
                <View style={styles.topProductsLeadStat}>
                  <Text style={styles.topProductsLeadStatValue}>
                    {leader.totalQuantity}
                  </Text>
                  <Text style={styles.topProductsLeadStatLabel}>
                    {text.orders.quantityLabel}
                  </Text>
                </View>
                <View style={styles.topProductsLeadStat}>
                  <Text style={styles.topProductsLeadStatValue}>
                    {leader.orderCount}
                  </Text>
                  <Text style={styles.topProductsLeadStatLabel}>
                    {text.dashboard.topProductsOrdersLabel}
                  </Text>
                </View>
              </View>
              {selectedChartMonth ? (
                <View style={styles.topProductsLeadMonthPill}>
                  <Text style={styles.topProductsLeadMonthText}>
                    {selectedChartMonth}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.topProductsList}>
            {topProducts.map((product, index) => {
              const label =
                product.nameFr?.trim() ||
                product.nameZh?.trim() ||
                `${product.productId}`;
              const share =
                totalQuantity > 0 ? product.totalQuantity / totalQuantity : 0;
              const ratio = Math.max(
                0.08,
                Math.min(1, product.totalQuantity / maxQuantity),
              );

              return (
                <View
                  key={`top-product-${product.month}-${product.supplierId}-${product.productId}`}
                  style={styles.topProductsRow}
                >
                  <View style={styles.topProductsRowHeader}>
                    <View style={styles.topProductsRankBadge}>
                      <Text style={styles.topProductsRankBadgeText}>
                        #{index + 1}
                      </Text>
                    </View>

                    <View style={styles.topProductsRowMain}>
                      <Text style={styles.topProductsRowName} numberOfLines={1}>
                        {label}
                      </Text>
                      <View style={styles.topProductsRowMeta}>
                        <Text style={styles.topProductsRowMetaText}>
                          {product.orderCount}{' '}
                          {text.dashboard.topProductsOrdersLabel}
                        </Text>
                        <Text style={styles.topProductsRowMetaText}>
                          {Math.round(share * 100)}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.topProductsRowValueWrap}>
                      <Text style={styles.topProductsRowValue}>
                        {product.totalQuantity}
                      </Text>
                      <Text style={styles.topProductsRowValueLabel}>
                        {text.orders.quantityLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.topProductsRowTrack}>
                    <View
                      style={[
                        styles.topProductsRowBar,
                        { width: `${ratio * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
