import type { ProductSpecificationItem } from '../../services/productsApi';

export const MAX_ORDER_QUANTITY = 9999;

export function formatAmount(value: number): string {
  return value.toFixed(2);
}

export function buildOrderItemKey(
  productId: number,
  specificationSlot: number | null,
): string {
  return `${productId}:${specificationSlot ?? 'base'}`;
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
