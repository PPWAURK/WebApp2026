import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
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

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);

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
          setError(text.orders.loadError);
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
  }, [accessToken, text.orders.loadError]);

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

  function changeQuantity(productId: number, delta: number) {
    const next = (quantities[productId] ?? 0) + delta;
    const clamped = Math.max(0, next);
    onQuantitiesChange({
      ...quantities,
      [productId]: clamped,
    });
  }

  const supplierProducts = useMemo(() => {
    if (selectedSupplierId === 'ALL') {
      return products;
    }

    return products.filter((product) => product.supplierId === selectedSupplierId);
  }, [products, selectedSupplierId]);

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      return;
    }

    if (!supplierProducts.some((product) => product.category === selectedCategory)) {
      onSelectedCategoryChange('ALL');
    }
  }, [onSelectedCategoryChange, selectedCategory, supplierProducts]);

  const summary = useMemo(() => {
    return supplierProducts.reduce(
      (acc, product) => {
        const qty = quantities[product.id] ?? 0;
        acc.totalItems += qty;
        acc.totalAmount += qty * (product.priceHt ?? 0);
        return acc;
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

    return unique.sort((a, b) => a.localeCompare(b));
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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.orders.title}</Text>
      <Text style={styles.subtitle}>{text.orders.subtitle}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? <Text style={styles.docEmpty}>{text.orders.loading}</Text> : null}

      {suppliers.length > 0 ? (
        <>
          <Text style={styles.uploadFieldTitle}>{text.orders.supplierLabel}</Text>
          <View style={styles.trainingTabRow}>
            {suppliers.map((supplier) => (
              <Pressable
                key={supplier.id}
                style={[
                  styles.trainingTab,
                  selectedSupplierId === supplier.id && styles.trainingTabActive,
                ]}
                onPress={() => {
                  onSelectedSupplierIdChange(supplier.id);
                  onSelectedCategoryChange('ALL');
                }}
              >
                <Text
                  style={[
                    styles.trainingTabText,
                    selectedSupplierId === supplier.id && styles.trainingTabTextActive,
                  ]}
                >
                  {supplier.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {categories.length > 0 ? (
        <>
          <Text style={styles.uploadFieldTitle}>{text.orders.filterLabel}</Text>
          <TextInput
            style={styles.searchInput}
            value={productSearch}
            onChangeText={onProductSearchChange}
            placeholder={text.orders.searchProductsPlaceholder}
            placeholderTextColor="#aa777b"
          />
          <View style={styles.uploadChipWrap}>
            <Pressable
              style={[
                styles.uploadChip,
                selectedCategory === 'ALL' && styles.uploadChipActive,
              ]}
              onPress={() => onSelectedCategoryChange('ALL')}
            >
              <Text
                style={[
                  styles.uploadChipText,
                  selectedCategory === 'ALL' && styles.uploadChipTextActive,
                ]}
              >
                {text.orders.allTypes}
              </Text>
            </Pressable>

            {categories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.uploadChip,
                  selectedCategory === category && styles.uploadChipActive,
                ]}
                onPress={() => onSelectedCategoryChange(category)}
              >
                <Text
                  style={[
                    styles.uploadChipText,
                    selectedCategory === category && styles.uploadChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {!loading && supplierProducts.length === 0 ? (
        <Text style={styles.docEmpty}>{text.orders.empty}</Text>
      ) : null}

      {!loading && supplierProducts.length > 0 && filteredProducts.length === 0 ? (
        <Text style={styles.docEmpty}>{text.orders.emptyForType}</Text>
      ) : null}

      <View style={[styles.listBlock, styles.productGrid]}>
        {filteredProducts.map((product) => {
          const qty = quantities[product.id] ?? 0;
          const productName =
            language === 'zh' ? product.nameZh : product.nameFr ?? product.nameZh;
          const infoRowStyle = isSmallScreen
            ? { flexDirection: 'column' as const, alignItems: 'flex-start' as const }
            : styles.productInfoRow;
          const productGridItemStyle = isSmallScreen
            ? styles.productGridItemSmall
            : styles.productGridItem;
          return (
            <View key={product.id} style={[styles.docItem, productGridItemStyle]}>
              <View style={infoRowStyle}>
                {product.image ? (
                  <View style={[styles.productImageFrame, isSmallScreen && styles.productImageFrameSmall]}>
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImageThumb}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                <View style={[styles.productInfoColumn, isSmallScreen && styles.productInfoColumnSmall]}>
                  <Text style={styles.docItemTitle}>{productName}</Text>
                  {product.reference ? (
                    <Text style={styles.docItemMeta}>
                      {text.orders.referenceLabel}: {product.reference}
                    </Text>
                  ) : null}
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
                  <Text style={styles.docItemMeta}>
                    {text.orders.priceLabel}:{' '}
                    {product.priceHt === null
                      ? text.orders.priceNotAvailable
                      : product.priceHt.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.pillRow}>
                <Pressable
                  style={styles.uploadChip}
                  onPress={() => changeQuantity(product.id, -1)}
                >
                  <Text style={styles.uploadChipText}>-</Text>
                </Pressable>
                <Text style={styles.pill}>
                  {text.orders.quantityLabel}: {qty}
                </Text>
                <Pressable
                  style={styles.uploadChip}
                  onPress={() => changeQuantity(product.id, 1)}
                >
                  <Text style={styles.uploadChipText}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.docBlock}>
        <Text style={styles.docBlockTitle}>{text.orders.summaryTitle}</Text>
        <Text style={styles.docItemMeta}>
          {text.orders.summaryItems}: {summary.totalItems}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.orders.summaryAmount}: {summary.totalAmount.toFixed(2)}
        </Text>
      </View>

      <Pressable
        style={[styles.primaryButton, summary.totalItems === 0 && styles.buttonDisabled]}
        disabled={summary.totalItems === 0}
        onPress={() => {
          onSubmitOrder({
            items: selectedItems,
            totalItems: summary.totalItems,
            totalAmount: summary.totalAmount,
          });
        }}
      >
        <Text style={styles.primaryButtonText}>{text.orders.submitButton}</Text>
      </Pressable>

    </View>
  );
}
