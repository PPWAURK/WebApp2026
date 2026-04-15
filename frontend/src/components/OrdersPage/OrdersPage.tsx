import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import {
  fetchProducts,
  type ProductItem,
  type ProductSpecificationItem,
} from '../../services/productsApi';
import { fetchSuppliers, type SupplierItem } from '../../services/suppliersApi';
import { styles } from './OrdersPage.styles';
import type { Language } from '../../types/language';
import type { OrderRecapData } from '../../types/order';
import {
  BREAKPOINT_COMPACT,
  BREAKPOINT_TABLET,
  BREAKPOINT_WIDE,
} from '../../constants/breakpoints';

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

function formatAmount(value: number) {
  return value.toFixed(2);
}

function buildOrderItemKey(productId: number, specificationSlot: number | null) {
  return `${productId}:${specificationSlot ?? 'base'}`;
}

function formatSpecificationLabel(
  text: AppText,
  specification: ProductSpecificationItem,
) {
  return specification.specification ?? text.orders.defaultSpecificationLabel;
}

type ProductCardProps = {
  isSmallScreen: boolean;
  language: Language;
  product: ProductItem;
  quantities: Record<string, number>;
  text: AppText;
  useSingleColumnGrid: boolean;
  onChangeQuantity: (orderItemKey: string, delta: number) => void;
};

const ProductCard = memo(function ProductCard({
  isSmallScreen,
  language,
  product,
  quantities,
  text,
  useSingleColumnGrid,
  onChangeQuantity,
}: ProductCardProps) {
  const productName =
    language === 'zh' ? product.nameZh : (product.nameFr ?? product.nameZh);
  const productGridItemStyle = useSingleColumnGrid
    ? styles.productGridItemSmall
    : styles.productGridItem;

  return (
    <View style={[styles.productCard, productGridItemStyle]}>
      <View style={styles.productCardHeader}>
        <View style={styles.productBadgeRow}>
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>{product.category}</Text>
          </View>
          {product.reference ? (
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>{product.reference}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.productInfoRow,
          isSmallScreen && styles.productInfoRowSmall,
        ]}
      >
        {product.image ? (
          <View
            style={[
              styles.productImageFrame,
              isSmallScreen && styles.productImageFrameSmall,
            ]}
          >
            <Image
              source={{ uri: product.image }}
              style={styles.productImageThumb}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View
            style={[
              styles.productImagePlaceholder,
              isSmallScreen && styles.productImageFrameSmall,
            ]}
          >
            <Ionicons name="image-outline" size={24} color="#ab1e24" />
          </View>
        )}

        <View
          style={[
            styles.productInfoColumn,
            isSmallScreen && styles.productInfoColumnSmall,
          ]}
        >
          <Text style={styles.productTitle}>{productName}</Text>
          <Text style={styles.docItemMeta}>
            {text.orders.specificationCountLabel}: {product.specifications.length}
          </Text>
          {product.requiresSpecificationSelection ? (
            <Text style={styles.docItemMeta}>
              {text.orders.multiSpecificationHint}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.specificationList}>
        {product.specifications.map((specification) => {
          const orderItemKey = buildOrderItemKey(product.id, specification.slot);
          const quantity = quantities[orderItemKey] ?? 0;
          const specificationLabel = formatSpecificationLabel(text, specification);

          return (
            <View
              key={`${product.id}-${specification.slot ?? 'base'}`}
              style={[
                styles.specificationCard,
                quantity > 0 && styles.specificationCardActive,
              ]}
            >
              <View style={styles.specificationCopy}>
                <Text style={styles.specificationValue}>
                  {specificationLabel}
                </Text>
                <Text style={styles.docItemMeta}>
                  {text.orders.unitLabel}:{' '}
                  {specification.unit ?? text.orders.unitNotAvailable}
                </Text>
                <Text style={styles.priceText}>
                  {text.orders.priceLabel}:{' '}
                  {specification.priceHt === null
                    ? text.orders.priceNotAvailable
                    : formatAmount(specification.priceHt)}
                </Text>
              </View>

              <View style={styles.quantityBar}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => onChangeQuantity(orderItemKey, -1)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    language === 'zh'
                      ? `减少${productName}${specificationLabel}数量`
                      : `Réduire la quantité de ${productName} ${specificationLabel}`
                  }
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </Pressable>

                <View style={styles.quantityValuePill}>
                  <Text style={styles.quantityValueLabel}>
                    {text.orders.quantityLabel}
                  </Text>
                  <Text style={styles.quantityValueText}>{quantity}</Text>
                </View>

                <Pressable
                  style={styles.quantityButton}
                  onPress={() => onChangeQuantity(orderItemKey, 1)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    language === 'zh'
                      ? `增加${productName}${specificationLabel}数量`
                      : `Augmenter la quantité de ${productName} ${specificationLabel}`
                  }
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

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
  const isSmallScreen = width < BREAKPOINT_COMPACT;
  const isWideLayout = width >= BREAKPOINT_WIDE;
  const useSingleColumnGrid = width < 900;
  const shouldMoveSummaryCardToBottom = width >= BREAKPOINT_TABLET && width < BREAKPOINT_WIDE;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setHasLoadError(false);

    void Promise.all([fetchProducts(accessToken), fetchSuppliers(accessToken)])
      .then(([productResult, supplierResult]) => {
        if (!isActive) {
          return;
        }

        setProducts(productResult);
        setSuppliers(supplierResult);
      })
      .catch(() => {
        if (isActive) {
          setProducts([]);
          setSuppliers([]);
          setHasLoadError(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (suppliers.length === 0) {
      if (selectedSupplierId !== 'ALL') {
        onSelectedSupplierIdChange('ALL');
      }
      if (selectedCategory !== 'ALL') {
        onSelectedCategoryChange('ALL');
      }
      return;
    }

    const hasStoredSupplier =
      selectedSupplierId !== 'ALL' &&
      suppliers.some((supplier) => supplier.id === selectedSupplierId);

    if (hasStoredSupplier) {
      return;
    }

    const supplierWithSelectedItems = products.find(
      (product) =>
        product.specifications.some(
          (specification) =>
            (quantities[
              buildOrderItemKey(product.id, specification.slot)
            ] ?? 0) > 0,
        ),
    )?.supplierId;

    onSelectedSupplierIdChange(supplierWithSelectedItems ?? suppliers[0].id);
  }, [
    onSelectedCategoryChange,
    onSelectedSupplierIdChange,
    products,
    quantities,
    selectedCategory,
    selectedSupplierId,
    suppliers,
  ]);

  const changeQuantity = useCallback(
    (orderItemKey: string, delta: number) => {
      const next = (quantities[orderItemKey] ?? 0) + delta;
      const clamped = Math.max(0, next);
      onQuantitiesChange({
        ...quantities,
        [orderItemKey]: clamped,
      });
    },
    [onQuantitiesChange, quantities],
  );

  const handleSelectSupplier = useCallback(
    (supplierId: number) => {
      onSelectedSupplierIdChange(supplierId);
      onSelectedCategoryChange('ALL');
    },
    [onSelectedCategoryChange, onSelectedSupplierIdChange],
  );

  const supplierProducts = useMemo(() => {
    if (selectedSupplierId === 'ALL') {
      return products;
    }

    return products.filter(
      (product) => product.supplierId === selectedSupplierId,
    );
  }, [products, selectedSupplierId]);

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      return;
    }

    if (
      !supplierProducts.some((product) => product.category === selectedCategory)
    ) {
      onSelectedCategoryChange('ALL');
    }
  }, [onSelectedCategoryChange, selectedCategory, supplierProducts]);

  const summary = useMemo(() => {
    return supplierProducts.reduce((accumulator, product) => {
      for (const specification of product.specifications) {
        const quantity =
          quantities[buildOrderItemKey(product.id, specification.slot)] ?? 0;

        accumulator.totalItems += quantity;
        accumulator.totalAmount += quantity * (specification.priceHt ?? 0);
      }

      return accumulator;
    }, { totalItems: 0, totalAmount: 0 });
  }, [quantities, supplierProducts]);

  const selectedItems = useMemo(() => {
    return supplierProducts.flatMap((product) =>
      product.specifications
        .map((specification) => {
          const orderItemKey = buildOrderItemKey(product.id, specification.slot);
          const quantity = quantities[orderItemKey] ?? 0;

          if (quantity <= 0) {
            return null;
          }

          const price = specification.priceHt ?? 0;
          return {
            orderItemKey,
            productId: product.id,
            specificationSlot: specification.slot,
            supplierId: product.supplierId,
            category: product.category,
            nameZh: product.nameZh,
            nameFr: product.nameFr,
            specification: specification.specification,
            unit: specification.unit,
            priceHt: specification.priceHt,
            image: product.image,
            quantity,
            lineTotal: quantity * price,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    );
  }, [quantities, supplierProducts]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        supplierProducts
          .map((product) => product.category)
          .filter((value) => typeof value === 'string' && value.trim()),
      ),
    );

    return unique.sort((left, right) => left.localeCompare(right));
  }, [supplierProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = productSearch.trim().toLowerCase();

    return supplierProducts.filter((product) => {
      const matchCategory =
        selectedCategory === 'ALL' || product.category === selectedCategory;

      if (!matchCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const nameFr = (product.nameFr ?? '').toLowerCase();
      const nameZh = (product.nameZh ?? '').toLowerCase();
      const reference = (product.reference ?? '').toLowerCase();
      const specifications = product.specifications.map((item) =>
        (item.specification ?? '').toLowerCase(),
      );

      return (
        nameFr.includes(normalizedQuery) ||
        nameZh.includes(normalizedQuery) ||
        reference.includes(normalizedQuery) ||
        specifications.some((specification) =>
          specification.includes(normalizedQuery),
        )
      );
    });
  }, [productSearch, selectedCategory, supplierProducts]);

  const selectedSupplierName = useMemo(() => {
    if (selectedSupplierId === 'ALL') {
      return text.orders.supplierLabel;
    }

    return (
      suppliers.find((supplier) => supplier.id === selectedSupplierId)?.name ??
      text.orders.supplierLabel
    );
  }, [selectedSupplierId, suppliers, text.orders.supplierLabel]);

  const handleSubmitOrder = useCallback(() => {
    onSubmitOrder({
      items: selectedItems,
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount,
    });
  }, [onSubmitOrder, selectedItems, summary.totalAmount, summary.totalItems]);

  const summaryCard = (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{text.orders.summaryTitle}</Text>
      <View style={styles.summaryMetricRow}>
        <Text style={styles.summaryMetricLabel}>{text.orders.summaryItems}</Text>
        <Text style={styles.summaryMetricValue}>{summary.totalItems}</Text>
      </View>
      <View style={styles.summaryMetricRow}>
        <Text style={styles.summaryMetricLabel}>{text.orders.summaryAmount}</Text>
        <Text style={styles.summaryMetricValue}>
          {formatAmount(summary.totalAmount)}
        </Text>
      </View>

      <Pressable
        style={[
          styles.primaryButton,
          summary.totalItems === 0 && styles.buttonDisabled,
        ]}
        disabled={summary.totalItems === 0}
        onPress={handleSubmitOrder}
        accessibilityRole="button"
        accessibilityLabel={text.orders.submitButton}
        accessibilityState={{ disabled: summary.totalItems === 0 }}
      >
        <Text style={styles.primaryButtonText}>{text.orders.submitButton}</Text>
      </Pressable>
    </View>
  );

  const supplierProductCountById = useMemo(() => {
    const next = new Map<number, number>();

    for (const product of products) {
      next.set(product.supplierId, (next.get(product.supplierId) ?? 0) + 1);
    }

    return next;
  }, [products]);

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
              <Text style={styles.title}>{text.orders.title}</Text>
              <Text style={styles.subtitle}>{text.orders.subtitle}</Text>
            </View>

            <View style={styles.heroBadge}>
              <Ionicons name="business-outline" size={16} color="#ab1e24" />
              <Text style={styles.heroBadgeText} numberOfLines={1}>
                {selectedSupplierName}
              </Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{summary.totalItems}</Text>
              <Text style={styles.heroStatLabel}>
                {text.orders.summaryItems}
              </Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>
                {formatAmount(summary.totalAmount)}
              </Text>
              <Text style={styles.heroStatLabel}>
                {text.orders.summaryAmount}
              </Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>
                {filteredProducts.length}
              </Text>
              <Text style={styles.heroStatLabel}>
                {text.orders.filterLabel}
              </Text>
            </View>
          </View>
        </View>

        {hasLoadError ? (
          <Text style={styles.error}>{text.orders.loadError}</Text>
        ) : null}

        <View style={[styles.mainGrid, isWideLayout && styles.mainGridWide]}>
          <View
            style={[
              styles.sidebarColumn,
              isWideLayout && styles.sidebarColumnWide,
            ]}
          >
            <View style={styles.surfaceCard}>
              <View style={styles.surfaceHeader}>
                <View style={styles.surfaceHeaderCopy}>
                  <Text style={styles.surfaceEyebrow}>
                    {text.orders.supplierLabel}
                  </Text>
                  <Text style={styles.surfaceTitle}>
                    {selectedSupplierName}
                  </Text>
                  <Text style={styles.surfaceSubtitle}>
                    {suppliers.length > 0
                      ? `${suppliers.length} ${text.orders.supplierLabel.toLowerCase()}`
                      : text.orders.empty}
                  </Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.docEmpty}>{text.orders.loading}</Text>
                </View>
              ) : suppliers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.docEmpty}>{text.orders.empty}</Text>
                </View>
              ) : (
                <View style={styles.supplierList}>
                  {suppliers.map((supplier) => {
                    const isActive = selectedSupplierId === supplier.id;

                    return (
                      <Pressable
                        key={supplier.id}
                        style={[
                          styles.supplierCard,
                          isActive && styles.supplierCardActive,
                        ]}
                        onPress={() => handleSelectSupplier(supplier.id)}
                        accessibilityRole="button"
                        accessibilityLabel={supplier.name}
                        accessibilityState={{ selected: isActive }}
                      >
                        <View style={styles.supplierCardTitleRow}>
                          <Text
                            style={[
                              styles.supplierCardTitle,
                              isActive && styles.supplierCardTitleActive,
                            ]}
                            numberOfLines={1}
                          >
                            {supplier.name}
                          </Text>
                          <Text
                            style={[
                              styles.supplierCardCount,
                              isActive && styles.supplierCardCountActive,
                            ]}
                          >
                            {supplierProductCountById.get(supplier.id) ?? 0}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
            {shouldMoveSummaryCardToBottom ? null : summaryCard}
          </View>

          <View style={styles.contentColumn}>
            <View style={styles.surfaceCard}>
              <View style={styles.surfaceHeader}>
                <View style={styles.surfaceHeaderCopy}>
                  <Text style={styles.surfaceEyebrow}>
                    {text.orders.filterLabel}
                  </Text>
                  <Text style={styles.surfaceTitle}>
                    {text.orders.filterLabel}
                  </Text>
                  <Text style={styles.surfaceSubtitle}>
                    {text.orders.searchProductsPlaceholder}
                  </Text>
                </View>
              </View>

              <View style={styles.searchWrap}>
                <View style={styles.searchShell}>
                  <Ionicons name="search-outline" size={18} color="#8d5a5f" />
                  <TextInput
                    style={styles.searchInput}
                    value={productSearch}
                    onChangeText={onProductSearchChange}
                    placeholder={text.orders.searchProductsPlaceholder}
                    placeholderTextColor="#aa777b"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.categoryWrap}>
                <Pressable
                  style={[
                    styles.categoryChip,
                    selectedCategory === 'ALL' && styles.categoryChipActive,
                  ]}
                  onPress={() => onSelectedCategoryChange('ALL')}
                  accessibilityRole="button"
                  accessibilityLabel={text.orders.allTypes}
                  accessibilityState={{ selected: selectedCategory === 'ALL' }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === 'ALL' &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {text.orders.allTypes}
                  </Text>
                </Pressable>

                {categories.map((category) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category &&
                        styles.categoryChipActive,
                    ]}
                    onPress={() => onSelectedCategoryChange(category)}
                    accessibilityRole="button"
                    accessibilityLabel={category}
                    accessibilityState={{
                      selected: selectedCategory === category,
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.surfaceHeader}>
                <View style={styles.surfaceHeaderCopy}>
                  <Text style={styles.surfaceEyebrow}>
                    {selectedSupplierName}
                  </Text>
                  <Text style={styles.surfaceTitle}>
                    {selectedSupplierName}
                  </Text>
                  <Text style={styles.surfaceSubtitle}>
                    {selectedCategory === 'ALL'
                      ? text.orders.allTypes
                      : selectedCategory}
                  </Text>
                </View>
                <View style={styles.surfaceCountPill}>
                  <Text style={styles.surfaceCountText}>
                    {filteredProducts.length}
                  </Text>
                </View>
              </View>

              {!loading && supplierProducts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.docEmpty}>{text.orders.empty}</Text>
                </View>
              ) : null}

              {!loading &&
              supplierProducts.length > 0 &&
              filteredProducts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.docEmpty}>
                    {text.orders.emptyForType}
                  </Text>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.docEmpty}>{text.orders.loading}</Text>
                </View>
              ) : null}

              <View style={[styles.productGrid, styles.listBlock]}>
                {filteredProducts.map((product) => {
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantities={quantities}
                      language={language}
                      text={text}
                      isSmallScreen={isSmallScreen}
                      useSingleColumnGrid={useSingleColumnGrid}
                      onChangeQuantity={changeQuantity}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>
        {shouldMoveSummaryCardToBottom ? (
          <View style={styles.summaryBottomWrap}>{summaryCard}</View>
        ) : null}
      </ScrollView>
    </View>
  );
}
