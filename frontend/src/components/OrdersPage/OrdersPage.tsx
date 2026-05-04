import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BREAKPOINT_COMPACT,
  BREAKPOINT_TABLET,
  BREAKPOINT_WIDE,
} from '../../constants/breakpoints';
import type { AppText } from '../../locales/translations';
import type { Language } from '../../types/language';
import type { OrderRecapData } from '../../types/order';
import { OrderFilterPanel } from './OrderFilterPanel';
import { OrderMobileSummaryBar } from './OrderMobileSummaryBar';
import { OrderProductCard } from './OrderProductCard';
import { styles } from './OrdersPage.styles';
import { formatAmount } from './ordersPage.shared';
import { useOrdersPageState } from './useOrdersPageState';

type OrdersPageProps = {
  text: AppText;
  accessToken: string;
  language: Language;
  quantities: Record<string, number>;
  selectedSupplierId: number | 'ALL';
  selectedCategory: string;
  productSearch: string;
  onQuantitiesChange: (next: Record<string, number>) => void;
  onSelectedSupplierIdChange: (next: number | 'ALL') => void;
  onSelectedCategoryChange: (next: string) => void;
  onProductSearchChange: (next: string) => void;
  onSubmitOrder: (recap: OrderRecapData) => void;
};

export function OrdersPage({
  text,
  accessToken,
  language,
  quantities,
  selectedSupplierId,
  selectedCategory,
  productSearch,
  onQuantitiesChange,
  onSelectedSupplierIdChange,
  onSelectedCategoryChange,
  onProductSearchChange,
  onSubmitOrder,
}: OrdersPageProps) {
  const { width } = useWindowDimensions();
  const isMobileLayout = width < BREAKPOINT_TABLET;
  const isSmallScreen = width < BREAKPOINT_COMPACT;
  const isWideLayout = width >= BREAKPOINT_WIDE;
  const useSingleColumnGrid = isMobileLayout || width < 900;
  const shouldMoveSummaryCardToBottom =
    !isMobileLayout && width >= BREAKPOINT_TABLET && width < BREAKPOINT_WIDE;

  const state = useOrdersPageState({
    accessToken,
    quantities,
    selectedSupplierId,
    selectedCategory,
    productSearch,
    text,
    onQuantitiesChange,
    onSelectedSupplierIdChange,
    onSelectedCategoryChange,
    onSubmitOrder,
  });

  const summaryCard = useMemo(
    () => (
      <OrderSummaryCard
        text={text}
        totalAmount={state.summary.totalAmount}
        totalItems={state.summary.totalItems}
        onSubmitOrder={state.submitOrder}
      />
    ),
    [
      state.submitOrder,
      state.summary.totalAmount,
      state.summary.totalItems,
      text,
    ],
  );

  return (
    <View style={styles.pageRoot}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[
          styles.pageContent,
          isMobileLayout && styles.pageContentWithMobileSummary,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.heroCard, isMobileLayout && styles.mobileHeroCard]}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text
                style={[styles.title, isMobileLayout && styles.mobileTitle]}
              >
                {text.orders.title}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  isMobileLayout && styles.mobileSubtitle,
                ]}
              >
                {text.orders.subtitle}
              </Text>
            </View>

            <View style={styles.heroBadge}>
              <Ionicons name="business-outline" size={16} color="#ab1e24" />
              <Text style={styles.heroBadgeText} numberOfLines={1}>
                {state.selectedSupplierName}
              </Text>
            </View>
          </View>

          {isMobileLayout ? null : (
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {state.summary.totalItems}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.orders.summaryItems}
                </Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {formatAmount(state.summary.totalAmount)}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.orders.summaryAmount}
                </Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {state.filteredProducts.length}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.orders.filterLabel}
                </Text>
              </View>
            </View>
          )}
        </View>

        {state.hasLoadError ? (
          <Text style={styles.error}>{text.orders.loadError}</Text>
        ) : null}

        {isMobileLayout ? (
          <MobileOrdersContent
            categories={state.categories}
            filteredProducts={state.filteredProducts}
            language={language}
            loading={state.loading}
            productSearch={productSearch}
            quantities={quantities}
            selectedCategory={selectedCategory}
            selectedSupplierId={selectedSupplierId}
            selectedSupplierName={state.selectedSupplierName}
            selectedSupplierOrderNotice={state.selectedSupplierOrderNotice}
            supplierProductCountById={state.supplierProductCountById}
            supplierProductsLength={state.supplierProducts.length}
            suppliers={state.suppliers}
            text={text}
            onProductSearchChange={onProductSearchChange}
            onSelectedCategoryChange={onSelectedCategoryChange}
            onSelectSupplier={state.handleSelectSupplier}
            onSetQuantity={state.setQuantity}
          />
        ) : (
          <View style={[styles.mainGrid, isWideLayout && styles.mainGridWide]}>
            <View
              style={[
                styles.sidebarColumn,
                isWideLayout && styles.sidebarColumnWide,
              ]}
            >
              <OrderFilterPanel
                categories={state.categories}
                loading={state.loading}
                mode="suppliers"
                productSearch={productSearch}
                selectedCategory={selectedCategory}
                selectedSupplierId={selectedSupplierId}
                selectedSupplierName={state.selectedSupplierName}
                supplierProductCountById={state.supplierProductCountById}
                suppliers={state.suppliers}
                text={text}
                onProductSearchChange={onProductSearchChange}
                onSelectedCategoryChange={onSelectedCategoryChange}
                onSelectSupplier={state.handleSelectSupplier}
              />
              {shouldMoveSummaryCardToBottom ? null : summaryCard}
            </View>

            <View style={styles.contentColumn}>
              <OrderFilterPanel
                categories={state.categories}
                loading={state.loading}
                mode="filters"
                productSearch={productSearch}
                selectedCategory={selectedCategory}
                selectedSupplierId={selectedSupplierId}
                selectedSupplierName={state.selectedSupplierName}
                supplierProductCountById={state.supplierProductCountById}
                suppliers={state.suppliers}
                text={text}
                onProductSearchChange={onProductSearchChange}
                onSelectedCategoryChange={onSelectedCategoryChange}
                onSelectSupplier={state.handleSelectSupplier}
              />

              <ProductListSurface
                filteredProducts={state.filteredProducts}
                isMobileLayout={false}
                isSmallScreen={isSmallScreen}
                language={language}
                loading={state.loading}
                quantities={quantities}
                selectedCategory={selectedCategory}
                selectedSupplierName={state.selectedSupplierName}
                selectedSupplierOrderNotice={state.selectedSupplierOrderNotice}
                supplierProductsLength={state.supplierProducts.length}
                text={text}
                useSingleColumnGrid={useSingleColumnGrid}
                onSetQuantity={state.setQuantity}
              />
            </View>
          </View>
        )}

        {shouldMoveSummaryCardToBottom ? (
          <View style={styles.summaryBottomWrap}>{summaryCard}</View>
        ) : null}
      </ScrollView>

      {isMobileLayout ? (
        <OrderMobileSummaryBar
          text={text}
          totalAmount={state.summary.totalAmount}
          totalItems={state.summary.totalItems}
          onSubmitOrder={state.submitOrder}
        />
      ) : null}
    </View>
  );
}

function MobileOrdersContent({
  categories,
  filteredProducts,
  language,
  loading,
  productSearch,
  quantities,
  selectedCategory,
  selectedSupplierId,
  selectedSupplierName,
  selectedSupplierOrderNotice,
  supplierProductCountById,
  supplierProductsLength,
  suppliers,
  text,
  onProductSearchChange,
  onSelectedCategoryChange,
  onSelectSupplier,
  onSetQuantity,
}: {
  categories: string[];
  filteredProducts: ReturnType<typeof useOrdersPageState>['filteredProducts'];
  language: Language;
  loading: boolean;
  productSearch: string;
  quantities: Record<string, number>;
  selectedCategory: string;
  selectedSupplierId: number | 'ALL';
  selectedSupplierName: string;
  selectedSupplierOrderNotice: string;
  supplierProductCountById: Map<number, number>;
  supplierProductsLength: number;
  suppliers: ReturnType<typeof useOrdersPageState>['suppliers'];
  text: AppText;
  onProductSearchChange: (next: string) => void;
  onSelectedCategoryChange: (next: string) => void;
  onSelectSupplier: (supplierId: number) => void;
  onSetQuantity: (orderItemKey: string, nextQuantity: number) => void;
}) {
  return (
    <View style={styles.mobileContentStack}>
      <OrderFilterPanel
        categories={categories}
        loading={loading}
        mode="mobile"
        productSearch={productSearch}
        selectedCategory={selectedCategory}
        selectedSupplierId={selectedSupplierId}
        selectedSupplierName={selectedSupplierName}
        supplierProductCountById={supplierProductCountById}
        suppliers={suppliers}
        text={text}
        onProductSearchChange={onProductSearchChange}
        onSelectedCategoryChange={onSelectedCategoryChange}
        onSelectSupplier={onSelectSupplier}
      />

      <ProductListSurface
        filteredProducts={filteredProducts}
        isMobileLayout
        isSmallScreen
        language={language}
        loading={loading}
        quantities={quantities}
        selectedCategory={selectedCategory}
        selectedSupplierName={selectedSupplierName}
        selectedSupplierOrderNotice={selectedSupplierOrderNotice}
        supplierProductsLength={supplierProductsLength}
        text={text}
        useSingleColumnGrid
        onSetQuantity={onSetQuantity}
      />
    </View>
  );
}

function ProductListSurface({
  filteredProducts,
  isMobileLayout,
  isSmallScreen,
  language,
  loading,
  quantities,
  selectedCategory,
  selectedSupplierName,
  selectedSupplierOrderNotice,
  supplierProductsLength,
  text,
  useSingleColumnGrid,
  onSetQuantity,
}: {
  filteredProducts: ReturnType<typeof useOrdersPageState>['filteredProducts'];
  isMobileLayout: boolean;
  isSmallScreen: boolean;
  language: Language;
  loading: boolean;
  quantities: Record<string, number>;
  selectedCategory: string;
  selectedSupplierName: string;
  selectedSupplierOrderNotice: string;
  supplierProductsLength: number;
  text: AppText;
  useSingleColumnGrid: boolean;
  onSetQuantity: (orderItemKey: string, nextQuantity: number) => void;
}) {
  return (
    <View
      style={[styles.surfaceCard, isMobileLayout && styles.mobileSurfaceCard]}
    >
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{selectedSupplierName}</Text>
          <Text
            style={styles.surfaceTitle}
            numberOfLines={isMobileLayout ? 1 : undefined}
          >
            {selectedSupplierName}
          </Text>
          {selectedSupplierOrderNotice ? (
            <View
              style={[
                styles.orderNoticeBox,
                isMobileLayout && styles.mobileOrderNoticeBox,
              ]}
            >
              <Text style={styles.orderNoticeLabel}>
                {text.orders.orderNoticeTitle}
              </Text>
              <Text
                style={styles.orderNoticeText}
                numberOfLines={isMobileLayout ? 2 : undefined}
              >
                {selectedSupplierOrderNotice}
              </Text>
            </View>
          ) : null}
          <Text style={styles.surfaceSubtitle}>
            {selectedCategory === 'ALL'
              ? text.orders.allTypes
              : selectedCategory}
          </Text>
        </View>
        <View style={styles.surfaceCountPill}>
          <Text style={styles.surfaceCountText}>{filteredProducts.length}</Text>
        </View>
      </View>

      {!loading && supplierProductsLength === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.docEmpty}>{text.orders.empty}</Text>
        </View>
      ) : null}

      {!loading &&
      supplierProductsLength > 0 &&
      filteredProducts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.docEmpty}>{text.orders.emptyForType}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.docEmpty}>{text.orders.loading}</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.productGrid,
          styles.listBlock,
          isMobileLayout && styles.mobileProductGrid,
        ]}
      >
        {filteredProducts.map((product) => (
          <OrderProductCard
            key={product.id}
            product={product}
            quantities={quantities}
            language={language}
            text={text}
            isMobileLayout={isMobileLayout}
            isSmallScreen={isSmallScreen}
            useSingleColumnGrid={useSingleColumnGrid}
            onSetQuantity={onSetQuantity}
          />
        ))}
      </View>
    </View>
  );
}

function OrderSummaryCard({
  text,
  totalAmount,
  totalItems,
  onSubmitOrder,
}: {
  text: AppText;
  totalAmount: number;
  totalItems: number;
  onSubmitOrder: () => void;
}) {
  const isDisabled = totalItems === 0;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{text.orders.summaryTitle}</Text>
      <View style={styles.summaryMetricRow}>
        <Text style={styles.summaryMetricLabel}>
          {text.orders.summaryItems}
        </Text>
        <Text style={styles.summaryMetricValue}>{totalItems}</Text>
      </View>
      <View style={styles.summaryMetricRow}>
        <Text style={styles.summaryMetricLabel}>
          {text.orders.summaryAmount}
        </Text>
        <Text style={styles.summaryMetricValue}>
          {formatAmount(totalAmount)}
        </Text>
      </View>

      <Pressable
        style={[styles.primaryButton, isDisabled && styles.buttonDisabled]}
        disabled={isDisabled}
        onPress={onSubmitOrder}
        accessibilityRole="button"
        accessibilityLabel={text.orders.submitButton}
        accessibilityState={{ disabled: isDisabled }}
      >
        <Text style={styles.primaryButtonText}>{text.orders.submitButton}</Text>
      </Pressable>
    </View>
  );
}
