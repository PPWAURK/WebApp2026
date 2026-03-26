import type { AppText } from '../../locales/translations';
import type {
  OrderReturnSummary,
  OrderSummary,
} from '../../services/ordersApi';

export type PeriodKey = '7d' | '30d' | 'this_month' | 'last_month' | 'all';
export type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'items_desc';

export type SupplierOrderGroup = {
  supplierKey: string;
  supplierId: number;
  supplierName: string;
  orders: OrderSummary[];
};

export const PERIODS: Array<{
  key: PeriodKey;
  textKey: keyof AppText['orders'];
}> = [
  { key: '7d', textKey: 'period7d' },
  { key: '30d', textKey: 'period30d' },
  { key: 'this_month', textKey: 'periodThisMonth' },
  { key: 'last_month', textKey: 'periodLastMonth' },
  { key: 'all', textKey: 'periodAll' },
];

export const SORTS: Array<{ key: SortKey; textKey: keyof AppText['orders'] }> =
  [
    { key: 'date_desc', textKey: 'sortDateDesc' },
    { key: 'date_asc', textKey: 'sortDateAsc' },
    { key: 'amount_desc', textKey: 'sortAmountDesc' },
    { key: 'items_desc', textKey: 'sortItemsDesc' },
  ];

export function toDateTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function monthLabel(value: string) {
  return value.slice(0, 7);
}

export function formatAmount(value: number) {
  return value.toFixed(2);
}

export function formatAverage(value: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const rounded = Number(value.toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatReturnTimestamp(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}

export function buildReturnProductsLabel(entry: OrderReturnSummary) {
  const label = entry.items
    .map((item) => {
      const productLabel = item.nameFr.trim() || item.nameZh.trim() || '-';
      return `${productLabel} x${item.quantity}`;
    })
    .join(' / ');

  return label || '-';
}

export function getPeriodLabel(text: AppText, period: PeriodKey) {
  const option = PERIODS.find((entry) => entry.key === period);
  return option ? text.orders[option.textKey] : text.orders.periodAll;
}
