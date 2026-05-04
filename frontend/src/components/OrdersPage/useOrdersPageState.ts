import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProducts, type ProductItem } from '../../services/productsApi';
import { fetchSuppliers, type SupplierItem } from '../../services/suppliersApi';
import type { AppText } from '../../locales/translations';
import type { OrderRecapData } from '../../types/order';
import { buildOrderItemKey, clampOrderQuantity } from './ordersPage.shared';

type UseOrdersPageStateParams = {
  accessToken: string;
  quantities: Record<string, number>;
  selectedSupplierId: number | 'ALL';
  selectedCategory: string;
  productSearch: string;
  text: AppText;
  onQuantitiesChange: (next: Record<string, number>) => void;
  onSelectedSupplierIdChange: (next: number | 'ALL') => void;
  onSelectedCategoryChange: (next: string) => void;
  onSubmitOrder: (recap: OrderRecapData) => void;
};

export function useOrdersPageState({
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
}: UseOrdersPageStateParams) {
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
        if (!isActive) {
          return;
        }

        setProducts([]);
        setSuppliers([]);
        setHasLoadError(true);
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

    const supplierWithSelectedItems = products.find((product) =>
      product.specifications.some((specification) => {
        const orderItemKey = buildOrderItemKey(product.id, specification.slot);
        return (quantities[orderItemKey] ?? 0) > 0;
      }),
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

  const setQuantity = useCallback(
    (orderItemKey: string, nextQuantity: number) => {
      onQuantitiesChange({
        ...quantities,
        [orderItemKey]: clampOrderQuantity(nextQuantity),
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
        for (const specification of product.specifications) {
          const orderItemKey = buildOrderItemKey(
            product.id,
            specification.slot,
          );
          const quantity = quantities[orderItemKey] ?? 0;

          accumulator.totalItems += quantity;
          accumulator.totalAmount += quantity * (specification.priceHt ?? 0);
        }

        return accumulator;
      },
      { totalItems: 0, totalAmount: 0 },
    );
  }, [quantities, supplierProducts]);

  const selectedItems = useMemo(() => {
    return supplierProducts.flatMap((product) =>
      product.specifications
        .map((specification) => {
          const orderItemKey = buildOrderItemKey(
            product.id,
            specification.slot,
          );
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
    const categorySortOrderByName = new Map<string, number>();

    for (const product of supplierProducts) {
      if (!product.category.trim()) {
        continue;
      }

      const currentSortOrder =
        categorySortOrderByName.get(product.category) ??
        Number.MAX_SAFE_INTEGER;
      const nextSortOrder =
        product.categorySortOrder ?? Number.MAX_SAFE_INTEGER;

      categorySortOrderByName.set(
        product.category,
        Math.min(currentSortOrder, nextSortOrder),
      );
    }

    return Array.from(categorySortOrderByName.entries())
      .sort(([leftName, leftSortOrder], [rightName, rightSortOrder]) => {
        if (leftSortOrder !== rightSortOrder) {
          return leftSortOrder - rightSortOrder;
        }

        return leftName.localeCompare(rightName);
      })
      .map(([category]) => category);
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

  const selectedSupplierOrderNotice = useMemo(() => {
    if (selectedSupplierId === 'ALL') {
      return '';
    }

    return (
      suppliers
        .find((supplier) => supplier.id === selectedSupplierId)
        ?.orderNotice.trim() ?? ''
    );
  }, [selectedSupplierId, suppliers]);

  const supplierProductCountById = useMemo(() => {
    const next = new Map<number, number>();

    for (const product of products) {
      next.set(product.supplierId, (next.get(product.supplierId) ?? 0) + 1);
    }

    return next;
  }, [products]);

  const submitOrder = useCallback(() => {
    onSubmitOrder({
      items: selectedItems,
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount,
    });
  }, [onSubmitOrder, selectedItems, summary.totalAmount, summary.totalItems]);

  return {
    categories,
    filteredProducts,
    handleSelectSupplier,
    hasLoadError,
    loading,
    selectedSupplierName,
    selectedSupplierOrderNotice,
    setQuantity,
    submitOrder,
    summary,
    supplierProductCountById,
    supplierProducts,
    suppliers,
  };
}
