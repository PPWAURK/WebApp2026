import type { ProductSpecificationItem } from '../../services/productsApi';
import type { Language } from '../../types/language';

export const MAX_ORDER_QUANTITY = 9999;

export type ProductCategory = {
  id: number;
  supplierId: number;
  nameZh: string;
  nameFr: string;
  sortOrder: number;
  isPreset: boolean;
};

export function formatAmount(value: number): string {
  return value.toFixed(2);
}

export function buildOrderItemKey(
  productId: number,
  specificationSlot: number | null,
): string {
  return `${productId}:${specificationSlot ?? 'base'}`;
}

export function formatProductCategoryLabel(
  category: ProductCategory,
  language: Language,
): string {
  return language === 'zh' ? category.nameZh : category.nameFr;
}

export function formatSpecificationLabel(
  specification: ProductSpecificationItem,
): string | null {
  return specification.specification?.trim() || null;
}

export function clampOrderQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(MAX_ORDER_QUANTITY, Math.max(0, Math.floor(value)));
}
