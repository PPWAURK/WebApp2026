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
import { fetchProducts, type ProductItem } from '../../services/productsApi';
import { fetchSuppliers, type SupplierItem } from '../../services/suppliersApi';
import { styles } from './OrdersPage.styles';
import type { Language } from '../../types/language';
import type { OrderRecapData } from '../../types/order';

type OrdersPageProps = {
  text: AppText;
  accessToken: string;
  language: Language;
  quantities: Record<number, number>;
  selectedSupplierId: number | 'ALL';
  selectedCategory: string;
  productSearch: string;
  onQuantitiesChange: (next: Record<number, number>) => void;
  onSelectedSupplierIdChange: (next: number | 'ALL') => void;
  onSelectedCategoryChange: (next: string) => void;
  onProductSearchChange: (next: string) => void;
  onSubmitOrder: (recap: OrderRecapData) => void;
};

function formatAmount(value: number) {
  return value.toFixed(2);
}

type ProductCardProps = {
  isSmallScreen: boolean;
  language: Language;
  product: ProductItem;
  quantity: number;
  text: AppText;
  useSingleColumnGrid: boolean;
  onChangeQuantity: (productId: number, delta: number) => void;
};

const ProductCard = memo(function ProductCard({
  isSmallScreen,
  language,
  product,
  quantity,
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
          {product.specification ? (
            <Text style={styles.docItemMeta}>
              {text.orders.specificationLabel}: {product.specification}
            </Text>
          ) : null}
          {product.unit ? (
            <Text style={styles.docItemMeta}>
              {text.orders.unitLabel}: {product.unit}
            </Text>
          ) : null}
          <Text style={styles.priceText}>
            {text.orders.priceLabel}:{' '}
            {product.priceHt === null
              ? text.orders.priceNotAvailable
              : formatAmount(product.priceHt)}
          </Text>
        </View>
      </View>

      <View style={styles.quantityBar}>
        <Pressable
          style={styles.quantityButton}
          onPress={() => onChangeQuantity(product.id, -1)}
          accessibilityRole="button"
          accessibilityLabel={
            language === 'zh'
              ? `减少${productName}数量`
              : `Réduire la quantité de ${productName}`
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
          onPress={() => onChangeQuantity(product.id, 1)}
          accessibilityRole="button"
          accessibilityLabel={
            language === 'zh'
              ? `增加${productName}数量`
              : `Augmenter la quantité de ${productName}`
          }
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
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
  const isSmallScreen = width < 560;
  const isWideLayout = width >= 1180;
  const useSingleColumnGrid = width < 900;
  const shouldMoveSummaryCardToBottom = width >= 768 && width < 1180;

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
      (product) => (quantities[product.id] ?? 0) > 0,
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
    (productId: number, delta: number) => {
      const next = (quantities[productId] ?? 0) + delta;
      const clamped = Math.max(0, next);
      onQuantitiesChange({
        ...quantities,
        [productId]: clamped,
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
    return supplierProducts.reduce(
      (accumulator, product) => {
        const qty = quantities[product.id] ?? 0;
        accumulator.totalItems += qty;
        accumulator.totalAmount += qty * (product.priceHt ?? 0);
        return accumulator;
      },
      { totalItems: 0, totalAmount: 0 },
    );
  }, [quantities, supplierProducts]);

  const selectedItems = useMemo(() => {
    return supplierProducts
      .map((product) => {
        const quantity = quantities[product.id] ?? 0;
        if (quantity <= 0) {
          return null;
        }

        const price = product.priceHt ?? 0;
        return {
          productId: product.id,
          supplierId: product.supplierId,
          category: product.category,
          nameZh: product.nameZh,
          nameFr: product.nameFr,
          unit: product.unit,
          priceHt: product.priceHt,
          image: product.image,
          quantity,
          lineTotal: quantity * price,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
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
      const specification = (product.specification ?? '').toLowerCase();

      return (
        nameFr.includes(normalizedQuery) ||
        nameZh.includes(normalizedQuery) ||
        reference.includes(normalizedQuery) ||
        specification.includes(normalizedQuery)
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
                  const qty = quantities[product.id] ?? 0;

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={qty}
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
