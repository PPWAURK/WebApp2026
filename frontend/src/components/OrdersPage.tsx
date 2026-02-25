import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../locales/translations';
import { fetchProducts, type ProductItem } from '../services/productsApi';
import { fetchSuppliers, type SupplierItem } from '../services/suppliersApi';
import { styles } from '../styles/appStyles';
import type { Language } from '../types/language';

type OrdersPageProps = {
  text: AppText;
  accessToken: string;
  language: Language;
};

export function OrdersPage({ text, accessToken, language }: OrdersPageProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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

        if (supplierResult.length > 0) {
          setSelectedSupplierId((current) =>
            current === 'ALL' ? supplierResult[0].id : current,
          );
        } else {
          setSelectedSupplierId('ALL');
        }
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

  function changeQuantity(productId: number, delta: number) {
    setQuantities((current) => {
      const next = (current[productId] ?? 0) + delta;
      const clamped = Math.max(0, next);
      return {
        ...current,
        [productId]: clamped,
      };
    });
  }

  const summary = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        const qty = quantities[product.id] ?? 0;
        acc.totalItems += qty;
        acc.totalAmount += qty * (product.priceHt ?? 0);
        return acc;
      },
      { totalItems: 0, totalAmount: 0 },
    );
  }, [products, quantities]);

  const supplierProducts = useMemo(() => {
    if (selectedSupplierId === 'ALL') {
      return products;
    }

    return products.filter((product) => product.supplierId === selectedSupplierId);
  }, [products, selectedSupplierId]);

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
    if (selectedCategory === 'ALL') {
      return supplierProducts;
    }

    return supplierProducts.filter((product) => product.category === selectedCategory);
  }, [selectedCategory, supplierProducts]);

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
                  setSelectedSupplierId(supplier.id);
                  setSelectedCategory('ALL');
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
          <View style={styles.uploadChipWrap}>
            <Pressable
              style={[
                styles.uploadChip,
                selectedCategory === 'ALL' && styles.uploadChipActive,
              ]}
              onPress={() => setSelectedCategory('ALL')}
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
                onPress={() => setSelectedCategory(category)}
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

      <View style={styles.listBlock}>
        {filteredProducts.map((product) => {
          const qty = quantities[product.id] ?? 0;
          const productName =
            language === 'zh' ? product.nameZh : product.nameFr ?? product.nameZh;
          return (
            <View key={product.id} style={styles.docItem}>
              <Text style={styles.docItemTitle}>{productName}</Text>
              {product.reference ? (
                <Text style={styles.docItemMeta}>
                  {text.orders.referenceLabel}: {product.reference}
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
      >
        <Text style={styles.primaryButtonText}>{text.orders.submitButton}</Text>
      </Pressable>
    </View>
  );
}
